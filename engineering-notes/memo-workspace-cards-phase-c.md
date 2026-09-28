---
name: memo-workspace-cards-phase-c
description: Folder pocket paper slide-up and document stacked paper lift hover redesign with action bar.
metadata:
  type: project
---

# Memo Workspace Cards (Phase C) — Redesign & Paper Stack Positioning Fix

## 1. What
The Phase C redesign replaces intrusive hover popover preview boxes with tangible, physical paper design metaphors for both folders and document cards in the Memo workspace:
- **Folder Cards**: At rest, folder cards display a clean, rich blue folder silhouette with a distinct top tab (`.folder-shape`). Two internal mini paper sheets (`.folder-paper-sheet`) are nestled seamlessly inside the folder pocket (`opacity: 0`, translated downward). On hover, the paper sheets emerge upward with a slight stagger and rotation (`transform: translateY(...) rotate(...)`), sitting between the upper tab rectangle and the blue folder body without covering adjacent items or sitting too high above the tab.
- **Document Cards**: Document cards use a folded-corner silhouette (`.document-shape`). On hover, the card lifts smoothly (`translateY(-4px)`) and casts a layered 3D stacked paper shadow (`box-shadow: 4px 4px ... 8px 8px ...`), revealing an interactive "Read note →" prompt in the card footer.

## 2. Why
1. **Intrusive Floating Popover Friction**: Previous preview implementations rendered floating preview overlays that covered surrounding grid elements, obscured navigation paths, and required complex coordinate management.
2. **Physical Spatial Metaphor**: Physical paper and folder affordances immediately communicate hierarchy, containment, and document state without requiring mental translation.
3. **Pure CSS Performance**: Relying on GPU hardware-accelerated CSS transforms and transitions (`transform`, `opacity`, `box-shadow`) avoids React state updates, re-renders, and animation frame overhead during mouse movement.

## 3. Internal Working
### Folder Paper Emergence Architecture
- **DOM Structure**: In `memo/frontend/src/pages/MemoWorkspace.jsx`, each folder card contains two decorative paper elements (`.folder-paper-sheet.sheet-1` and `.folder-paper-sheet.sheet-2`) marked with `aria-hidden="true"`.
- **Z-Index Layering**:
  - Container (`.folder-card-container` & `.document-card-container`): Constrains width to `90%` with `margin-inline: auto`.
  - Tab (`.folder-shape::before`): `z-index: 1`
  - Paper Sheets (`.folder-paper-sheet`): `z-index: 2` (positioned at `top: -12px` with `height: 60px` extending into the folder body)
  - Folder Body Surface (`.folder-shape::after`): `z-index: 3` (covers bottom edge of paper sheets)
  - Card Content (Folder icon, folder name, delete button): `relative z-10` (always atop decorative elements)
- **Hover Transitions**:
  - Rest: `opacity: 0; transform: translateY(20px) rotate(0deg);`
  - Hover `sheet-1`: `opacity: 1; transform: translateY(0px) rotate(-1.5deg);`
  - Hover `sheet-2`: `opacity: 0.95; transform: translateY(4px) rotate(1.5deg);`

### Document Stacked Paper Lift
- **DOM Structure**: Document cards render a folded top-right corner via `::before` pseudo-element and subtle translucent surface gradients via `::after`.
- **Hover Effect**:
  ```css
  .group:hover .document-shape {
      transform: translateY(-4px);
      border-color: #94a3b8;
      box-shadow:
          4px 4px 0px 0px rgba(226, 232, 240, 0.9),
          8px 8px 0px 0px rgba(203, 213, 225, 0.6),
          0 12px 24px -4px rgba(15, 23, 42, 0.12);
  }
  ```
- **Action Cue**: The footer contains a hover-revealed link prompt `<span className="flex items-center gap-1 font-semibold text-brand-600 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">Read note <ArrowRight size={13} /></span>`.

## 4. Actual CuratoCV Flow
1. **User lands on Memo Workspace** (`/notes` or `/products/notes`).
2. `useMemoWorkspace` hook loads the root explorer hierarchy containing direct subfolders and root documents.
3. Folders render with `.folder-shape` and hidden `.folder-paper-sheet` child nodes.
4. When the user hovers over a folder card:
   - Folder container detects hover via Tailwind `group` / CSS `:hover`.
   - Paper sheets translate upward from the pocket rim to `translateY(0px)` and `translateY(4px)` with staggered rotation.
   - Folder tab darkens into active brand blue gradient (`#93c5fd` → `#60a5fa` → `#3b82f6`).
   - Trash button fades in with red hover styling (`hover:bg-red-50 hover:text-red-700`).
5. When the user clicks the folder:
   - `selectFolder(folder.id)` updates active folder ID and queries nested contents without triggering card delete handlers (`e.stopPropagation()` on delete buttons).

## 5. Code & Layers
- `frontend/src/index.css`: Defines folder shape (`.folder-shape`), tab pseudo-elements, paper sheets (`.folder-paper-sheet`), paper lines (`.sheet-line`), and document 3D stack box-shadows (`.document-shape`).
- `memo/frontend/src/pages/MemoWorkspace.jsx`: Composes folder and document list items with accessible ARIA tags (`aria-hidden="true"` on decorative papers, semantic `aria-label` on delete buttons).
- `frontend/src/memo/MemoWorkspace.test.jsx`: Unit and integration test suite verifying folder navigation, inline creation, folder deletion, document selection, search, and responsive layout.

## 6. Failure Modes & Trade-offs
- **Overflow Clipping vs Tab Visibility**: Setting `overflow: hidden` on `.folder-shape` clips the folder tab (`top: -13px`). Using `overflow: visible` with a 60px paper height and `opacity: 0` rest state ensures papers stay completely invisible at rest while preserving tab geometry.
- **Accessibility Tree Cleanliness**: Decorative paper sheets contain no semantic content and are marked `aria-hidden="true"` and `pointer-events: none` so screen readers and pointer events focus exclusively on interactive card actions.
- **Touch Device Behavior**: On coarse pointer devices (`@media (pointer: coarse)`), hover transitions do not trigger unexpected layout shifts, and minimum touch target sizes (`min-height: 2.75rem`) are maintained.

## 7. Interview Follow-ups
1. **Q: Why use layered box-shadows instead of multiple DOM elements for stacked paper effects?**
   *A:* Layered `box-shadow` values (`4px 4px ...`, `8px 8px ...`) produce a convincing 3D paper stack illusion entirely in the compositor layer without adding DOM nodes or increasing layout calculation costs.
2. **Q: How does `pointer-events: none` protect interactive card children?**
   *A:* When paper sheets translate above the folder bounds on hover, `pointer-events: none` prevents them from intercepting click or drag events meant for the folder card or adjacent action buttons.

## 8. Verification
- `pnpm --filter frontend test MemoWorkspace.test.jsx` → 20 passed
- `pnpm --filter frontend test` → 58 passed
- `pnpm --filter backend test Tests/notes.test.js` → 26 passed
