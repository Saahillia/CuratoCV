# Resume Sharing and Public Preview

## 1. What Sharing Means

Sharing exposes a controlled view of a resource to someone outside the owner's authenticated session. A public link is a security boundary: the identifier must be hard to guess or deliberately shareable, and the server must return only intended public fields. “Public route” means authentication is not required; it does not mean every resume should automatically be visible.

## 2. General Flow

```text
Owner enables sharing → server stores share/public state
 → recipient opens link → public endpoint resolves allowed resume
 → backend returns public data → frontend renders preview
```

Authenticated preview and public sharing should be distinct because their access rules differ. Deletion/unpublishing should invalidate or restrict future access as defined by the product contract.

## 3. CuratoCV Implementation (Verified)

The root shell defines `/resume/:shareId` and `/view/:resumeId` using Resume Builder's Preview page. For these public paths, Preview requests `/api/resumes/public/:id`. The backend queries by MongoDB resume ID plus `public: true`; this is an exposed resume ID, not a separate random share token. Authenticated preview uses a different route and the authenticated API endpoint.

Resume backend routes distinguish `GET /api/resumes/public/:resumeId` from authenticated `GET /api/resumes/get/:resumeId`. The public controller queries only records with `public: true`; the authenticated path passes the authenticated user ID through ownership-aware service/repository logic. `shareService.js` builds a URL from the raw resume ID and toggles public state through the authenticated resume update endpoint.

There is no separate random share token, expiry, or email-share API verified. `shareService.sendEmail` calls `/share/email`, while the root server has no matching share router; treat that helper as a placeholder, not a working feature. The public API returns the full `resume` document selected by `public: true`, so the exact data exposed must be reviewed if private/internal resume fields are added to the model.

## 4. Failure and Security Considerations

- A public endpoint must not trust a client-supplied owner ID.
- Non-public resumes should not be returned through public handlers.
- Public DTOs should exclude private account data and any internal fields not needed for rendering.
- Share disable/delete behavior should be verified against the backend, not only hidden in UI.
- The current link contains the MongoDB resume ID, so it is not a secret capability token. Public visibility is controlled by the `public` field; disabling that field should block later public reads. Deployments should consider URL privacy, referer, and cache behavior.

## 5. How to Verify

Inspect `frontend/src/App.jsx`, Resume Builder `components/Share`, `services/shareService.js`, `pages/Preview.jsx`, backend `routes/resumeRoutes.js`, `controllers/resumeController.js`, `services/resumeService.js`, and `models/Resume.js`. Public/private access deserves integration tests for both allowed and denied states.

## 6. Interview Explanation

“CuratoCV has distinct authenticated resume access and public preview routes. Authenticated requests identify the user and enforce ownership. Public preview is an explicit server route that must honor the resume's publication/share state and return a safe view. The React route being public only controls client navigation; the backend endpoint decides what data can actually be disclosed.”

Follow-ups: What makes a share identifier safe? How is unpublishing enforced? What is the difference between a public route and public API data? Which fields may a public response contain? How can a share URL leak?

## 7. Sources and Limits

Verified files: `frontend/src/App.jsx`, `resumebuilder/frontend/src/pages/Preview.jsx`, `components/Share/`, `services/shareService.js`, `resumebuilder/backend/src/routes/resumeRoutes.js`, `controllers/resumeController.js`, `services/resumeService.js`, and `models/Resume.js`. This note does not claim a random share token, email sharing, URL expiry, caching controls, or deployed referrer policy.
