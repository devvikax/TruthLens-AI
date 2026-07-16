# Product Requirements Document (PRD)

## VeriLens AI - Multimodal AI Claim Verification & Investigation Lab
*Tagline: Verify Any Claim. Trust Every Verdict.*

---

## 1. Executive Summary & Foundations

### 1.1 Product Vision
To transform how information is audited in the digital age. **VeriLens AI** is a professional-grade **Multimodal AI Claim Verification & Investigation Lab**. Styled as an AI forensic workspace, it never immediately produces a monolithic verdict. Instead, it systematically investigates content step-by-step—mirroring a human fact-checker—and populates an interactive **Investigation Board** containing claim dossiers, Trust DNA indicators, and source credibility explorers.

### 1.2 Mission Statement
Our mission is to democratize digital forensics by providing a transparent, evidence-based claim verification framework. We replace raw binary verdicts with granular, forensic-style timelines and source cross-examinations, empowering citizens to inspect the exact evidentiary DNA of any media before sharing it.

### 1.3 Problem Statement
Monolithic "fake news" detectors fail modern media:
1.  **Immediate Verdict Bias**: Telling a user something is "Fake" immediately triggers political defensiveness. Allowing users to follow the step-by-step investigation journey establishes credibility.
2.  **No Evidentiary Tracking**: Users are shown verdicts without seeing what evidence supported it, what was missing, or what contradicted it.
3.  **Lack of Source Accountability**: There is no easy way to explore who reported a claim originally versus who syndicated or copied it.

---

## 2. Core Product Principles

1.  **Investigation Over Monolithic Verdicts**: The platform behaves like an investigator, presenting sequential evidence tracking before resolving verdicts.
2.  **Multidimensional Trust DNA**: Credibility is evaluated across 9 specific vectors, replacing flat scores with a visual "DNA map".
3.  **Granular Claim Dossiers**: Every assertion extracted from text or video transcripts becomes an independent case file containing source statistics, contradiction matrices, and coverage audits.

---

## 3. Detailed Input Pipelines

### 3.1 Plain Text & Articles
`Text/URL → HTML Cleanup → Claim Extraction → Independent Verification → Verdict`

### 3.2 Images & Screenshots
`Image/Screenshot → Preprocessing (Binarization, Thresholding) → OCR Engine → Extracted Text → Claim Extraction → Independent Verification → Verdict`

### 3.3 Documents (PDFs)
`PDF File → Text Layer Extraction → Formatted Text → Claim Extraction → Independent Verification → Verdict`

### 3.4 Video Processing (YouTube, Reels, X, Local Uploads)
`Video → Audio Demuxing → Speech-to-Text (Whisper API/Mock) + Frame Sampling (keyframes every 3s) → Frame OCR → Merged Transcript (Transcript Text + Screen Text mapped to Timestamps) → Claim Extraction → Independent Verification → Verdict`

---

## 4. Key Functional Requirements (FRs)

### 4.1 Input Ingestion & Processing
*   **FR-1.1**: The system must support text pastes, URLs, screenshots (PNG, JPG, WebP), PDFs, and videos (YouTube links, Reels, X links, MP4 uploads).
*   **FR-1.2**: For videos, the system must demux audio, run speech recognition, sample key video frames, extract text via OCR, and merge them into a unified transcript with preserved timestamps.

### 4.2 Claim Decomposition & NER
*   **FR-2.1**: The engine must parse the cleaned transcript/text and split it into distinct claims.
*   **FR-2.2**: Each claim must receive a Unique ID, Original Text, Normalized Text, Timestamp (if from video), Priority (high/medium/low), Entities list, and Confidence rating.

### 4.3 Multi-Source Evidence Collector
*   **FR-3.1**: The collector must query fact-check registries, Wikipedia, and live search engines in parallel for every claim.
*   **FR-3.2**: Domain sources must be evaluated dynamically: government and academic sources are assigned higher reliability weights, while unverified forums are penalized.

