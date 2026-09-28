---
name: scale-independent-a4-pagination
description: Scale-independent A4 pagination, unscaled measurement, greedy packing, footer shedding, PDF timeout fix
metadata:
  type: project
---

What → Why → Internal working → actual CuratoCV flow → code/layers → failure modes and trade-offs → interview follow-ups

## What
CuratoCV pagination splits resume content into fixed 210mm×297mm A4 sheets using a pure number algorithm (`packResumePages` / `computePageBudgetPx`) that reads layout sizes through `offsetHeight` and computed styles. Those measurements are unaffected by any ancestor `transform: scale` zoom, so the page count never changes when the user zooms.

## Why
Earlier pagination relied on `getBoundingClientRect`, which multiplies by the zoom factor. That caused page counts to drift when users scaled the preview. PDF download timeouts occurred when Puppeteer waited on `networkidle0` against the external Google Fonts stylesheet without a stable idle state.

## Internal working
- Budget: `(A4_HEIGHT_MM - 2 * margin) * 3.7795 - rootPadding`.  
- `packResumePages` greedily packs sections. Oversized sections split at entry boundaries (`splitSection`). Footer overflow sheds trailing items onto a new last page rather than losing content.
- Preview measurement uses hidden `.resume-preview-measurement` nodes; page clones use `.resume-a4-page`. Both share the same unscaled measurement rules.

## Actual CuratoCV flow
`ResumePreview.jsx` measures `sectionEl.offsetHeight`, `entryEl.offsetHeight`, and `marginBottom`. It passes these to `packResumePages`. `resumeHtmlRenderer.js` produces standalone A4 HTML for `pdfService.js`. The timeout fix changes `waitUntil` from `networkidle0` to `load`, keeping font loading (`document.fonts.ready`) intact.

## Code / layers
- `resumebuilder/frontend/src/utils/pagination.js` — `packResumePages`, `computePageBudgetPx`  
- `resumebuilder/frontend/src/components/ResumePreview.jsx` — unscaled measurement  
- `resumebuilder/backend/src/services/pdfService.js` — `waitUntil: "load"`  
- `resumebuilder/backend/src/services/resumeHtmlRenderer.js` — static A4 HTML renderer

## Failure modes and trade-offs
Footer-shedding requires `current().items.length > 1` so single-item pages are not stripped. Splitting at entry boundaries preserves headings; no empty pages are produced. Changing to `load` removes reliance on external network idleness but still waits for fonts and images explicitly.

## Interview follow-ups
How does `transform: scale` affect `getBoundingClientRect` but not `offsetHeight`? What does the greedy packing guarantee? Why does `networkidle0` hang with external stylesheets? How does footer shedding preserve content?
