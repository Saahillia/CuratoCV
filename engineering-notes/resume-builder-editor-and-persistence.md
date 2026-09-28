# Resume Builder Editor and Persistence

## 1. What a Resume Editor Does

A resume editor keeps a structured document in UI state while a person changes content and presentation. Persistence means sending that document to a durable store; local draft storage is a recovery aid, not a substitute for the server record. Autosave is delayed persistence after edits, usually to avoid one network request per keystroke.

## 2. Why It Is Designed This Way

Resume content has nested sections and presentation settings. The editor needs responsive local updates, while the backend must validate the payload and enforce ownership. A local draft can help recover recent work when a request fails or the page reloads.

## 3. General Internal Flow

```text
Edit event → React state update → debounce timer → local draft write
     → serialize document → authenticated multipart request
     → validate/normalize → ownership check → database update
     → response/version → editor save state
```

Debouncing cancels a pending timer when another edit arrives. Concurrency control uses a version or equivalent precondition so stale writes can be detected rather than silently overwriting newer data.

## 4. CuratoCV Active Editor Flow (Verified)

The active page is [`ResumeBuilder.jsx`](../resumebuilder/frontend/src/pages/ResumeBuilder.jsx). It initializes a canonical resume shape, manages editor/view/customization state, loads the existing server resume and local draft, and schedules saves. The page has an active autosave implementation with timer, in-flight/pending-save references and a `versionRef`; when sending a save it adds `expectedVersion` and updates the version from the response. Local draft writes use `saveResumeToLocal`.

The draft utility [`localStorage.js`](../resumebuilder/frontend/src/utils/localStorage.js) uses the compatibility key prefix `curatocv_resume_draft:<resumeId>`. It stores `{ id, data, savedAt }`, catches storage/parse failures, validates the requested draft ID, and returns `null` when data is not usable. This means browser storage is per resume rather than one shared draft key.

On the server, [`resumeRoutes.js`](../resumebuilder/backend/src/routes/resumeRoutes.js) protects create/read/update/delete operations with Platform auth. Update also accepts an optional image through Platform's upload middleware. [`resumeController.js`](../resumebuilder/backend/src/controllers/resumeController.js) parses multipart data, sanitizes/normalizes canonical and legacy resume shapes, validates IDs/limits/photo data, and delegates to `resumeService`. The service/repository enforce ownership and persistence through the Resume model.

## 5. Important Ownership and Non-Canonical Paths

Resume data/state/persistence belong to Resume Builder. The root Redux store owns Platform auth only; it does not register a Resume Builder slice. A `useResumeAutosave.js` hook exists, but source search shows the page implements its own autosave and does not import this hook. Likewise `useLocalResumePersistence.js` exists but is not imported by the active editor. Do not describe either hook as the active flow or remove it without a separate deletion-safety/compatibility check.

The older root resume slice was removed during cleanup because no production registration/consumer remained. This note describes the active page and utility, not every file with related names.

## 6. Failure Modes and Trade-offs

- Local storage may be unavailable, malformed, or quota-limited; utility errors are caught, so server persistence remains important.
- Network/API failures are tracked in editor save state; a local draft is available as recovery data.
- Concurrent edits may produce a stale expected version; the server must report conflict and the user flow should refresh/reconcile rather than silently assume success.
- Debounce reduces request volume but creates a short interval before server durability. Explicit force-save paths matter before leaving or exporting.
- Browser local storage is accessible to same-origin scripts; it should not contain credentials and is not a secure secret vault.

## 7. How to Verify

Backend coverage includes `backend/Tests/resumeConcurrency.test.js`, `resumeEntitlement.test.js`, `resumeDeletionCleanup.test.js`, `imageReplacement.test.js`, and `photoRemoval.test.js`. Inspect the Resume Builder editor route at `/app/resumes/:resumeId/edit`; the API contract is `/api/resumes`.

## 8. Interview Explanation

“The editor owns resume state inside the Resume Builder product. User edits update local React state, schedule a debounced server save, and write a per-resume recovery draft. The save request carries the document and expected version. Backend auth identifies the user; the controller normalizes and validates input, and service/repository code enforces ownership and persists it. Local storage improves recovery but the backend is the durable authority. One legacy autosave hook exists, but the active page has its own flow.”

Follow-ups: Why debounce? What happens after a version conflict? Why remove File objects from JSON? Is localStorage canonical storage? How do route auth and resource ownership differ?

## 9. Sources and Limits

Verified files: `resumebuilder/frontend/src/pages/ResumeBuilder.jsx`, `utils/localStorage.js`, `hooks/useResumeAutosave.js`, `hooks/useLocalResumePersistence.js`, `backend/src/routes/resumeRoutes.js`, `controllers/resumeController.js`, `services/resumeService.js`, `repositories/resumeRepository.js`, and `models/Resume.js`. “Active” refers to imports/runtime use inspected in the current tree; browser UX was not re-exercised for this note.