### 4.4 Redesigned Results Page & Investigation Widgets
*   **FR-4.1 (Interactive Timeline)**: For videos, display a visual timeline (e.g., `00:45 - Verified True`, `01:52 - Verified Fake`). Clicking a timeline card must seek the video player to that exact timestamp.
*   **FR-4.2 (Interactive Evidence Graph)**: Display an interactive graph tracing the relationship between claims, supporting/contradicting sources, fact-check matches, and the final verdict.
*   **FR-4.3 (Live Verification Journey)**: Show an animated step-by-step log of the AI's reasoning phases (e.g. `Uploading...` → `Extracting Audio...` → `Claim Decomposition...` → `Consensus Search...` → `Verdict Resolved`) during analysis.
*   **FR-4.4 (AI Explainer Hub)**: An interactive chat sidebar allowing users to query evidence, ask follow-up questions, or translate the report into English/Hindi. The AI only summarizes and explains, rather than deciding truth itself.

### 4.5 Forensic PDF Report Exports
*   **FR-5.1**: Users can download a structured print report containing the Content Summary, Video Transcript (with timestamps if applicable), Claims Table, Contradiction Analysis, badges, and sharing advice.

---

## 5. Non-Functional Requirements (NFRs)

*   **NFR-1 (Accessibility)**: Conform to WCAG 2.1 AA. Screen readers must be able to read timeline steps. All interactive buttons must have target sizes $\ge 48\text{px}$.
*   **NFR-2 (Performance)**: Video transcript preprocessing must run asynchronously with progressive feedback logs sent to the client to keep perceived latency low.
*   **NFR-3 (Bilingualism)**: Support English and Hindi toggles across the entire results layout and reports.

---

## 6. Source Trust Registry & Backend Intelligence Requirements

### 6.1 Source Trust Registry (STR)
The backend must support an internal Source Trust Registry storing:
*   Domain Name, Category (Government, Academic, Regional, International, Independent Blog).
*   Official Status (Boolean), known reliability (0-100), and verification methods.

### 6.2 Primary Source Detector (Deduplication)
The system must identify syndicated content (e.g., blogs republishing Reuters or AP wires) to prevent inflated source counts. Multi-channel diversity metrics are computed using deduplicated primary nodes.

### 6.3 Mathematical Confidence Calculations
Confidence ratings must not be generated via LLM prompt heuristics. Instead, the backend must apply:
$$\text{Confidence} = \text{Quantity} \cdot 0.20 + \text{Quality} \cdot 0.35 + \text{Agreement} \cdot 0.25 + \text{Diversity} \cdot 0.20$$
With a step-by-step transparency log returned in the JSON payload explaining the components.

---

## 7. Retrieval-Augmented Verification (RAV v2) Engine Requirements

### 7.1 Claim Classification Engine
Before any search begins, the system parses the user's input to extract semantic factual parameters and classifies the claim into one or more of the 19 supported categories (Death / Celebrity Death, Health / Medical, Government Announcement, Election / Politics, Crime, Disaster, Financial Scam, Investment, Sports, Entertainment, Science, Space, Education, Historical, Technology, Weather, Business, International Affairs, Social Media Rumor).

### 7.2 Entity Linking Engine
Replaces simple keyword matching. It resolves raw subjects to canonical real-world entities (person, organization, location) and computes a confidence level:
*   **Ambiguity Interceptor**: If the entity confidence is low ($<60\%$) or highly ambiguous (e.g. just "Amitabh" or "Zubair"), the backend returns `requiresClarification: true` alongside candidate options.
*   **Clarification Dialog**: The frontend intercepts this response (HTTP 409) and prompts the user to select the intended entity before starting the crawl.

### 7.3 Verification Strategy Selector & Dynamic Source Prioritization
The verification strategy automatically adapts based on the detected claim category:
*   **Celebrity Death**: Prioritizes family announcements, hospital bulletins, and trusted news wires; strictly rejects independent blogs and requires multiple confirmations.
*   **Health / Medical**: Prioritizes WHO guidelines, CDC bulletins, and peer-reviewed journals; elevates official confirmation weight in the trust engine.
*   **Government Announcements**: Prioritizes Press Information Bureau (PIB) and official `.gov` portals.
*   **Space / Science**: Prioritizes space agencies (NASA, ISRO) and Nature/Science journals.
*   **Financial Scam**: Prioritizes regulatory warning lists (RBI, SEBI, SEC) and official yojana checkers.

### 7.4 Query Intelligence & Bidirectional Retrieval
*   **Multi-Query Generator**: Generates 6 category-specific queries targeting optimal platforms (e.g. searching obituaries for death claims, PubMed for medical claims).
*   **Bidirectional Crawl**: Searches both supporting and contradicting directions in parallel to collect all viewpoints before verdict calculations.

