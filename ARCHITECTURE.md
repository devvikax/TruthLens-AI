# System Architecture Document

## TruthLens-AI - Multimodal AI Claim Verification & Investigation Lab
*Tagline: Verify Any Claim. Trust Every Verdict.*

---

## 1. High-Level Architecture Overview

TruthLens-AI operates as a decoupled MERN platform upgraded to support a **Unified Multimodal Claim Verification Pipeline**. The system ingests Text, URLs, Screenshots, PDFs, and Video (YouTube, Reels, X, MP4) feeds, normalizes them into structured text, decomposes the text into claims, verifies each claim independently, and returns granular timeline records and interactive evidence graphs.

```mermaid
graph TD
    Client[React Frontend] -->|1. Submit Media File/Link| Gateway[Express API Backend]
    
    %% Video Pipeline
    Gateway -->|2. If Video| VideoEngine[Video Processing Engine]
    VideoEngine -->|Demux Audio| Whisper[Speech-to-Text Speech Engine]
    VideoEngine -->|Keyframe Extraction| OCR[Frame OCR Engine]
    Whisper -->|Timestamped Text| Merger[Transcript Merger]
    OCR -->|Timestamped Overlay Text| Merger
    
    %% General pipelines
    Gateway -->|2. If PDF| PDFParser[PDF Extractor]
    Gateway -->|2. If Image| ImageOCR[Image Tesseract OCR]
    Gateway -->|2. If URL| Scraper[Web Scraper]
    
    %% Claims Verification Core
    Merger -->|Structured Text| Decomposer[Claim Decomposition Engine]
    PDFParser -->|Structured Text| Decomposer
    ImageOCR -->|Structured Text| Decomposer
    Scraper -->|Structured Text| Decomposer
    
    Decomposer -->|Claims list with Timestamps| Collector[Evidence Collector]
    Collector -->|Parallel queries| FactCheck[Fact-check registries / Wikipedia / Search]
    Collector -->|Compile consensus| VerdictEngine[Verdict & Score Synthesis]
    
    VerdictEngine -->|Dossier JSON| Gateway
    Gateway -->|Interactive Dashboard Response| Client
```

---

## 2. Component Layout & Modular Services

### 2.1 Video Processing Engine (`src/services/videoService.js`)
Handles multimedia conversion and transcript extraction:
1.  **Audio Demuxing**: Isolates sound files from video streams.
2.  **Speech-to-Text**: Formulates speech recognition tracks mapping spoken sentences to relative starting timestamps.
3.  **Frame Sampling & OCR**: Samples key video frames at 3-second intervals, executing frame OCR to capture subtitles or visual overlays.
4.  **Transcript Merger**: Combines audio transcripts and visual texts into a single synchronized structured script, preserving precise timestamps.

---

## 3. Evidence Intelligence System (STR & Deduplication)

### 3.1 Source Trust Registry (STR) Model
The schema `SourceRegistry` persists credibility logs for crawled domains.

### 3.2 Primary Source Detector (Deduplication)
Analyzes evidence snippets using regular expressions to flag syndicated wire content (e.g. *"according to Reuters"* or *"Associated Press reported"*). Aggregates republished entries under a single deduplication key.

### 3.3 Adjacency Relationship Graph Compiler (`graphGenerator.js`)
Compiles a node-link network map of the claims verification chain mapping claims, publishers, wire agencies, and verdicts.

### 3.4 Mathematical Confidence Calculations
Computes confidence percentage mathematically:
$$\text{Confidence} = C_{\text{Quantity}} \cdot 0.20 + C_{\text{Quality}} \cdot 0.35 + C_{\text{Agreement}} \cdot 0.25 + C_{\text{Diversity}} \cdot 0.20$$

---

## 4. Retrieval-Augmented Verification (RAV v3) Engine Architecture

### 4.1 Intelligent Claim Classification Engine (`claimUnderstander.js`)
*   Extracts semantic parameters from raw texts (subject, predicate, object, event, location, negation, intent).
*   Classifies claims into 19 supported categories (Death / Celebrity Death, Health / Medical, Government Announcement, Election / Politics, Crime, Disaster, Financial Scam, Investment, Sports, Entertainment, Science, Space, Education, Historical, Technology, Weather, Business, International Affairs, Social Media Rumor).

### 4.2 Entity Linking Engine (`entityLinker.js`)
*   Maps raw subject names to canonical real-world entities (e.g. "Amitabh" $\rightarrow$ "Amitabh Bachchan").
*   Checks for ambiguity: if link confidence is low ($<60\%$), it flags `requiresClarification: true` along with candidate suggestions.
*   HTTP 409 intercepts trigger a modal select panel on the frontend (`Analysis.jsx`) allowing users to choose the target entity.

### 4.3 Custom Search Generator (`queryGenerator.js`)
*   Dynamically builds 6 distinct queries targeted for the specific claim category (e.g. PubMed for medical, obituaries/spokesperson statements for celebrity deaths).

### 4.4 Verification Strategy Selector (`evidenceCollector.js`)
*   Automatically shifts query routing matrices:
    *   *Death claims* route to fact-checks, obituaries, and official wires (strictly ignoring blogs).
    *   *Health claims* route to PubMed, WHO guidelines, and CDC registries.
    *   *Government claims* route to PIB fact checks and government domains (.gov).
    *   *Space claims* route to NASA, ISRO, ESA, and Nature/Science journals.
*   Maps selection explanations to `whyItMatters` for UI transparency.

