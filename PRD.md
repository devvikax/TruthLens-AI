# Product Requirements Document (PRD)

## TruthLens AI
*Tagline: Think Before You Share.*

---

## 1. Executive Summary & Foundations

### 1.1 Product Vision
To cultivate a critical-thinking digital society where information sharing is guided by reflection, awareness, and verification. **TruthLens AI** is not merely a tool for labeling content as "true" or "false"; it is a cognitive assistant designed to help users pause, evaluate *why* content might be misleading, and understand the rhetorical and factual elements of media before they propagate it.

### 1.2 Mission Statement
Our mission is to democratize media literacy by providing an accessible, transparent, and explainable content analysis engine. We aim to equip users of all ages and backgrounds with the insights needed to identify bias, emotional manipulation, and factual discrepancies in digital media.

### 1.3 Problem Statement
The digital information ecosystem is saturated with misinformation, clickbait, and emotionally charged fabrications designed to go viral. Traditional fact-checking platforms suffer from several limitations:
1. **Binary Verdicts**: Labeling content simply as "Fake" or "Real" creates polarization and ignores nuances like out-of-context facts or cherry-picked data.
2. **Lack of Explanation**: Users are told *what* to believe but not *why*, failing to build long-term media literacy.
3. **High Cognitive Barriers**: Fact-checking sites are often text-heavy, academic, and difficult for non-technical, younger, or elderly users to navigate.
4. **Frictionless Sharing**: Modern platforms enable instantaneous sharing of unverified claims, bypassing critical cognitive checks.

---

## 2. Target Audience & User Personas

### 2.1 Target Users
*   **The Family Networker**: Active on messaging apps (e.g., WhatsApp, Telegram), frequently receiving and forwarding posts.
*   **Students & Young Learners**: Using social media (e.g., Instagram, X, YouTube) for research and daily consumption, needing to develop digital literacy.
*   **Active Citizens & Content Consumers**: Individuals seeking to verify news stories before referencing them in discussions or social posts.
*   **Elderly Users**: Frequently targeted by scams, misleading health tips, and politically charged misinformation, needing high-contrast, large-text, simple interfaces.

### 2.2 User Personas

#### Persona A: Ramesh (62, Retired Bank Manager)
*   **Bio**: Ramesh lives in Indore, India. He spends 3–4 hours daily on his smartphone, primarily using WhatsApp and Facebook to connect with friends and family.
*   **Pain Points**: Struggles with small text fonts, complex navigations, and English-only platforms. Often forwards health remedies and emotional news updates to family groups without knowing how to check if they are genuine. He feels anxious about spreading false news but lacks the tools to verify them easily.
*   **Goals**: A simple way to paste a message or upload a screenshot (often in Hindi or Hinglish) and get an immediate, easy-to-read explanation in Hindi.

#### Persona B: Aisha (19, Undergraduate Journalism Student)
*   **Bio**: Aisha lives in Delhi. She uses social media for news gathering and writes articles for her college magazine.
*   **Pain Points**: Needs rapid verification of claims, source analysis, and a structured breakdown of logical fallacies or emotional bias. Finding sources and citations takes too long.
*   **Goals**: Wants a "Deep Analysis" mode that crawls trusted databases, extracts claims, detects emotional manipulation, and generates downloadable reports with citations to cross-reference quickly.

---

## 3. Success Metrics (KPIs)

*   **User Engagement**: Average duration of active analysis sessions; percentage of analyses completed.
*   **Nudge Effectiveness**: Rate of "Before You Share" interactions (users who copy the shareable summary instead of direct copy-pasting the original unverified claim; users who pause on the sharing confirmation).
*   **Accuracy & Trust**: Ratio of verified cross-references; user feedback score on explanation clarity (target: >85% satisfaction).
*   **System Performance**: Average response time for "Quick Check" (target: <3 seconds) and "Deep Analysis" (target: <10 seconds).
*   **Accessibility Adherence**: 100% WCAG 2.1 AA compliance across all components.

---

## 4. Analysis Modes

TruthLens AI supports two primary analysis modes tailored to user intent and cognitive load.

