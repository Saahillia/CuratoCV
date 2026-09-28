---
name: memo-search-hybrid
description: Hybrid folder-name + MongoDB text document search with strict state isolation in Memo workspace
metadata:
  type: project
---

# Memo Hybrid Search (Phase B)

## What
Phase B implements search across folders (by folder name) and documents (by title + content) in the Memo workspace using a hybrid architecture: folders filtered client-side from loaded `folders` metadata, documents queried server-side via MongoDB `$text` through `GET /api/notes?search=...`.

## Why
- Explorer metadata (`explorerDocuments`) intentionally excludes document `content` to keep payloads small.
- Full document-body search requires MongoDB's text index (`title`, `content`) rather than scanning bodies in application code.
- Folder trees are lightweight; filtering by `folder.name` client-side avoids an extra endpoint.
- Must not corrupt canonical `folderEntries` / paginated `documents` state.

## Internal working
1. **Backend model** (`memo/backend/src/models/Note.js`): text index `{ title: "text", content: "text" }` plus owner-scoped indexes.
2. **Repository** (`memo/backend/src/repositories/noteRepository.js`): `listNotes` applies `query.$text = { $search: search }` only when `search` is truthy, always pinned to `userId` and `isDeleted: false`.
3. **Route** (`memo/backend/src/routes/notesRoutes.js`): `GET /api/notes` protected by `protect` middleware; `search` param passed through.
4. **Frontend state isolation** (`MemoWorkspace.jsx`): `explorerDocuments` and `folders` remain untouched; temporary `searchResults` / `searchTerm` / `isSearching` hold search view only; clearing search restores exact normal workspace.

## Actual CuratoCV flow
- User types query → 250ms debounce → `GET /api/notes?search=<q>` → results deduplicated by `_id` → folder results derived from loaded `folderEntries` by name match → document results from backend response → click folder selects it via `selectFolder(id)` without mutating `parentId`; click document opens editor with `navigate(...)`.

## Code / layers
- Test file: `backend/Tests/notes.test.js` (describe "Notes Search" with title match, content match, isolation, soft-delete exclusion).
- API contract preserved: `/api/notes?search=`; `/notes` and `/products/notes` redirects untouched.

## Failure modes and trade-offs
- Client-side folder filtering only reaches currently loaded folders; large trees stay responsive.
- Backend text search requires index build; case-insensitive and whitespace-normalized behavior depends on MongoDB `$text` rules.
- Deduplication by `_id` prevents backend + client-side duplicates.
- Search never writes to `folderId` or `parentId`; hierarchy preserved.

## Verification (2026-09-28)
- `pnpm --filter backend test Tests/notes.test.js`: 26 passed (7 foundation + 5 folder deletion + 11 hierarchy + 3 search).
- Search isolation verified: User A cannot see User B results; deleted documents excluded.
- Phase A frozen (recursive permanent delete + 5 tests intact). Phase C frozen (cards unmodified).
- Concurrent `test:all` stopped at 120s; focused `notes.test.js` is authoritative for Phase B.

## Interview follow-up
- Why hybrid instead of pure backend? Keeps folder tree responsive and avoids loading full note bodies into explorer.
- How is tenant isolation enforced? `req.userId` in repository query + `protect` middleware.
- What protects hierarchy during search? Search is read-only view; `selectFolder` and `selectDocument` only change selection state, never persistence.

## Sources
- `memo/backend/src/models/Note.js` (text index)
- `memo/backend/src/repositories/noteRepository.js` (`$text` query, `userId` scope)
- `memo/backend/src/routes/notesRoutes.js` (router contract)
- `backend/Tests/notes.test.js` (verified 2026-09-28)
- Plan reference: `/home/saahillia/.claude-omniroute/plans/cached-watching-badger.md` (Phase B approved)
