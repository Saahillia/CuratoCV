# CuratoCV Memo — Product Vision and Engineering Direction

**Status:** Product direction for incremental Memo development  
**Canonical product workspace:** `memo/`  
**Compatibility contract:** backend API remains `/api/notes`

## 1. Product and platform

CuratoCV contains two independent products: Resume Builder and Memo. Both may consume Platform capabilities and generic shared packages. Neither product may depend on the other. Memo is a product in its own right, not a Resume Builder feature. The migration is closed; incomplete Memo functionality is product work, not a reason to reopen migration.

Memo is intended to become a personal digital workspace for writing, organizing, drawing, and preserving knowledge. The experience should make it easy to think, create, organize, save, return, and continue. It should grow beyond a plain textarea or basic CRUD notes list, while remaining focused and understandable.

## 2. Intended user journey

```text
Open Memo → Workspace → Choose/create a folder → Choose/create a document
          → Write, format, or draw → Autosave → Return later and continue
```

The workspace should provide clear navigation, a focused editor, visible save/sync state, and responsive behavior. A clean header may identify the product/document and expose a small number of useful actions. A status area may show save state, word count, or connection state when those details help the user.

## 3. Product capabilities

### Organization

The eventual organization model is hierarchical: a workspace can contain folders, nested folders, and documents at any depth, as well as documents directly in the workspace. Expected operations may include creating, renaming, moving, duplicating, archiving, deleting, restoring, and permanently deleting folders or documents. Deletion should be deliberate; use recoverable trash behavior where appropriate.

### Content and editing

Memo should evolve to support plain text, rich text, and visual/handwritten content. Rich text may include headings, paragraphs, bold, italic, underline, alignment, ordered and unordered lists, links, curated text colors, highlights, keyboard shortcuts, undo, and redo. Handwriting/drawing should eventually support mouse, touch, and stylus input, pen and eraser tools, stroke size/color, undo/redo, selection, clear, and appropriate zoom/pan.

Documents should be able to mix content, for example text, an equation drawn by hand, and a diagram in one document. Do not assume the durable format must be a single HTML string. Select an extensible representation after evaluating editor stability, React compatibility, accessibility, performance, mobile behavior, persistence, and future drawing integration. Avoid a large editor dependency without evidence that it fits.

### Persistence and lifecycle

Autosave is a core requirement: detect changes, debounce or batch them, persist them, and tell the user whether work is saving, saved, offline, syncing, or in error. Avoid a network request for every keystroke. Account for rapid edits, drawing updates, network loss, refresh, and recoverable local drafts.

The longer-term direction is local-first editing with a sync layer and cloud access across devices. Build in this order: stable editor and persistence first, then local recovery, then synchronization and conflict behavior. Do not introduce distributed offline synchronization before the basic data flow is dependable. Search should ultimately cover document titles, folder names, and content without requiring an unbounded browser-side download.

GitHub repository storage/sync is a possible future integration, not part of the core editor. It will require careful OAuth/token handling, repository/branch selection, file format, commits, permissions, and conflict handling. Do not implement it before the core Memo product is stable.

## 4. Phased delivery

Deliver one independently reviewable feature at a time, with its backend and frontend work kept together when the feature needs both.

1. **Foundation:** Memo workspace route and shell; folder/document navigation; create, rename, and delete; basic editor; authenticated backend persistence; ownership enforcement; autosave.
2. **Rich editor:** formatting, colors, lists, links, shortcuts, undo/redo, and editor usability.
3. **Drawing:** canvas, pen, eraser, stroke controls, colors, undo/redo, and touch/stylus support.
4. **Mixed content:** text, drawings, handwriting, images, and structured blocks in one document.
5. **Offline and sync:** local persistence, offline mode, synchronization, conflict handling, and recovery.
6. **Cloud and integrations:** cross-device cloud behavior and, later, optional GitHub integration.
7. **Advanced workspace:** scalable search, tags, favorites, trash, history, sharing, export/import, and collaboration only if needed.

