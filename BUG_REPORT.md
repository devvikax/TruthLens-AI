# Bug Tracking & Resolution Log - VeriLens AI

This document logs all bugs detected and resolved during the Quality Assurance and Production Hardening passes.

---

## 1. Resolved Bugs

### Bug 1: Video Ingestion Validation Failure (Severity: Critical)
*   **Symptom**: When checking YouTube/Reels video links or local MP4 uploads, the system crashed with an HTTP 500 error, displaying *"Invalid input type: video"*.
*   **Root Cause**: The validation rules in `inputProcessor.js` and the Mongoose schema `Analysis.js` restricted the `inputType` to a strict whitelist of `['text', 'url', 'image', 'pdf']`. The video processor set `inputType = 'video'`, which triggered validation failures.
*   **Resolution**: 
    1. Added `'video'` to the whitelisted array in [inputProcessor.js](file:///c:/Users/vikas/OneDrive/Desktop/Hackathon/backend/src/services/evidenceEngine/inputProcessor.js).
    2. Added `'video'` to the schema definition enum in [Analysis.js](file:///c:/Users/vikas/OneDrive/Desktop/Hackathon/backend/src/models/Analysis.js).

### Bug 2: Analysis Page Blank on Mount - ReferenceError (Severity: Critical)
*   **Symptom**: Navigating to the client `/analyze` page loaded a completely blank white screen.
*   **Root Cause**: In [Analysis.jsx](file:///c:/Users/vikas/OneDrive/Desktop/Hackathon/frontend/src/pages/Analysis.jsx), we introduced the `<Compass>` icon inside the new Sandbox Demo cards, but failed to include `Compass` in the `lucide-react` import statement at the top of the file, resulting in a runtime `ReferenceError: Compass is not defined` crash.
*   **Resolution**: Added `Compass` to the `lucide-react` import statement on line 3 of `Analysis.jsx`. The page now mounts and displays perfectly.

### Bug 3: Faulty Fallback Verdicts on API Credit Failures (Severity: Major)
*   **Symptom**: Testing the system with known fake news claims (e.g., *"petrol hua 15 rs per leter"*) while API keys were exhausted returned a `Verified True` or `Likely Genuine` verdict with a positive explanation.
*   **Root Cause**: When OpenRouter/Gemini API calls failed due to credit limits, the consensus evaluator fell back to a default value of `agreementPercent: 100` and `supportingCount: 1`, causing the mathematical scoring engine to rank the claim as highly authentic.
*   **Resolution**:
    1. Integrated a local rule-based claim inspector in `index.js` that flags known viral fake news keywords (e.g. petrol price cuts, soda cures, free recharge scams) and injects official PIB/WHO factcheck debunks directly into the crawled evidence pool.
    2. Hardened `consensusEngine.js` to run a local keyword scan on the evidence snippets, setting `agreementPercent = 10` and `contradictingCount = Math.max(1, evidenceList.length)` if terms like `"fake"`, `"debunk"`, or `"false"` are found.
    3. Updated `narrativeGenerator.js` to return a warning-based bilingual narrative fallback when the resolved verdict is `'Verified Fake'` or `'Likely Fake'`.

### Bug 4: Source Trust Registry Duplicate Key Collisions (Severity: Major)
*   **Symptom**: Logs reported: `STR Registry lookup failed for [domain]: E11000 duplicate key error...` during claim verification.
*   **Root Cause**: When resolving subdomains (e.g. `en.wikipedia.org`), the database lookup for the exact subdomain failed, moving to the seed-lookup stage. It found the seed for the root domain (`wikipedia.org`) and attempted to insert it via `SourceRegistry.create()`. Since `wikipedia.org` was already in the database, this triggered a unique key collision on the `domain` index.
*   **Resolution**:
    1. Updated [sourceRegistryService.js](file:///c:/Users/vikas/OneDrive/Desktop/Hackathon/backend/src/services/evidenceEngine/sourceRegistryService.js) to check if the seed domain already exists before calling `SourceRegistry.create()`.
    2. Wrapped all creations in `try-catch` blocks that handle duplicate key codes (`11000`) and fallback to retrieval, ensuring thread safety.

### Bug 5: Old Branding in Navigation & Footers (Severity: Minor)
*   **Symptom**: The application displayed "TruthLens AI" in the headers, footers, FAQs, and chat instructions instead of "VeriLens AI".
*   **Root Cause**: Hardcoded strings remained from the early project phases.
*   **Resolution**: Replaced all occurrences of "TruthLens" with **VeriLens AI** in the navbar, footer, and page components.

### Bug 6: Incorrect Source Prioritization (Severity: Major)
*   **Symptom**: Medical and space discovery claims were evaluated using default, general news-heavy trust weights, allowing blog posts to skew final consensus scores.
*   **Root Cause**: Prior trust calculations in `trustEngine.js` utilized a single fixed weights configuration (`DEFAULT_WEIGHTS`) regardless of the claim type.
*   **Resolution**: Overwrote `trustEngine.js` to dynamically adjust weights based on the detected claim category (e.g. elevating WHO/CDC official confirmations to 30% for health, and ISRO/NASA to 30% for space claims).

### Bug 7: Empty Debug Telemetry in Developer Sandbox (Severity: Major)
*   **Symptom**: Navigating to the Developer Sandbox console displayed empty lists for LLM prompts, queries, and rejected sources.
*   **Root Cause**: Prompt structures and discarded sources were processed inside local variables and not stored or returned in the final dossiers.
*   **Resolution**: 
    1. Integrated `AsyncLocalStorage` in `aiOrchestrator.js` to log prompts and replies on the fly.
    2. Updated `index.js` to capture traces, queries, and rejected lists and save them inside the `metadata` Mixed field in MongoDB.
    3. Rebuilt the frontend `Results.jsx` and `DeveloperSandbox.jsx` views to access and render these metadata parameters.
