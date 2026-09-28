# Memo Folder Hierarchy and Responsive Navigation

## 1. Plain-language summary

A folder is a named place that can contain documents and other folders. Memo stores each folder as its own user-owned record, so empty folders and nested organization survive refreshes. Older notes that only have a text folder name continue to appear through a read-only compatibility entry.

## 2. What a hierarchical folder tree is

A flat list stores one label per document. A tree stores each folder with an optional parent reference: no parent means a root folder; a parent ID means a child folder. A client can group those records by parent ID and display indentation. A database reference alone does not prove ownership or prevent loops, so the server must validate parent operations against the authenticated user's records.

## 3. Why Memo uses it

People organize work in more than one level, and a folder can be useful before it has documents. Persisted folder nodes support that workflow. Memo already has older notes whose `folder` field is plain text, so replacing it would risk losing existing organization. The current implementation adds hierarchy while retaining the old label and presenting old labels as virtual top-level folders.

## 4. Where it lives

- `memo/backend/src/models/Folder.js` defines a folder's owner, name, normalized sibling key, and optional parent.
- `memo/backend/src/repositories/folderRepository.js` performs folder persistence and owner-scoped lookup.
- `memo/backend/src/services/folderService.js` validates names, checks parent ownership, rejects legacy-name collisions, and translates duplicate-key errors.
- `memo/backend/src/models/Note.js` adds nullable `folderId` while retaining the legacy `folder` string.
- `memo/backend/src/services/noteService.js` validates a selected folder and stores both its ID and its name on a new note.
- `memo/backend/src/routes/notesRoutes.js` exposes protected folder endpoints under the existing `/api/notes` mount.
- `memo/frontend/src/pages/MemoWorkspace.jsx` renders the folder/file explorer, responsive navigation, toolbar actions, breadcrumbs, and note previews.
- `platform/frontend/src/components/common/AccountMenu.jsx` owns shared profile/settings, billing, and logout controls used from Memo's top bar.
- `frontend/src/memo/MemoWorkspace.test.jsx` exercises the workspace through mocked API responses.

## 5. Request and rendering flow

```text
Open Memo
  → GET /api/notes/folders
  → Platform auth middleware supplies req.userId
  → Memo controller → folder service
  → folder repository loads only that user's folders
  → note repository returns names from old text-only folders
  → frontend combines saved folders and virtual legacy folders
  → FolderTree groups nodes by parentId and renders children when expanded
```

Creating a folder sends `POST /api/notes/folders` with `{ name, parentId? }`. The server derives the owner from authentication, trims and bounds the name, verifies that a selected parent belongs to that owner, and persists the node. A unique index on owner + parent + normalized name prevents duplicate sibling names regardless of capitalization.

Creating a document inside a saved folder sends its `folderId`. The Memo service verifies that the folder belongs to the current user and stores its name in the old `folder` field too. The list query uses `folderId` for saved folders, and the old text value for a virtual legacy folder. Both paths remain under `/api/notes`.

## 6. Explorer controls and breadcrumbs

The explorer toolbar follows a familiar code-editor pattern. **New Folder** opens the folder form using the selected saved folder as its parent. **New File** opens the existing blank-document form in the selected folder. **Refresh Explorer** reloads the current document list, folder tree, and paginated explorer files. **Collapse All Folders** closes every expanded node. Each icon has an accessible name and a small custom tooltip below it. The native browser `title` tooltip is omitted so the label appears once.

The explorer shows documents nested under saved folders, nested child folders, and old virtual text folders. It loads 20 notes per page and offers “Load more files,” avoiding an unbounded list request. Clicking a folder filters the main preview list. Clicking a file selects its folder and file, highlights the explorer row and matching preview card, and updates the breadcrumb path. The breadcrumb is built from actual folder parent IDs and document title; clicking a parent folder navigates to that level, while the Memo crumb returns to all documents. Selection shows the current preview; a document editor is not yet implemented.

## 7. Responsive behavior

The desktop layout keeps the explorer in a left sidebar. At smaller widths, that sidebar is absent until the user opens it with the menu button; the drawer can close through its close button, backdrop, folder/file selection, or Escape. Product navigation has a back arrow, and the Platform account menu gives access to Profile & settings, Billing, and logout. The Memo heading uses a notebook icon. The introduction and empty state use compact spacing; a short viewport hides secondary roadmap details while keeping the main headline and action. Document preview cards can grow into a scrollable list as the user adds content. Automated DOM tests check the responsive classes and drawer behavior; they do not simulate exact pixel layout on every physical device.

## 8. Security, compatibility, and limits

Folder and note reads are scoped to the authenticated owner. A request that names another user's parent gets a not-found result, avoiding disclosure that the folder exists. The browser cannot submit an owner ID. Names are length-limited and trimmed; duplicate siblings return a conflict. The model reference does not currently implement folder move, rename, delete, cycle detection, recursive deletion, or note reassignment when a folder is later changed. Those operations need explicit lifecycle rules before being added.

No old note is rewritten to a folder record. Legacy labels are surfaced as virtual root entries. New saved folders are distinct records. The `Note.folder` string is retained for older clients and existing records. The public compatibility API remains `/api/notes`.

## 9. General understanding, then CuratoCV understanding

In general, a parent reference is a compact way to store a tree: each node stores only its direct parent, and the UI builds the visible tree by grouping siblings. In CuratoCV, the reference is `MemoFolder.parentId`; the Memo frontend groups the API response by `parentId` and recursively renders expanded groups. The API treats the token-verified `req.userId` as the owner at both folder and note boundaries. No product-to-product dependency is introduced: Memo uses the root API composition and Platform authentication.

## 10. Verification

```bash
pnpm --filter frontend test
pnpm --filter frontend build
pnpm --filter backend exec vitest run --config vitest.config.js Tests/notes.test.js
```

Verified on 2026-09-25: `pnpm --filter frontend test -- --silent` passed (11 tests across 2 files); `pnpm --filter frontend build` completed. The build reports a large JavaScript chunk advisory. The backend integration test is present, but this sandbox could not start MongoMemoryServer: it failed to bind `0.0.0.0` with `EPERM`, so backend tests were not verified in this environment. No claim of backend test pass is made.

## 11. Interview explanation and likely follow-ups

“Memo stores folders separately from notes. Each folder belongs to the authenticated user and can reference a parent folder, which lets the UI build a nested tree and preserve empty folders. Before creating a child, the service checks the parent under the same user ID; before assigning a note, it checks folder ownership again. Older notes still use a plain text folder name, so the API exposes those as virtual roots and new notes keep that old label alongside the new folder ID. The explorer loads file entries in bounded pages, and a selected file or folder updates a clickable breadcrumb from the actual parent chain. Account controls stay Platform-owned and are consumed through the shared menu.”

Likely follow-ups: Why is the owner checked in the repository query? How does the UI distinguish legacy and persisted folders? What prevents duplicate siblings? How should moving a folder avoid cycles? What should happen to notes when a folder is deleted?

## 12. Sources and status

Sources: files listed in section 4; `backend/Tests/notes.test.js`; `backend/vitest.config.js`. Verified on 2026-09-25 for frontend tests/build. Backend runtime integration remains unverified in this restricted environment.
