# Changelog - TruthLens-AI

All notable changes to the **TruthLens-AI** project during the hardening and explainability phases are documented here.

---

## [1.3.0] - 2026-07-17

### Added
*   **Intelligent Claim Classification Engine**: Classified claims into 19 distinct categories (e.g. Death, Medical, Space, etc.) using `claimUnderstander.js`.
*   **Verification Strategy Selector**: Dynamically shifts adapter crawler paths and priorities in `evidenceCollector.js` based on category context.
*   **Dynamic Source Trust Weights**: Tailors trust score calculations to categories in `trustEngine.js` (e.g. elevating WHO weight for medical claims).
*   **Developer Telemetry Console**: Rebuilt `/developer` sandbox to display LLM execution traces, queries, validated sources, and rejected lists.
*   **False Positive Reduction**: Rejects crawled results matching the entity but discussing different events or people inside `evidenceValidator.js`.
*   **Multi-Stage Confidence**: Replaces overall confidence with 5 component gauges (Entity, Claim, Retrieval, Evidence, and Verdict) in `confidenceCalculator.js`.

### Fixed
*   Resolved general news weight bias skewing specialized space and medical claims.
*   Fixed empty logs inside the developer panel by piping query metadata and discarded logs through database-saved analysis schemas.

## [1.2.0] - 2026-07-17

### Added
*   **Explain-Like Persona switcher**: Dynamic endpoint `/api/v1/analysis/:id/explain-like` to rewrite verification summaries in distinct styles (*Child*, *Student*, *General Public*, *Researcher*, *Journalist*, *Developer*).
*   **The AI Courtroom UI**: prosecution panels (debunks), defense panels (corroborations), judge rationale audits, and interactive 7-stage Evidence Chain flowcharts.
*   **Video Processing Engine**: Added `videoService.js` to process local video file uploads and video links, generating timestamped transcription timelines.
*   **Curated Demo Sandbox**: Loaded 8 preconfigured sandbox cards (Verified True, Verified False, Misleading, Breaking News, YouTube Video, X Post, Screenshot, PDF) to support fast judge testing.
*   **PWA manifests**: Added `manifest.json` configurations to support desktop/mobile Progressive Web App installations.
*   **Vercel route rewrites**: Configured `vercel.json` rewrites to prevent client-side path 404s.

### Fixed
*   Resolved `inputType` validation crashes for video uploads in `inputProcessor.js` and Mongoose schema definitions.
*   Fixed MongoDB `E11000` duplicate key index collisions on seeded and dynamic domain creations in `sourceRegistryService.js`.
*   Fixed a React runtime ReferenceError where the `<Compass>` icon was used in `Analysis.jsx` but not imported from `lucide-react`, which had left the input pages blank.
*   Fixed a bug where credit-exhausted API keys fell back to positive verification consensus (100% agreement). Integrated local claim inspectors and keyword scrapers to correctly flag fake claims (such as petrol price scams) on fallback.
*   Renamed all brand occurrences to **TruthLens-AI** across the codebase.
*   Hardened PDF and OCR exceptions to degrade gracefully with recovery tips.