```
                  +-----------------------------------+
                  |        User Inputs Content        |
                  +-----------------------------------+
                                    |
                  +-----------------+-----------------+
                  |                                   |
                  v                                   v
      +-----------------------+           +-----------------------+
      |      Quick Check      |           |     Deep Analysis     |
      |   (Immediate Nudge)   |           |  (Comprehensive Check)|
      +-----------------------+           +-----------------------+
      | * Fast API Pipeline   |           | * Deep NLP Pipelines  |
      | * High-Level Bias     |           | * Multi-Source Check  |
      | * Core Trust Meter    |           | * Bias & Manipulation |
      | * Verdict/Nudge       |           | * Fact Citations      |
      | * 2-3 Sentences Expl. |           | * Downloadable Report |
      +-----------------------+           +-----------------------+
```

### 4.1 Quick Check Mode (Default)
*   **Purpose**: Immediate evaluation for users in a rush.
*   **Input Types**: Manual Text, URLs, Social Media Posts.
*   **Outputs**:
    *   **Trust Meter**: A visual gauge ranging from 0 to 100 with distinct zones (Credible, Caution, High Risk).
    *   **Primary Flag**: (e.g., "Credible Source", "Biased Language Detected", "Unverified Claim").
    *   **One-Sentence Explanation**: Under 25 words, written in simple, non-academic language.
    *   **Friction Nudge**: A call-to-action button (e.g., "Analyze Deeper" or "Think Before You Share").

### 4.2 Deep Analysis Mode
*   **Purpose**: Thorough investigation for critical claims, documents, and visual evidence.
*   **Input Types**: Screenshots, PDFs, News Articles, URLs, and Manual Text.
*   **Outputs**:
    *   **Multi-Dimensional Score**: Breaking down Trust into Source Credibility, Emotional Bias, Logical Coherence, and Cross-Reference status.
    *   **Language & Text Extraction Logs**: Summary of the extracted text (from OCR/PDF).
    *   **Emotional & Rhetorical Manipulation Engine**: Highlights specific sentences utilizing fear, urgency, or anger.
    *   **Entity & Claim Extraction**: List of major assertions found in the content.
    *   **Cross-Referenced Sources Table**: Clickable citations pointing to verified fact-checking platforms (e.g., Alt News, Boom Live, PIB Fact Check, Snopes, PolitiFact) and high-credibility news outlets.
    *   **Explainable Verdict (Explainable AI)**: A structured breakdown of *why* the trust score was assigned, summarizing findings in bullet points.
    *   **Exportable PDF Report**: Clear, printable document detailing the analysis for offline sharing.

---

## 5. Functional Requirements

### 5.1 Content Input & Extraction
*   **FR-1.1**: The system must accept raw text inputs up to 10,000 characters.
*   **FR-1.2**: The system must accept URLs and scrape the primary article content, discarding boilerplate elements like navigation, ads, and footers.
*   **FR-1.3**: The system must accept image uploads (PNG, JPEG, WebP) representing screenshots of social media posts (X, Facebook, WhatsApp, Instagram).
*   **FR-1.4**: The system must support PDF uploads up to 10MB and extract text from native text layers.
*   **FR-1.5**: The system must execute OCR on screenshots, converting low-resolution or skewed text into clean digital characters.

### 5.2 Core Analysis Engine (NLP & AI Pipeline)
*   **FR-2.1**: The system must detect the primary language of the text.
*   **FR-2.2**: The system must support bilingual analysis, handling **English** and **Hindi** inputs, with cross-translation for cross-referencing global databases.
*   **FR-2.3**: The system must identify key entities (People, Organizations, Locations) and claims (factual statements that can be verified).
*   **FR-2.4**: The system must analyze tone, classifying text based on emotional indicators (e.g., Fear, Anger, Sarcasm, Sensationalism, Neutral).
*   **FR-2.5**: The system must calculate a numeric **Trust Score (0-100)** based on weighted parameters.
*   **FR-2.6**: The system must query trusted fact-checking databases and search indices to find matching or refuting stories.

### 5.3 User Interaction & Account System
*   **FR-3.1**: The system must allow complete analysis functionality to Guest users without requiring registration.
*   **FR-3.2**: The system must provide an optional user signup/login (OAuth/Email) to save historical analyses.
*   **FR-3.3**: The system must allow logged-in users to view their history, categorize past analyses, and export cumulative reports.
*   **FR-3.4**: The system must feature an interactive AI Chat sidebar in Deep Analysis, enabling users to ask follow-up questions about the analysis (e.g., *"What is the context of this quote?"*).

