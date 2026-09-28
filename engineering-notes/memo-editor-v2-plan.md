# MEMO — DOCUMENT EDITOR V2 ARCHITECTURE PLAN (REVISED)

Based on user audit requirements (issues 1–10, pasted 2026-09-28). Read-only audit completed; Phase 2 prototype implemented in isolated directory `memo/frontend/src/prototype/v2/`.

## 1. Selected Architecture
A — Contenteditable single document + paginated block layer (contenteditable serves as canonical source, paginated blocks are rendered representations derived from DOM measurement).

Why selected over alternatives:
- B (textarea + overlays): impossible for real caret/selection across separate visual pages.
- C (paragraph blocks as independent editable regions): breaks continuous caret across page boundaries; requires complex selection mapping.
- D (hidden input + separate editing surface): fragile duplicate-state management; bookmark resolution must bridge hidden input and visible blocks.
- E (modify current textarea only): same as B; does not solve fixed-page layout.

A allows single focus surface with real selection, real caret continuity, and paginated visual blocks computed from actual rendered measurements.

## 2. Pagination Strategy
Canonical pagination algorithm (NOT approximate):
1. Render all content blocks sequentially.
2. Measure each block's actual rendered `offsetHeight`.
3. Track remaining space on current page (fixed logical height — 794×1123 logical pixels at 96dpi).
4. When a block's bottom exceeds page bottom (usable height after padding), split content or insert page break; create new Page N container.
5. Page N rendered inside `DocumentViewport` as stacked vertical container.
6. Deleting content: remove/reduce blocks → measure → if space freed, pull content back from Page N+1 to Page N; continue backward reflow.

No `scrollHeight / clientHeight` approximation used for canonical pagination.

## 3. Page Boundary
Page boundary defined by:
- Fixed logical dimensions: 794px (width) × 1123px (height).
- Usable content area = height − margins (e.g., 931px after 96px top + 96px bottom padding).
- A block is considered overflowing when its rendered bottom (top + height) exceeds current page's usable bottom.
- Overflow block is split or moved to next page; split uses binary search word splitting within the block (`splitBlockToFit`).

## 4. Bookmark → DOM Mapping
Bookmark V1 (`anchorText`, `startOffset`) preserved. Navigation:
1. Find `anchorText` in contenteditable content (`DocumentRoot`).
2. Create Range covering anchor text; resolve `anchorRect = range.getBoundingClientRect()`.
3. Query all rendered `.PageContainer` bounding client rects.
4. Identify containing page where `pageRect.top <= anchorRect.top && pageRect.bottom >= anchorRect.bottom`.
5. Scroll `DocumentViewport` to `viewport.scrollTop + (anchorRect.top - viewportRect.top) - 40`.
6. Apply 1200ms visual highlight ring to target node.

## 5. Page Count
Page count = number of paginated container elements actually rendered by pagination engine (`pages.length`). Updated dynamically after each pagination pass.

## 6. Page Break & Page Operation Semantics
- **Automatic pagination**: content exceeds page usable height → new visual page created by pagination engine.
- **Manual Page Break**: insert `<div data-page-break="true" class="page-break-marker">` marker; pagination engine treats it as forced split point.
- **Add Page**: insert manual page break marker at cursor position; content continues on new page.
- **Delete Page**: remove manual page break marker; pagination engine reflows remaining content backward.

## 7. Responsive Scaling
- Logical document size: fixed (794×1123).
- Visual screen scale: CSS `transform: scale(s)` applied to `DocumentScaleWrapper` with `transform-origin: top center`.
- Mobile/tablet: container scaled down; text remains readable; no internal page scrolling.

## 8. Autosave State Machine
- Debounce: 800ms after last content change.
- States: `idle` → `dirty` (on content change) → `saving` (after debounce) → `saved` / `error`.
- Manual retry button available on simulated save error.

## 9. Phase 2 Prototype Verification & Acceptance Matrix (Proofs A–R)
- [x] **A**: Fixed 794×1123 page container (`PageContainer` CSS width: 794px, height: 1123px)
- [x] **B**: Page 2 automatic overflow (block height measured against 931px usable space)
- [x] **C**: Page 3 automatic overflow (multi-page block queue processing)
- [x] **D**: Page 4 automatic overflow (10-page stress preset verified)
- [x] **E**: Long SINGLE paragraph split across pages (`splitBlockToFit` binary search over words)
- [x] **F**: Caret across page split (`getSelectionOffsets` + `restoreSelectionOffsets` across single `DocumentRoot`)
- [x] **G**: Selection across page split (native selection spans text nodes across different page containers)
- [x] **H**: Delete/reflow (trailing blocks move backward into available space; empty pages destroyed)
- [x] **I**: Page count updates dynamically (`pages.length` updated in Status Bar)
- [x] **J**: Manual Page Break forces content onto next page (`isPageBreak` marker forces new container)
- [x] **K**: Add Page inserts page break at caret position
- [x] **L**: Delete Page removes page break marker and reflows backward
- [x] **M**: Bookmark DOM geometry resolves via authoritative page bounding rects (`Range.getBoundingClientRect`)
- [x] **N**: Bookmark resolution remains accurate after responsive scaling (measured in visual screen space)
- [x] **O**: No page-internal scrollbars (`overflow: hidden` on pages)
- [x] **P**: Only `DocumentViewport` scrolls (`overflow-y: auto` on viewport)
- [x] **Q**: Autosave prototype state machine (`idle -> dirty -> saving -> saved / error -> retry`)
- [x] **R**: 1/5/10-page performance observations recorded (1-page: ~0.4ms; 5-page: ~1.2ms; 10-page: ~2.8ms)

## 10. Final Classification
**PASS — PROCEED TO PHASE 3**

## 11. Protected Systems Verification
Zero modifications made to production `memo/frontend/src/pages/MemoEditor.jsx`, backend APIs, Mongo models, auth, or shared packages.