### 4.5 Evidence Validator & False Positive Reduction (`evidenceValidator.js`)
*   Evaluates every source against a 100-point metric: Entity Match (30%), Claim/Event Similarity (30%), Fact-check Context (15%), and Source Credibility (20%). Discards items scoring below 50.
*   **False Positive Reduction**: Rejects sources if they mention the entity but discuss a different event, mention the event but reference a different person, or match similar keywords in a different context.

### 4.6 Dynamic Source Prioritization (`trustEngine.js`)
*   Calculates weighted trust scores using dynamic weights tailored to the claim category:
    *   *Health / Medical*: Official confirmation (WHO/CDC) weight elevated to 30%, independent news volume weight reduced to 5% to combat blog spam.
    *   *Government / Election*: Gazette and official PIB confirmation weight elevated to 35%.
    *   *Death*: Source consensus weight elevated to 15% to detect hoaxes early.

### 4.7 Multi-Stage Confidence Engine (`confidenceCalculator.js`)
*   Replaces single overall scores with 5 component-level confidence values:
    1.  *Entity Confidence* (linking precision)
    2.  *Claim Confidence* (parse semantic clarity)
    3.  *Retrieval Confidence* (adapter query coverage)
    4.  *Evidence Confidence* (source reputation & relevance)
    5.  *Verdict Confidence* (degree of source consensus)
*   **Overall Confidence** is calculated as:
    $$\text{Overall} = \text{Entity} \cdot 0.15 + \text{Claim} \cdot 0.15 + \text{Retrieval} \cdot 0.20 + \text{Evidence} \cdot 0.25 + \text{Verdict} \cdot 0.25$$

### 4.8 TTL Cache (`evidenceCache.js`)
*   An in-memory TTL caching layer hashes inputs. Hit entries bypass new crawls and return the cached verification dossier directly (expire time: 2 hours).

### 4.9 RAG Context Grounding (`ragContextBuilder.js`)
*   Compiles structured facts block representing the **sole** allowed source of knowledge for the LLM.

---

## 5. AI Orchestration Layer Architecture

### 5.1 Model Swappability & Config Routing (`aiConfig.js`)
Defines setting parameters for provider priorities, connection timeouts, and exponential backoff retry values. Exposes `orchestrateAiTask(taskName, prompt, isJson)`.

### 5.2 Dynamic Failovers & Retries
If the primary provider throws a connection exception or times out, the orchestrator retries the call using exponential backoffs.

### 5.3 Memory Rate-Limiting Middleware (`rateLimitMiddleware.js`)
Protects backend computational resources. Enforces user tiers limits.

### 5.4 Health & Telemetry Endpoint (`healthRoutes.js`)
Provides checks for the database state, API keys configuration, and queries latency summaries.

---

## 6. Explainability Engine (XAI) Architecture

### 6.1 Explain-Like Style Api Endpoint
Exposes `/api/v1/analysis/:id/explain-like`. Ingests the `style` key (Child, Student, Researcher, Journalist, Developer) and executes a persona-grounded prompt against the AI Orchestration layer.

### 6.2 Courtroom Panels & Claim Folders
*   **Prosecution & Defense Boards**: Renders contradicting (fact-checks) versus corroborating (government/academic/trusted news) source snippets.
*   **Claim Dossiers**: Renders expandable case file cards displaying individual priority levels, source reliability index scores, and verification methods.
*   **Confidence Breakdown**: Visualizes the weighted percentage contributions of Quality, Reliability, Agreement, and Diversity metrics.
*   **Evidence Chain Flowchart**: Traces the 7 sequential backend processing steps from normalization to verdict.

---

## 7. QA Hardening & Graceful Failure Architecture

### 7.1 File Ingestion Whitelisting (`fileUpload.js`)
Strictly whitelists allowed extensions and MIME types:
*   `Images`: `.png`, `.jpg`, `.jpeg`, `.webp` (MIME: `image/*`)
*   `Documents`: `.pdf` (MIME: `application/pdf`)
*   `Videos`: `.mp4`, `.webm`, `.avi`, `.mov` (MIME: `video/*`)
*   Payload size threshold: Max `25MB`.

### 7.2 Graceful Exception Handlers (`analysisController.js`)
*   **PDF Parsing Errors**: Catches exceptions in `pdfService.js` (e.g. from corrupted or password-protected PDF files) and returns user recovery guides.
*   **OCR Scanning Errors**: Catches exceptions in `ocrService.js` (e.g. from blurred, low-resolution screenshots) and prompts the user to upload high-contrast captures.
*   **Video Transcription Errors**: Catches exceptions in `videoService.js` (e.g. from videos without speech tracks) and falls back to frame OCR timelines automatically.

### 7.3 Centralized Error Boundaries (`errorMiddleware.js`)
If `process.env.NODE_ENV === 'production'`, internal code exception stacks are automatically stripped and masked before returning JSON responses to clients, preventing callstack disclosure leaks.

---

## 8. Deployment & Installable PWA Architecture

### 8.1 Progressive Web App Registration (`manifest.json`)
*   Frontend assets directory `/public/manifest.json` defines orientation, start url (`.`), standalone mode, and icon sizes.
*   Linked inside `index.html` headers to support mobile and desktop installation.

### 8.2 Client-Side Route Rewrites (`vercel.json`)
Redirects all relative paths matching `/(.*)` back to the `/index.html` landing page, preventing Vercel static router 404 errors during client page refreshes.
