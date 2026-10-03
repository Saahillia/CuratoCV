# Resume Job Tailoring and Deterministic Scoring

## Plain-language summary

Job tailoring compares one saved resume with one job description, points to resume evidence for each requirement, and proposes edits for the candidate to review. A language model can interpret text and draft edits, but a separate versioned scoring function calculates alignment. Nothing is written to the resume until the user approves it.

## What it is

An evidence mapping links a job requirement to a specific source section and field. A match class describes the relationship (exact, known alias, contextual, related, missing, or unclear). Deterministic scoring means that the same validated requirement set and rubric version produce the same result without asking a generative model to choose a number. Optimistic concurrency uses a stored document version to reject updates based on stale data.

The JD Match score is an estimate of resume evidence alignment with one JD. It is not a shortlist, ATS, interview, or hiring prediction. ATS Readiness in this feature is a small set of observable CuratoCV structure and renderer layout checks, not a simulation of a particular employer's parser.

## Why it is needed

Candidates should be able to adapt an existing resume without rebuilding it for every opening. Requirement traceability helps users see what is supported and what is absent. Separating the score calculation from generated prose reduces the risk of a model inventing an uplift, while user review and version checks prevent suggestions from silently changing saved data.

## Internal working

1. Authenticate the request and load the resume with both resume ID and authenticated user ID.
2. Select a bounded set of resume section/entry identifiers and relevant text fields. Contact email and phone patterns are redacted before provider submission.
3. Send the JD and minimized resume data as untrusted content. The model has no database, browser, filesystem, account, or write tool access.
4. Parse the model's structured requirements and suggestions. Validate allowed labels, classifications, section/entry IDs, evidence text, editable fields, exact old text, and output limits. Unsupported rewrites are discarded.
5. Calculate JD Match from a versioned weighted rubric. Deduplicate repeated requirement labels; do not score keyword occurrence frequency. Required related/missing/unclear items are shown as gaps. Repetition detection is informational and cannot raise the score.
6. Return an HMAC-signed, expiring snapshot of the analysis requirements. The draft-score endpoint verifies the signature, owner, resume version, and each selected old value before calculating an in-memory preview. It never writes the draft.
7. The user edits, selects, or rejects proposed changes. The editor applies selected values to local resume state; its existing optimistic autosave persists the approved draft. A page-level undo restores the pre-application snapshot while it remains unchanged.

## CuratoCV implementation (verified)

The existing Resume Builder AI tab is rendered in [`ResumeBuilder.jsx`](../resumebuilder/frontend/src/pages/ResumeBuilder.jsx). It now composes [`ResumeJobTailoring.jsx`](../resumebuilder/frontend/src/components/ResumeBuilder/ResumeJobTailoring.jsx), which submits the saved resume ID and editor version, shows separate scores, required/preferred evidence, gaps, red/green text comparisons, editable suggestions, draft re-scoring, and explicit apply/undo controls.

The authenticated `/api/ai/tailor-resume` and `/api/ai/tailor-resume/score` endpoints are declared in [`aiRoutes.js`](../resumebuilder/backend/src/routes/aiRoutes.js). [`aiControllers.js`](../resumebuilder/backend/src/controllers/aiControllers.js) performs server ownership lookup, bounds inputs/output, minimizes provider fields, redacts common email/phone patterns, validates response evidence and allowed paths, signs analysis state, and rejects stale versions. It delegates model calls to the existing entitlement/credit service in [`aiService.js`](../resumebuilder/backend/src/services/aiService.js). Only the score endpoint uses the signing secret; absence of `JWT_SECRET` fails analysis closed.

[`resumeTailoringScoring.js`](../resumebuilder/backend/src/services/resumeTailoringScoring.js) contains rubric `jd-match-v1`, category base weights, priority multipliers, duplicate suppression, critical-gap classification, repetition flags, structure checks, and the limited template renderer layout profile. Template observations come from [`ClassicTemplate.jsx`](../resumebuilder/frontend/src/components/templates/ClassicTemplate.jsx), [`ModernTemplate.jsx`](../resumebuilder/frontend/src/components/templates/ModernTemplate.jsx), [`MinimalTemplate.jsx`](../resumebuilder/frontend/src/components/templates/MinimalTemplate.jsx), and [`MinimalImageTemplate.jsx`](../resumebuilder/frontend/src/components/templates/MinimalImageTemplate.jsx). Modern's responsive two-column and Minimal Image's three-column grids are renderer facts; PDF text extraction and employer ATS behavior are not verified by these checks.

The resume document schema was not changed. The scorer creates an in-memory copy for preview only. [`applyResumeSuggestions.js`](../resumebuilder/frontend/src/utils/applyResumeSuggestions.js) verifies all selected old values before returning a new immutable draft; the page keeps the pre-apply snapshot for undo. Existing resume writes continue through the editor's version-aware `expectedVersion` save path. Tests live in [`aiResumeTailoring.test.js`](../backend/Tests/aiResumeTailoring.test.js), [`resumeTailoringScoring.test.js`](../backend/Tests/resumeTailoringScoring.test.js), [`ResumeJobTailoring.test.jsx`](../frontend/src/resume-builder/ResumeJobTailoring.test.jsx), and [`applyResumeSuggestions.test.js`](../frontend/src/resume-builder/applyResumeSuggestions.test.js).

## Failure modes and trade-offs

- Prompt instructions cannot prove model behavior. The system prompt is paired with server-side allowlists, ownership checks, output validation, and no model tools; tests cover malicious text boundaries, but ongoing adversarial evaluation is still needed.
- Semantic classification remains a model interpretation of supplied evidence. Exact and alias claims are checked against the evidence and a small alias list; broader contextual matching needs a curated, human-reviewed evaluation set before the score should be treated as calibrated.
- The displayed rubric is reproducible, but its category weights have not been calibrated against a representative human-reviewed resume/JD corpus. Do not market it as predictive until that calibration is done.
- ATS Readiness is intentionally limited. It checks section presence and known multi-column renderer layouts; it does not parse the exported PDF or test against employer systems.
- Email/phone redaction covers common text patterns, not every possible identifier. Company, project, and job content are still personal information and are sent to the configured model provider.
- The signature protects client-submitted requirement classifications from tampering during draft scoring. The token is readable by its holder and includes analysis evidence; it expires after 30 minutes and must not be logged.
- Autosave conflicts preserve local edits and surface a conflict; the feature does not silently merge concurrent changes. The undo snapshot is session memory, not durable version history.
- Applying multiple suggestions is atomic in editor state, but persistence still uses existing resume autosave rather than a new server-side transaction.

## Interview follow-ups

- Why is a deterministic scoring function useful if the requirement extraction still uses a language model?
- How can a signed short-lived analysis token preserve the analysis between requests without adding a database record?
- Why must the draft-score endpoint verify both ownership and the saved resume version even though it does not write?
- What evidence corpus and agreement measures would be needed before calibrating the rubric?
- How would you test extracted PDF reading order across the four templates and multiple PDF viewers?
- Which privacy controls are needed if the provider's retention terms change?

## Verification sources

- Repository implementation and tests linked above (verified 2026-10-03).
- [OWASP Top 10 for Large Language Model Applications](https://owasp.org/projects/top-10-for-large-language-model-applications) — prompt injection, output handling, and excessive agency risks.
- [NIST Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) — testing, oversight, and lifecycle risk management.
- [Greenhouse unsuccessful resume parse guidance](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse) — examples of layout and file content that may impede parsing; not a universal ATS specification.