Do not start later phases just because they appear in this vision. Each feature should be inspected, planned, implemented, tested, verified, and documented before the next one begins.

## 5. Architecture and ownership

- `memo/frontend/` owns Memo pages, workspace navigation, editor, drawing UI, Memo state, services, hooks, and Memo-specific components.
- `memo/backend/` owns Memo routes, controllers, validation, services, repositories, models, and business rules.
- The root frontend owns application bootstrap/routing and mounts Memo; it must not own Memo domain state or UI implementation.
- The root backend is the composition root and mounts Memo routes; it must not duplicate Memo business logic.
- Memo may consume public Platform capabilities (including authentication, authorization, logging, and shared infrastructure) and generic shared packages.
- Memo must not import Resume Builder. Platform and shared packages must not import Memo or Resume Builder.
- Keep exactly one canonical Memo implementation under `memo/`; retain legacy naming only where compatibility requires it.

The existing Memo backend—Note model, repository, service, controller, and routes—is the foundation. Inspect it and its consumers before changing data or creating a parallel implementation. Preserve user data and avoid schema changes unless a concrete feature requires a reviewed backward-compatible migration.

## 6. API and compatibility

The existing HTTP API remains `/api/notes`; do not rename it to `/api/memo`. Preserve existing `/notes` and `/products/notes` frontend redirects. Internal product and package names remain Memo. Preserve existing request/response behavior, authentication, status codes, and data semantics unless a feature explicitly requires a reviewed contract change.

## 7. Security, privacy, and quality

Memo is production software. Every protected operation must authenticate the user and enforce ownership on the backend; never trust a client-supplied owner ID or frontend-only route guard. Validate input, bound request sizes and result counts, prevent cross-user access, return safe errors, and avoid logging note contents or secrets.

Rich text, links, uploaded files, and model output are untrusted. Sanitize or safely render content to prevent XSS; validate file type, size, and access if uploads are added. Keep integrations least-privileged and credentials out of the browser. AI is not currently a required Memo capability; if introduced later, enforce permissions and safety rules in trusted server code, constrain tools, validate output, minimize sensitive data sent to providers, and defend against prompt injection and cost abuse.

Consider keyboard access, focus, screen readers, semantic controls, contrast, reduced motion, touch target size, desktop/tablet/mobile behavior, bounded rendering, and efficient persistence. Apply caching, virtualization, and advanced optimization when actual scale justifies them.

For every feature, inspect current routes, models, Platform exports, shared packages, consumers, and tests first. Define acceptance criteria and failure/security cases; implement the smallest complete vertical slice; run relevant tests and build/runtime checks; document what changed, why, and how it works. Do not weaken tests or claim verification without evidence. Keep one learning note per independently teachable feature under the repository's `engineering-notes/`, explaining fundamentals first and then the verified CuratoCV flow.

## 8. Current starting point and first slice

The Memo backend has an authenticated notes API mounted at `/api/notes`, including list/create/update and recoverable deletion behavior. The initial responsive frontend workspace landing page now introduces the product, lists the signed-in user's documents, and creates new ones through that API. This is a starting point, not a completed workspace.

The first vertical slice is the **document list and create flow**: the Memo route mounts a workspace view that loads the signed-in user's existing documents and creates a document through the existing API. It preserves ownership, route compatibility, and API contracts. Folder hierarchy, rich-text editing, and autosave are separate follow-up features.

## 9. Decision rule

When this vision and current implementation differ, inspect runtime behavior and data first. Preserve existing behavior unless a feature requires a change. Prefer the smallest safe evolution, record material architectural choices, and ask the product owner when a decision changes user-visible behavior, data meaning, permissions, retention, external-provider use, or material cost. Build a capable workspace without premature collaboration, complex conflict resolution, advanced vector graphics, or integrations.
