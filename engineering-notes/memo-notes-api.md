# Memo Notes API (Legacy Route Contract)

## 1. What the API Does

An API lets the Memo client ask the server to create, read, update, list, archive, restore, or delete notes using HTTP requests. The route path still says “notes” for compatibility even though the product and owning workspace are named Memo.

## 2. Why the Current Contract Matters

Existing clients and tests can depend on `/api/notes`. Product renaming does not require an API rename. Memo owns the note domain; Platform supplies authentication and common error/logging utilities.

## 3. Request and Data Flow

```text
/api/notes request
 → backend composition mounts Memo router
 → auth middleware establishes req.userId
 → noteController handles HTTP shape and ID checks
 → noteService validates business input
 → noteRepository scopes Mongoose operations by userId
 → Note model/database
 → result/error returns through service/controller
 → JSON response or shared error middleware
```

For create, the controller takes the authenticated `req.userId` and request body, calls `noteService.createNote`, and returns HTTP 201. Service trims/validates title (1–200 chars), content (up to 50,000 chars), folder (up to 50 chars), and normalizes tags/flags. Repository creates the document using that user ID.

## 4. CuratoCV Routes and Behavior (Verified)

`backend/server.js` mounts `memo/backend/src/routes/notesRoutes.js` at `/api/notes`. The router applies Platform auth to the entire route group and defines list/create/get/update/soft-delete/restore/permanent-delete operations. Controllers validate object IDs and pass `req.userId` through. Repository queries include user ownership predicates, so resource IDs alone are not the authorization check.

Delete is soft-delete; restore targets deleted records; permanent delete only removes a previously soft-deleted record. Update uses an expected version when provided and the repository can report a conflict when the version is stale. The frontend currently displays `MemoPlaceholder`; Memo's API is implemented while its full product UI is not.

Compatibility behavior: `/api/notes` remains the backend path. Root frontend redirects `/notes` and `/products/notes` to the Memo product route. These are separate compatibility concerns; there is no `/api/memo` rename in this baseline.

## 5. Failure and Security Considerations

- Unauthenticated requests stop at middleware (integration smoke returned 401).
- Invalid IDs return a client error before database lookup.
- Missing or foreign-owned records are not exposed as another user's data.
- Validation errors flow to shared error handling; stale expected versions may become conflict responses.
- Search/list queries and pagination must remain bounded; repository currently caps page size at 100.
- Logs should not include note content or credentials.

## 6. How to Verify

`backend/Tests/notes.test.js` exercises the canonical Memo backend through the existing API contract. Run it through `pnpm test` or the backend package command so setup and database test configuration load. Route source: `memo/backend/src/routes/notesRoutes.js`; test implementation is in `backend/Tests/notes.test.js`.

## 7. Interview Explanation

“Memo owns the notes domain, but `/api/notes` is intentionally retained as a compatibility contract. The root backend mounts the Memo router there. Authentication supplies the user identity; the controller handles HTTP and identifier shape, the service validates note rules, and the repository applies user-scoped Mongoose queries. Deletion is soft by default, restore and permanent deletion are distinct operations, and update can use a version precondition.”

Follow-ups: Why is `req.userId` safer than a body-supplied user ID? How does soft deletion differ from permanent deletion? What prevents IDOR? What does expectedVersion protect? Why not rename the endpoint to `/api/memo`?

## 8. Sources and Limits

Verified files: `backend/server.js`, `memo/backend/src/routes/notesRoutes.js`, `controllers/noteController.js`, `services/noteService.js`, `repositories/noteRepository.js`, `models/Note.js`, `backend/Tests/notes.test.js`, and `frontend/src/App.jsx`. API test evidence does not establish completion of a Memo frontend experience.
