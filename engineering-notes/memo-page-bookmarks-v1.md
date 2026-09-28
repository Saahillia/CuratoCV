---
name: memo-page-bookmarks-v1
description: Backend persistence, custom SVG ribbon component, and Bookmark Center sidebar for page-level document bookmarks
metadata:
  type: project
---

# MEMO — PAGE BOOKMARKS V1

## What
A complete content-anchored bookmarking capability for Memo documents. Users mark specific locations within any document via a custom vector bookmark ribbon, store bookmarks persistently with compound duplicate prevention, manage them globally or per note, and jump directly to bookmarked locations via the Bookmark Center sidebar tool tab.

## Why
Users need to quickly return to specific, content-dense locations in long documents, bypassing linear scrolling and organizing important sections. Stability across edits is provided by content-based anchors.

## Internal Working
- **Model**: `Bookmark` Mongoose model (`memo/backend/src/models/Bookmark.js`) with schema fields (`userId`, `noteId`, `anchorText`, `startOffset`, `title`, `snippet`) and a compound unique index `{ userId: 1, noteId: 1, anchorText: 1, startOffset: 1 }`.
- **Repository**: `bookmarkRepository.js` provides user-scoped queries and safe deletion methods.
- **Service**: `bookmarkService.js` enforces document ownership checks via `noteRepository`, validates anchors (text/offset), and rejects duplicate bookmark creation with `409 Conflict`.
- **Controller & Routes**: `bookmarkController.js` and `notesRoutes.js` expose REST endpoints under `/api/notes`.

## CuratoCV Flow
- **Ribbon Component**: `BookmarkRibbon.jsx` renders a custom vector bookmark ribbon.
- **Persistence**: `POST /api/notes/:noteId/bookmarks` records a bookmark based on selected text (`anchorText` + `startOffset`); `GET /api/notes/bookmarks` lists user bookmarks.
- **Bookmark Center**: Integrated into `MemoEditor.jsx` as a collapsible sidebar (`activeTool === "bookmarks"`), displaying titles, snippets, and click-to-navigate functionality.
- **Navigation**: Click-to-nav resolves `anchorText` in the `textarea`, sets selection range, calculates scroll position, and triggers a temporary highlight ring for 1200ms.

## Security
- Strict IDOR/Ownership: all bookmark actions validate `req.userId` against note and bookmark ownership.

## Verification
- Backend tests (`Tests/bookmarks.test.js`) enforce ownership and duplicate prevention.
- Frontend tests (`frontend/src/memo/MemoBookmarks.test.jsx`) verify ribbon toggle, list display, content-based navigation, and optimistic deletion.
- Defensive scroll implementation ensures JSDOM compatibility.
