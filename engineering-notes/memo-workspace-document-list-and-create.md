# Memo Workspace: Listing and Creating Documents

## 1. Plain-language summary

The first Memo workspace feature lets a signed-in user see a bounded page of their existing documents and create a new blank document from a responsive landing page. The browser asks the Memo API for data; it never reads MongoDB directly. The existing API already owns authentication, validation, and document ownership, so this feature reuses it instead of adding another backend implementation.

## 2. What this feature is

A **document list** is a view of persisted Memo records, usually ordered by recent activity. **Pagination** divides a large result set into bounded requests. **Autosave/editor behavior** is deliberately outside this slice: this page can create and preview a note's current text but does not edit it yet.

## 3. Why it is needed

The existing API could already store notes, but the product route showed only a roadmap placeholder. The workspace now connects real user-visible UI to the existing persistence contract. Keeping each request bounded avoids loading an unbounded document collection into the browser.

## 4. Where it lives

- `frontend/src/App.jsx` mounts the Memo workspace under the authenticated `/products/memo` route.
- `memo/frontend/src/pages/MemoWorkspace.jsx` owns list/create UI, loading/error/empty states, and page navigation.
- `packages/api-client/src/index.js` supplies the shared Axios client and attaches the stored bearer token at request time.
- `backend/server.js` mounts the Memo router at `/api/notes`.
- `memo/backend/src/routes/notesRoutes.js` protects the router and declares list/create endpoints.
- `memo/backend/src/controllers/noteController.js` maps requests to service calls and HTTP responses.
- `memo/backend/src/services/noteService.js` validates the title/content and applies Memo rules.
- `memo/backend/src/repositories/noteRepository.js` scopes database queries to the authenticated user and applies pagination.
- `memo/backend/src/models/Note.js` defines the persisted note shape and limits.

## 5. When it runs

When the authenticated `/products/memo` route mounts, a React effect requests page 1 with a limit of 20. Creating a document submits its trimmed title and an empty content string; after success, the page reloads page 1 so the backend's sort order remains canonical. “Load more” requests only the next page.

## 6. End-to-end flow

```text
MemoWorkspace mounts
  → api.get("/notes", { page: 1, limit: 20 })
  → shared API client adds Authorization: Bearer <stored token>
  → Express mounts the protected Memo router at /api/notes
  → auth middleware verifies identity and sets req.userId
  → controller → service → repository
  → Mongo query filters by req.userId and page bounds
  → { notes, total, page, pages } response
  → React renders document cards
```

Creation follows the same layers through `POST /api/notes/create`. The client sends only `{ title, content }`; the server derives the owner from the verified token. It does not accept ownership from the browser.

## 7. Internal layers

- **React page:** keeps transient form/loading/list state and displays accessible feedback. An `AbortController` cancels the initial read if the user leaves the route before it finishes.
- **Shared API client:** applies the configured `/api` base URL, bearer token, timeout, and global unauthorized behavior. The Memo page does not construct authentication headers itself.
- **Router and auth middleware:** protect all note endpoints and establish the trusted user identity.
- **Controller:** reads request parameters/body and shapes success responses; exceptions continue through common error handling.
- **Service:** trims and validates the title and content before persistence.
- **Repository/model:** filters by owner, paginates, sorts pinned/recent documents, and lets the schema enforce data constraints.

## 8. Security and failure cases

An unauthenticated request is rejected by the protected route. The repository includes `userId` in its database filters, so a client cannot retrieve another user's record by guessing its ID. Empty/whitespace titles are rejected in the UI for quick feedback and independently by the service. API failures produce a visible error and retry action; an empty result has a distinct first-document prompt. The page requests at most 20 records per page.

The page renders document content as React text, not injected HTML. Rich-text sanitization is a future editor requirement and is not implemented by this slice. Offline editing, autosave, and document mutation are also not implemented yet. Persistent folders and the compatibility path for old text-only folders are covered in `memo-folder-hierarchy-and-responsive-navigation.md`.

## 9. CuratoCV implementation and verification

The UI integration tests are in `frontend/src/memo/MemoWorkspace.test.jsx` and cover shared branding, responsive sidebar visibility/open-close behavior, document preview and date, folder/document creation, and a recoverable API error. Backend contract tests are in `backend/Tests/notes.test.js`; they cover note lifecycle, ownership, nested folder creation, and folder-filtered notes. `/api/notes` remains the route contract. Folder persistence and compatibility details are documented separately in `memo-folder-hierarchy-and-responsive-navigation.md`.

The root Tailwind stylesheet explicitly scans `frontend/src`, `platform/frontend/src`, `resumebuilder/frontend/src`, and `memo/frontend/src` using Tailwind v4 `@source` directives. Without those source paths, the Vite build emitted base styles but omitted utility classes from the monorepo source packages.

## 10. Design choices and trade-offs

Reusing the current Note API avoids a duplicate service. Page size 20 bounds a request and makes “Load more” predictable. The current API calls the records “notes”; the product UI calls them “documents” while preserving `/api/notes` compatibility. The header stays focused on product navigation; document and folder actions live beside the workspace content to avoid duplicate Create menus.

## 11. How to verify

```bash
pnpm --filter frontend test
pnpm --filter frontend build
pnpm --filter backend exec vitest run --config vitest.config.js Tests/notes.test.js
```

Verified on 2026-09-25: after the folder/navigation update, `pnpm --filter frontend test` passed (9 tests) and `pnpm --filter frontend build` passed. The focused backend command could not start MongoMemoryServer in this sandbox (`listen EPERM: operation not permitted 0.0.0.0`), so backend behavior is covered by checked-in tests but was not rerun successfully in this environment. The frontend build prints a large JavaScript chunk advisory; it does not prevent the build from completing.

## 12. Interview-ready explanation

“Memo already had an authenticated notes API, so I connected its frontend workspace to that existing contract. On mount, the page requests one bounded page through the shared API client, which adds the bearer token. Platform auth middleware verifies the token and supplies the user ID. The Memo controller and service pass validated input to a repository that filters every query by that user. The UI distinguishes loading, empty, error, and populated states, and creating a document reloads the first page. Folder ownership and backward compatibility are handled in a separate folder feature; document editing and autosave are still future work.”

Likely follow-ups: Why paginate? Where is ownership enforced? Why reuse `/api/notes`? What happens when the first request fails? How will autosave avoid a request on every keystroke? How will rich text be rendered safely?

## 13. Sources

Verified repository sources listed above. Verification date: 2026-09-25.
