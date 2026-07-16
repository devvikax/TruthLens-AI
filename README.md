# VeriLens AI

> **Verify Any Claim. Trust Every Verdict.**

VeriLens AI is a professional-grade **Multimodal AI Claim Verification & Investigation Lab**. Styled as an interactive digital courtroom, it rejects monolithic "fake vs real" binary verdicts. Instead, it guides the user step-by-step through a transparent forensic investigation journey, exposing claim dossiers, dynamic Source Trust ratings, and the underlying mathematical confidence scores.

---

## 1. Problem & Key Innovations

### 1.1 The Problem
Traditional fake-news detectors suffer from:
1.  **Immediate Verdict Bias**: Telling a user something is "Fake" immediately triggers defensiveness. Guided evidentiary journeys build trust.
2.  **Opacity & Hallucinations**: Standard LLMs give opinions about truth based on stale training weights, generating plausible-sounding hallucinations without traceable citations.
3.  **Source Duplication**: Syndicated wire reports (e.g. AP/Reuters republishers) inflate search statistics, causing false consensus.

### 1.2 Key Innovations
*   **AI Courtroom**: Results are presented as a forensic case. Users explore the **Prosecution** (evidence against), **Defense** (evidence supporting), and the **Judge's logic** explaining why sources were weighed or ignored.
*   **Dynamic Verification Strategy Selector**: The engine automatically classifies claims into 19 categories (e.g. Death, Medical, Space, etc.) and routes adapters accordingly, dynamically adjusting source trust weights and filtering false positives.
*   **Developer Telemetry Console**: Access a hidden, forensic-grade debugging sandbox at `/developer` to inspect original inputs, normalized statements, queries, discarded sources, and raw LLM traces.
*   **Decoupled Multi-Layer Retrieval**: Parallel semantic, keyword, and entity search adapters query fact-check registries, academic repositories, and live search engines concurrently.
*   **Source Trust Registry (STR)**: A persistent DB-backed registry mapping domain categorization and credibility weighting factors.
*   **Multi-Stage Confidence DNA**: Confidence is resolved across 5 component validation gates (Entity, Claim, Retrieval, Evidence, and Verdict) using the formula:
    $$\text{Overall} = \text{Entity} \cdot 15\% + \text{Claim} \cdot 15\% + \text{Retrieval} \cdot 20\% + \text{Evidence} \cdot 25\% + \text{Verdict} \cdot 25\%$$
*   **PWA Installable**: Fully compatible Progressive Web App manifest for standalone mobile/desktop usage.

---

## 2. Architecture & File Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers (analysis, chat, authentication)
│   │   ├── middleware/       # Rate limiters, security parameters, error boundaries
│   │   ├── models/           # Mongoose schemas (Analysis, SourceRegistry, User)
│   │   ├── routes/           # REST endpoints
│   │   ├── services/
│   │   │   ├── evidenceEngine/
│   │   │   │   ├── adapters/ # Decoupled search crawlers (news, government, academic)
│   │   │   │   ├── index.js  # Modular Evidence Engine coordinator
│   │   │   ├── aiOrchestrator.js # Task router with exponential failover retries
│   │   │   ├── videoService.js   # Whisper transcription & Keyframe OCR parser
│   │   └── server.js         # Port listener & Atlas database triggers
└── frontend/
    ├── public/               # Static assets & PWA manifest.json
    ├── src/
    │   ├── components/       # TrustGauge, Navigation bar, Footers, Upload zones
    │   ├── store/            # Zustands global data stores
    │   ├── pages/
    │   │   ├── Analysis.jsx  # Submission form & Curated Demo Mode sandboxes
    │   │   ├── Results.jsx   # XAI Courtroom dashboards & persona switchers
```

---

## 3. Getting Started Locally

### 3.1 Prerequisites
*   Node.js (v18 or higher)
*   MongoDB (local instance or MongoDB Atlas account)

### 3.2 Environment Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_jwt_key
OPENROUTER_API_KEY=your_openrouter_or_gemini_key
NODE_ENV=development
```

### 3.3 Installation
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3.4 Running the Application
```bash
# Start backend dev server (from backend directory)
npm run dev

# Start frontend dev client (from frontend directory)
npm run dev
```

---

## 4. Production Deployment

### 4.1 Frontend (Vercel)
The client includes `vercel.json` to handle client-side routes. Deploy to Vercel via:
```bash
cd frontend
vercel
```

### 4.2 Backend (Render / Railway)
Set environment variables on Render/Railway. The server is configured to automatically serve static folders and bind dynamic ports.

---

## 5. Technology Stack
*   **Frontend**: React (Vite), TailwindCSS-compatible CSS variables, Lucide icons, Zustands.
*   **Backend**: Node.js, Express, Multer, Helmet, Compression.
*   **Database**: MongoDB Atlas, Mongoose.
*   **Forensics**: Tesseract OCR (Image scanning), `pdf-parse` (Document text layers), Whisper/AI-grounded timeline generators (Videos).

---

## 6. License
Distributed under the MIT License. See `LICENSE` for details.