### 7.5 Evidence Validator & False Positive Reduction
*   Every retrieved article is analyzed against the claim metadata and canonical entity.
*   **Relevance Scoring**: Computes a 100-point score based on Entity Match (30%), Claim/Event Similarity (30%), Fact-check Context (15%), and Source Credibility (20%). Discards sources scoring below 50.
*   **False Positive Reduction**: Rejects sources if they discuss a different event, similar keywords in a different context, or reference a different person.
*   **Selection Explanation**: Attaches a detailed note on why specific sources were prioritized (e.g. *"WHO and peer-reviewed journals were prioritized over general news websites for this Health claim."*).

### 7.6 Multi-Stage Confidence & Grounding Safeguards
*   **Multi-Stage Confidence**: Replaces single overall scores with 6 distinct validation gates: Entity, Claim, Retrieval, Evidence, Verdict, and Overall Confidence scores.
*   **RAG Context Grounding**: Compiles an audited Markdown fact dossier representing the **sole** allowed source of knowledge for the LLM during narrative generation.
*   **Freshness Decay & Conflict Resolution**: Applies date-based freshness multipliers and reduces confidence if contradicting sources are detected.

---

## 8. AI Orchestration Layer Requirements

### 8.1 Model Swappability & Decoupled Task Routing
*   The platform must isolate LLM prompt executions from business logic. Every AI query must route through `aiOrchestrator.js`.

### 8.2 Failover Strategy & Retry Mechanisms
*   The orchestrator must try primary providers (e.g. OpenRouter) first and, in case of persistent errors, fail over to backup channels (e.g. Google Gemini Direct SDK).
*   Requests must retry with exponential backoffs (e.g., initial 1000ms delay with a factor of 2) before declaring provider downtime.

### 8.3 Observability & Admin Health Checks
*   **Observability telemetry**: The system must monitor task latencies, retry ratios, and query status.
*   **Health API Node**: Expose an endpoint `/api/v1/health` checking MongoDB state, OpenRouter connectivity, Gemini SDK status, and average processing speeds.

### 8.4 User Tiers Rate Limiting
*   Abuse prevention rules must throttle requests:
    *   **Guests**: restricted to 5 audits per hour.
    *   **Authenticated accounts**: restricted to 60 audits per hour.

---

## 9. Explainability Engine (XAI) Requirements

### 9.1 AI Courtroom Experience
*   The UI must adopt a courtroom theme presenting Verdict Cards, Prosecution/Defense panels, Judge Panels, and Evidence Chains.

### 9.2 Evidence Chain & Source Justification
*   **Evidence Chain**: An interactive step-by-step flowchart showing the entire processing trail from normalization to verdict.
*   **Source Justification**: Expands every source reference to answer reliability index, data age, and primary status.

### 9.3 Persona Explainer ("Explain Like...")
*   Allow users to toggle explanation narrative styles dynamically (Child, Student, General Public, Researcher, Journalist, and Developer).

---

## 10. Production Hardening & Graceful Failover Specifications

### 10.1 Whitelisted File Upload Integrity
*   Upload configurations must strictly restrict payloads to images (PNG, JPEG, WebP), documents (PDF), and videos (MP4, WebM, AVI, MOV), capping size limits at 25MB.

### 10.2 Graceful Degradation on Input Exceptions
*   If an uploaded PDF is corrupted, or if Tesseract fails on a low-resolution screenshot, the controller must catch the error and present a helpful user recovery instruction rather than throwing raw stack traces.
*   If a video upload lacks audio speech tracks, Whisper transcription must fail over to keyframe OCR extraction.

### 10.3 Production Error Masking
*   In production configurations, all error boundaries must mask internal exception callstacks, returning clean JSON payloads.

---

## 11. PWA & Demo Mode Requirements

### 11.1 Progressive Web App Capabilities
*   **PWA manifests**: Expose `manifest.json` describing standalone orientation, start URLs, name, icons, and theme parameters (`#3b82f6`) to support desktop/mobile installation.

### 11.2 Interactive Resettable Demo Sandbox
*   **Demo Desk**: The main landing workspace must render an interactive segment loading curated examples for Verified True, Verified False, Misleading, Breaking News, YouTube video link, X post link, Screenshot upload, and PDF document checks.
*   **One-Click Resetter**: Embody a clear button to purge all input fields in a single click, allowing judges to start fresh audits easily.