### 5.4 "Before You Share" Friction Feature
*   **FR-4.1**: When a user attempts to copy text from a flagged analysis or clicks "Share", the system must display an overlay modal asking: *"Are you sure you want to share this unverified claim?"*
*   **FR-4.2**: The modal must display a "Share Contextual Summary" option, letting the user share a consolidated text block that contains the trust score, the flagged claim, and the fact-check link, promoting healthy sharing habits.

---

## 6. AI & NLP Pipeline Specifications

### 6.1 NLP Pipeline Flow

```
+---------------+      +--------------------+      +--------------------+
| Input Content | ---> | Language Detection | ---> | Translation Engine |
+---------------+      +--------------------+      +--------------------+
                                                            |
                                                            v
+-----------------------+      +--------------------+      +--------------------+
|  Bias & Tone Check    | <--- |  Claim Extraction  | <--- | Entity Recognition |
+-----------------------+      +--------------------+      +--------------------+
            |
            v
+-----------------------+      +--------------------+      +--------------------+
| Cross-Reference Search| ---> | Score Calculation  | ---> |  Explainable Nudge |
+-----------------------+      +--------------------+      +--------------------+
```

1.  **Language Detection**: Analyzes text block. If language is Hindi (or Hinglish), routes to specific models or uses high-fidelity translation wrappers.
2.  **Entity & Claim Extraction**: Employs Named Entity Recognition (NER) to pull key actors and extract core assertions (e.g., *"COVID-19 vaccine contains microchips"*).
3.  **Tone & Emotional Manipulation Detection**: Flags linguistic tricks, hyperbole, and emotional cues designed to trigger sharing (e.g., *"MUST SHARE BEFORE IT GETS DELETED!!!"*).
4.  **Cross-Referencing**: Searches indexed repositories of verified fact-checks and trusted media outlets using extracted entity-claim pairs.
5.  **Explainable AI (XAI) Synthesis**: Converts system variables (scores, citations, emotional flags) into a narrative structured for children and elderly users.

### 6.2 Trust Score Logic (High Level)
The overall Trust Score ($S_{trust}$) is calculated using a weighted system of four key metrics:

\[S_{trust} = w_1 \cdot C_{source} + w_2 \cdot B_{tone} + w_3 \cdot V_{claims} + w_4 \cdot E_{context}\]

Where:
*   $C_{source}$ (Source Reputation): Matches the URL or entity against a whitelist of verified outlets (100) or known misinformation domains (0).
*   $B_{tone}$ (Bias and Tone): Scoring based on the presence of sensationalism, logical fallacies, and high-intensity emotional triggers (Neutral/Informative = 100, Extreme Rage/Sensationalism = 0).
*   $V_{claims}$ (Claim Verification): Scoring based on whether fact-checking databases have analyzed this claim (Verified True = 100, Disputed = 50, Debunked = 0). If no direct match is found, queries high-authority secondary sources.
*   $E_{context}$ (Context & Coherence): Consistency check of dates, image metadata (if available), and surrounding text.
*   **Weights**: $w_1 = 0.25, w_2 = 0.20, w_3 = 0.45, w_4 = 0.10$.

### 6.3 OCR Support & Scraper Strategy
*   **OCR**: Standardize preprocessing (greyscale conversion, thresholding, deskewing) on incoming screenshots before running OCR to handle low-light or low-quality mobile uploads.
*   **Scraper**: Employs headless browsing or reading proxies to fetch URL bodies, stripping CSS/JS/Tracking parameters to isolate news body text.

---

## 7. Design & UI/UX Philosophy

### 7.1 UX Principles
1.  **Safety First**: Avoid aggressive red warnings that spark panic. Use descriptive, calm indicators (e.g., HSL-based warnings: Warm Amber for Caution, Slate for Neutral, Deep Jade for Verified).
2.  **No Placeholders**: Every element must contain realistic mock data during testing to represent real-life utility.
3.  **Maximum Accessibility**: Text sizing, tap target spacing (>48px), and layout structures must fully support screen readers and users with hand tremors.
4.  **Explainability Over Verdicts**: Instead of displaying "FAKE NEWS", the UI lists the findings: *"This image was taken in 2018, not last week,"* or *"The headline matches, but the text is misleading."*

