# Hackathon Pitch & Judge Q&A Guide

## 1. The 30-Second Elevator Pitch

"Every day, millions of people share news on WhatsApp and social media without checking if it’s true, often spreading dangerous misinformation. Standard fact-checkers are slow, and simply asking a chat bot often returns biased, unverified responses.

Enter **TruthLens AI** – *Think Before You Share.* 

TruthLens is a multi-modal verification sandbox. Users can paste text, input links, or drag in screenshots and PDFs. The application extracts the core claims, cross-references them against live global fact-check databases, scores the content's sentiment and bias using Google Gemini, and returns an easy-to-understand breakdown in both English and Hindi. With built-in sharing friction to stop quick forwards and an interactive AI investigation helper, TruthLens is the media literacy shield for the modern web."

---

## 2. 3–5 Minute Demo Walkthrough Flow

*   **Minute 0:00 - Introduction & Theme**
    *   Show the Home Landing page. Highlight the premium glassmorphic dark mode styling. 
    *   Explain the core problem: Clickbait headlines and WhatsApp rumor forwards.
*   **Minute 1:00 - The Judge Demo Desk (Multi-Modal Uploads)**
    *   Go to the Ingestion Screen. Point to the conspicuous **"Judge Demo Desk"** card.
    *   *Action*: Click **NASA Discovery (PDF Document)**. The app switches tabs to PDF, pre-fills the mock attachment, and runs.
    *   *Action*: Click **OS Battery Rumor (Screenshot Image)**. The app switches to OCR Screenshot mode. Explain that the backend uses Tesseract OCR to digitize screenshot texts.
*   **Minute 2:00 - The Stepper & Structured Results**
    *   Hit **Verify Content**. As the analysis processes, show the animated progress stepper detailing stages: Scrapes, Fact Check Searches, Bias checks, and XAI Narrative updates.
    *   Arrive at the **Interactive AI investigation workspace**.
    *   Point out the **Overall Trust Meter** (animated SVG) and the verdict: 🟢 Likely Genuine, 🟡 Needs Verification, or 🔴 Likely Misleading (never binary "Fake" or "Real").
*   **Minute 3:00 - Collapsible Claim Investigation & Sources**
    *   Scroll down to the **Claim Cards**. Expand a card. Explain how the app queries live Fact-Checking registries, returning who checked it, their textual rating, and a citation link.
    *   Show the **Bilingual AI Narrative**: Toggle between English and Hindi, demonstrating that the translation is synthesized instantly without re-querying models.
*   **Minute 4:00 - Interactive Chat & PDF Report**
    *   Toggle the **AI Investigation Chat drawer**. Click the suggestion chip: *WhatsApp reply template* or *Explain like I'm 10*. Show the grounded, contextual assistant reply.
    *   Click **Print / Export PDF**. Present the clean, print-media report view.
*   **Minute 5:00 - "Before You Share" Friction**
    *   Click **Copy Summary** under the warnings. Show the modal confirmation. Highlight that adding friction stops viral shares, encouraging mindful posting.

---

## 3. Innovation Points (Why TruthLens AI Wins)

1.  **Grounded Hybrid Architecture**: We do *not* ask a single LLM "is this true?". Instead, we extract claims, query Google Factcheck databases, and use Gemini strictly as a reasoning engine over verified search inputs.
2.  **Multilingual Slang & Hinglish Normalizer**: Standard translation tools fail on informal Hinglish WhatsApp text forwards. TruthLens AI uses pre-configured Gemini prompts to translate and normalize slang before claim matching.
3.  **Bilingual AI Explainer (Dual-Synthesis)**: Standard localizers run expensive duplicate translation calls. We request Gemini to return English and Hindi narratives simultaneously in the JSON payload, enabling instant UI toggling with zero latency or extra cost.
4.  **Sharing Friction Nudges**: Rather than just showing a score, we change user behavior. The "Copy Summary" warning modal introduces cognitive friction, reminding users of their shared responsibility.
5.  **Clean CSS Print Framework**: Instead of integrating heavy PDF libraries that break on mobile viewports, we deploy print stylesheets (`@media print`), allowing the user's browser engine to natively save clean PDF documents.

---

## 4. Likely Judge Questions & Technical Answers

### Q1: How do you handle unindexed or hyper-local claims that do not exist in the Google Fact-Check registry?
*   *Answer*: "If a claim is entirely new, the system states: *No matching factcheck records found in public registries.* In this case, the Trust Score Engine relies on the other dimensions: Language Neutrality (detecting loaded terms or bias), Emotional Manipulation (flagging panic triggers or sensationalism), and Source Reputation. The verdict resolves to **Needs Verification** instead of guessing or hallucinating."

### Q2: Why use Zustand and a custom Express gateway instead of Next.js or Firebase?
*   *Answer*: "We chose a decoupled React client and Node/Express backend for performance and flexibility. Zustand keeps our frontend state footprint minimal and fast on mobile. Node.js is perfect for coordinating concurrent file uploads, OCR processing (Tesseract), and HTML scrapers in parallel, maintaining high throughput."

### Q3: Tesseract OCR can degrade on blurry images. How do you mitigate this?
*   *Answer*: "Our pipeline enforces strict file size boundaries (10MB) and accepts standard PNG/JPG/WEBP files. If Tesseract fails to detect text rows due to blur, our Express controller catches the error gracefully, returning a notification advising the user to upload a high-contrast capture. In production, we can append pre-processing utilities (greyscale and threshold adjustments)."

### Q4: How scalable is the Google Gemini API integration under heavy hackathon judge traffic?
*   *Answer*: "We optimize API efficiency by returning structured JSON with the `responseMimeType: 'application/json'` configuration, ensuring we get all parameters (claims, entities, bias, translations, and summaries) in a single round-trip call. To scale in production, we implement MD5 text caching to return pre-computed results for repeated requests."
