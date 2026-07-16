# VeriLens AI - Hackathon Demo Script

This document details the pitch and demonstration flows for presenting **VeriLens AI** to judges, developers, and users.

---

## 1. 30-Second Elevator Pitch

> "Every day, millions of pieces of unverified media are shared across WhatsApp, X, and Instagram. Traditional fact-checkers tell you a binary verdict: 'Fake' or 'True'. This direct assertion triggers defensiveness and bias.
>
> **VeriLens AI** changes this. Styled as an interactive **AI Courtroom**, it never just spits out a verdict. Instead, it normalizes any text, screenshot, PDF, or video link, and takes you step-by-step through a transparent forensic investigation. You see the Prosecution's arguments, the Defense's corroborations, the mathematical confidence score, and the exact process timeline. VeriLens AI doesn't tell you what to think; it teaches you how to investigate."

---

## 2. 3-Minute Demo Flow (Exact Click Sequence)

### Phase 1: Ingestion & Sandbox Setup (60 seconds)
1.  **Open the Home Screen**: Show the dark-mode dashboard. Emphasize the tagline: *Verify Any Claim. Trust Every Verdict.*
2.  **Point to the Demo Sandbox Panel**: Explain that judges can test distinct content formats without searching.
3.  **Click 'Lemon Juice Cure' (WhatsApp forward)**:
    *   This switches to the **Text tab** and populates the text field.
    *   Explain: "We are testing a viral health myth."
4.  **Click 'Verify with VeriLens AI'**:
    *   The screen changes to the **Live Auditing journey**.
    *   Walk the judges through the progress stepper steps: `Ingesting Input` → `Decomposing Assertions` → `Querying Adapters` → `Weighting Trust Scores` → `Final Verdict Resolved`.

### Phase 2: The AI Courtroom (90 seconds)
1.  **Show the Verdict Card**: Point out the *Verified Fake* badge and the trust gauge dial.
2.  **Toggle the 'Explain Like:' Persona Pills**:
    *   Click on **Child**: Read a line: "Imagine a friend told you that lemon cures everything..."
    *   Click on **Developer**: Show how technical details are exposed.
    *   Explain: "We adapt the transparency tone to fit the reader's baseline."
3.  **Examine Prosecution vs Defense**:
    *   Show the red-highlighted **Prosecution board**: Displays official WHO and medical fact-check articles debunking the baking soda claim.
    *   Show the **Defense board**: Empty or noting the lack of peer-reviewed backing.
4.  **Audit the Evidence Chain Timeline**:
    *   Expand a step to show the underlying backend process detail.
5.  **Examine the Claim-by-Claim Cases**:
    *   Expand the first claim: Show the specific source trust percentage and agreement index.

### Phase 3: Sharing Friction & Export (30 seconds)
1.  **Scroll to 'Think Before You Share'**:
    *   Explain: "Before the user shares, we add a friction nudge. Clicking **Copy Court Report** copies a citation summary to their clipboard, prompting them to send facts instead of rumors."
2.  **Click 'Export Court Transcript'**:
    *   Show the print layout formatted as a courtroom transcript file.

---

## 3. Provider Failover Backup Plan (No Internet / API Offline)
If live search queries or AI provider endpoints time out:
1.  Our backend **aiOrchestrator.js** automatically retries with exponential backoffs.
2.  If OpenRouter remains unreachable, the orchestrator routes to the fallback **Google Gemini SDK** using local credentials.
3.  If all API channels fail, the backend returns high-fidelity cached dossiers matching the query's hash, preventing demo interruption.
