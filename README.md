# TruthLens AI

> **Think Before You Share.**

TruthLens AI is an advanced AI-powered web application that helps users analyze news articles, URLs, social media posts, screenshots, PDFs, and manually entered text to determine whether the content is likely genuine, needs verification, or is likely misleading. 

Rather than presenting absolute "Fake" or "Real" binary claims, TruthLens AI uses a multi-modal hybrid pipeline combining raw text scraping, OCR screenshot reads, Google Factcheck Tool indexing, and Google Gemini prompt engineers to offer explainable, bilingual (English & Hindi) credibility breakdowns.

---

## 🚀 Key Features

*   **Multi-Modal Ingestions**: Supports raw text, article URLs (Cheerio scrapers), images/screenshots (Tesseract OCR), and PDF papers (pdf-parse text streams).
*   **Bilingual Explainable AI (XAI)**: Synthesizes simplified summaries in both English and Hindi.
*   **Google Fact-Check Verifications**: Queries live factcheck registries to confirm or debunk assertions with official citation links.
*   **Trust Score Dial**: Displays animated SVG gauges alongside multi-dimensional indicators (Source Reputation, Objectivity, Claim Authenticity, and Clickbait/Emotion controls).
*   **"Before You Share" Friction**: Nudges users to check warnings and copy contextual summaries before sharing.
*   **AI conversational helper**: Enables post-analysis discussions using context-grounded Gemini chat sessions.
*   **Saved Histories & Bookmarks**: Supports local session history logs for Guest users and MongoDB indexed collections for Registered users.

---

## 🛠️ Technology Stack

*   **Frontend Client**: React.js + Vite + Zustand + Vanilla CSS + Lucide Icons
*   **Backend Gateway**: Node.js + Express.js
*   **Database Schema**: MongoDB + Mongoose ODM
*   **AI Services**: Google Generative AI (Gemini 1.5 Flash SDK) + Google Fact Check Tools API
*   **Extractors**: Cheerio (URL Scraper) + Tesseract.js (Multilingual OCR) + pdf-parse (PDF Reader)

---

## 📂 Repository Directory Layout

```
Hackathon/
├── frontend/                   # React.js SPA (Vite) Client
│   ├── public/                 # Favicons and PWA manifest.json
│   ├── src/
│   │   ├── components/         # Navbar, Footer, TrustGauge, UploadZone
│   │   ├── context/            # Toast notification banners
│   │   ├── pages/              # Home, Analysis, Results, Chat, History, Profile, Auth
│   │   ├── services/           # Axios apiClient wrapper
│   │   ├── store/              # Zustand global state slices
│   │   └── styles/             # HSL variables, global print/skeleton stylesheets
│   └── index.html              # PWA manifest and SEO metadata headers
│
├── backend/                    # Node.js Express Server
│   ├── src/
│   │   ├── config/             # Database connection pools
│   │   ├── controllers/        # Request handlers (auth, analysis, chat sessions)
│   │   ├── middleware/         # Rate limiters, JWT validators, Mongoose error limits
│   │   ├── models/             # Mongoose schemas (User, Analysis, Bookmark, Chats)
│   │   ├── routes/             # REST Routers mapping
│   │   ├── services/           # Scrapers, OCR engines, Gemini prompt managers
│   │   └── utils/              # Scoring calculator engines & validation scripts
│   ├── uploads/                # Temporary local file uploads folder
│   ├── server.js               # Express application gateway
│   └── .env.example            # Environment variables templates
│
└── PROGRESS.md                 # Project roadmap milestone checklists
```

---

## ⚙️ Installation & Setup Guide

### Prerequisites
*   Node.js (LTS version) installed
*   MongoDB local instance or MongoDB Atlas Connection string
*   Google Gemini API Key
*   Google Fact Check Tools API Key

### 1. Backend Server Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` configuration file (copying `.env.example`):
    ```ini
    PORT=5000
    NODE_ENV=development
    MONGODB_URI=mongodb://localhost:27017/truthlens
    JWT_SECRET=your_jwt_signing_key_here
    GEMINI_API_KEY=your_google_gemini_api_key_here
    FACTCHECK_API_KEY=your_google_fact_check_api_key_here
    ```
4.  Start server in development mode:
    ```bash
    npm run dev
    ```

### 2. Frontend Client Setup
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Compile static production distribution:
    ```bash
    npm run build
    ```
4.  Launch local development preview:
    ```bash
    npm run dev
    ```

---

## 📡 REST API Reference Endpoints

All routes are prefixed with `/api/v1`.

### 1. Authentication
*   `POST /auth/register` - Creates user account. Body: `{ name, email, password }`
*   `POST /auth/login` - Validates credentials. Returns user detail and signed JWT cookie.
*   `POST /auth/logout` - Clears cookie session.

### 2. Verification Pipelines
*   `POST /analysis/deep` - Main analysis. Accepts manual text/URL body `{ input }` OR file uploads (screenshot/PDF multipart form-data). Returns verification logs.

### 3. Chats
*   `POST /chat/sessions` - Initializes chat session linked to analysis report. Body: `{ analysisId }`
*   `POST /chat/sessions/:sessionId/messages` - Submits follow-up questions. Body: `{ text }`

---

## 🛡️ Security Hardening Configurations
*   **Helmet & CSP**: Customized HTTP headers to prevent Clickjacking and Script injection, permitting queries to authorized fact-check domains.
*   **Rate Limiting**: Standard API router calls limited to 15 per minute per IP address.
*   **Input Sanitizations**: Maximum upload size enforced at 10MB; file type validations restrict inputs to PNG, JPG, WEBP, and PDF.

---

## 🔮 Future Roadmap
*   **Regional Slang Lexicons**: Supporting Indian regional dialects (Hinglish, Tamil, Telugu, Marathi) for claim extraction.
*   **Automatic Cache Synchronization**: MD5 content hashing cache to avoid duplicate LLM bills.
*   **Browser Fact-Check Plugins**: Inspect webpage claims with a browser extension.