### 7.2 Interface Layout (Mobile-First)
*   **Home Screen**: Features a large, friendly search bar or upload box. One-tap actions to paste links or upload screenshots.
*   **Analysis Result**: Split view starting with a large, color-coded gauge (Trust Meter) and a short summary, followed by a secondary section for detailed breakdowns (Bias, Source, Fact-Check Links).
*   **Languages Toggle**: Sticky header button for instant English $\leftrightarrow$ Hindi translation of the interface.

---

## 8. Non-Functional Requirements

### 8.1 Performance Goals
*   **Lighthouse Score**: >90 for Performance, Accessibility, and Best Practices.
*   **Time to Interactive (TTI)**: <1.5 seconds on a standard 3G connection.
*   **Scalability**: API structure built to handle peak loads (e.g., viral news cycles) using serverless endpoint structures or horizontal container scaling.

### 8.2 Security Goals
*   **Data Minimization**: Guest analysis inputs are processed in-memory and are not stored unless requested by a logged-in user.
*   **Rate-limiting**: IP-based rate limiting on content submission endpoints to prevent automated spamming of NLP APIs.
*   **Input Sanitization**: Strict filters for raw text, file uploads, and URL parameters to prevent cross-site scripting (XSS) and remote code execution (RCE).

### 8.3 Accessibility Requirements
*   **WCAG 2.1 AA Compliance**: All text contrast ratios must meet or exceed 4.5:1.
*   **Aria Labels**: Mandatory on all custom forms, buttons, and trust meter gauges.
*   **Screen Reader Friendly**: Visual diagrams (like the trust meter) must have semantic text descriptions.

---

## 9. Edge Cases & Error Handling Philosophy

### 9.1 Edge Cases
*   **Unidentifiable Claims**: When content contains new, local, or highly localized claims not present in fact-check databases.
    *   *Mitigation*: The system must not flag the claim as fake. It must label it "Unverified/New Claim", lower the $V_{claims}$ score slightly, and advise users: *"This is a very new topic. Wait for trusted outlets to publish reports before sharing."*
*   **Mixed Credibility Articles**: An article contains mostly true facts but features a highly sensational, misleading headline.
    *   *Mitigation*: Separate analysis of Title vs. Body, highlighting the gap to the user.
*   **OCR Failures**: Highly blurred or handwritten screenshots.
    *   *Mitigation*: Gracefully request the user to type the text manually or crop the key section.

### 9.2 Error Handling Philosophy
TruthLens AI must never crash or show cryptic error codes (e.g., `Error 500: Internal Server Error`). All errors must be humanized and actionable:
*   *"We couldn't read the article at this link. It might be behind a paywall. Please copy and paste the text directly."*
*   *"The uploaded image is too blurry. Try taking a cleaner screenshot of just the text."*
*   *"We are experiencing high traffic. Running a Quick Check instead of Deep Analysis to save time."*

---

## 10. Assumptions, Risks & Limitations

### 10.1 Assumptions
*   High-fidelity LLM APIs (e.g., Gemini) remain active and cost-efficient for text parsing, translation, and tone analysis.
*   Standard fact-checking database registries (such as Google Fact Check Tools API) remain accessible.

### 10.2 Risks & Mitigations
*   **Risk**: AI Hallucination. The model itself generates inaccurate explanations during Deep Analysis.
    *   *Mitigation*: Implement strict system prompts for the LLM, restricting it from generating claims not directly backed by its search results or input text. Always prioritize direct quotes from retrieved factcheck citations.
*   **Risk**: API costs spiral out of control during high-viral news periods.
    *   *Mitigation*: Implement aggressive caching of analyzed URLs and text hashes. If a link has been analyzed in the last 2 hours, return the cached result.

### 10.3 Limitations
*   Real-time video verification is excluded from the current scope.
*   Closed-network verification (e.g., encrypted WhatsApp groups) is impossible; the user must manually copy the text or upload screenshots to analyze them.
