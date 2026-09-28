# Resume Rendering and PDF Export

## 1. What Rendering and Export Mean

Rendering turns structured resume data and presentation choices into a visual document. PDF export captures that document in a portable, page-sized format. Keeping resume data separate from presentation lets the same content use several templates and design settings.

## 2. General Internal Flow

```text
Resume data + design settings
 → normalize fields and sections
 → render a template into the browser DOM
 → apply fonts, colors, spacing, and page layout
 → print the rendered document to A4 PDF
```

The same rendered DOM is a strong starting point for preview and export. The browser still controls font availability and print behavior, so different operating systems or browsers can produce small output differences.

## 3. CuratoCV Implementation

`ResumeBuilder` and `Preview` pass current resume state to `resumebuilder/frontend/src/components/ResumePreview.jsx`. That component normalizes old and canonical personal-information/photo shapes, section entries, and template selection before it renders the React template. `utils/dateFormatting.js` applies the selected date format. The customize panels call the parent state update function, so typography, spacing, colors, photos, and layout can update the preview while editing.

Numeric font and spacing controls are bounded in `utils/resume.js`, persisted by the resume service, and stored in the Mongoose typography and spacing subdocuments in `resumebuilder/backend/src/models/Resume.js`. `ResumePreview` maps these values to CSS variables and uses them for the live template. The preview uses A4 width and fixed A4-height columns for multi-page screen flow.

The builder and preview download actions call `services/exportService.js`. `printResumePreview` opens a print window synchronously from the user's click, copies the visible `.resume-a4-page` DOM and app stylesheets, waits for fonts and images, and opens the browser print dialog. The user chooses “Save as PDF”. In print media the screen columns are removed and the browser lays the same template onto A4 pages. Popup blocking produces an error message instead of silently failing.

The server endpoint remains available for API callers. `GET /api/resumes/pdf/:resumeId` is protected by Platform auth in `resumebuilder/backend/src/routes/resumeRoutes.js`. `resumeController.downloadResumePdf` loads a resume the user owns, renders HTML with `resumeHtmlRenderer.js`, and calls `pdfService.generateResumePdf`. That service reuses a Puppeteer browser promise, creates a page per request, waits for resources, and generates A4 PDF bytes with a safe filename. Root shutdown closes the browser.

## 4. Failure Modes and Trade-offs

- Browser popup settings can block print export; the service reports the problem so the user can allow popups and try again.
- Missing or delayed web fonts and images can change the print layout; the print window waits for available resources before printing.
- Browser, OS, and print preferences may still affect output. “Same rendered DOM” does not guarantee pixel-identical bytes in every environment.
- The user-facing button uses the browser print dialog, which requires the user to choose “Save as PDF”. This avoids a second frontend/server template render and includes unsaved preview changes.
- The protected server PDF route remains a separate implementation. It uses generated HTML and Puppeteer, so it can differ from the React preview.
- Puppeteer startup or rendering can hang if external resource fetches stall; to guarantee generation completes under 5 seconds, all external web font CDN imports were replaced with embedded local `@font-face` declarations (`local()`), eliminating network I/O during rendering.
- Defensive `Promise.race` timeout wrappers guard Puppeteer launch (20s), `page.setContent` (60s), `document.fonts.ready` (5s), image loading (15s), and `page.pdf()` (30s).
- Browser instance reuse allows cold PDF generation in ~650–930ms and warm PDF generation in ~110–140ms.
- Per-request pages isolate generation while consuming minimal CPU and memory.
- Resume ownership is checked before server PDF rendering. Filename sanitization prevents unsafe title characters from becoming a path/name control surface.

## 5. How to Verify

Inspect `resumebuilder/frontend/src/components/ResumePreview.jsx`, `services/exportService.js`, `utils/dateFormatting.js`, the customization controls, `resumebuilder/backend/src/routes/resumeRoutes.js`, `controllers/resumeController.js`, `services/resumeHtmlRenderer.js`, `services/pdfService.js`, and `backend/Tests/pdfDownload.test.js`.
Run `pnpm --filter backend exec vitest run Tests/pdfDownload.test.js` to execute automated integration verification of cold and warm PDF export.

## 6. Interview Follow-ups

“CuratoCV stores resume content separately from design settings. The preview renders current state through React templates, and the user-facing PDF action clones that same DOM into a print window and uses the browser’s A4 print engine. A separate authenticated API export still uses server-rendered HTML and Puppeteer for callers that need generated PDF bytes.”

Follow-ups: Why is the browser print dialog required? How does the app handle local photos before upload? How are numeric settings bounded before persistence? Why do the React and server export paths have different rendering trade-offs? How would automated visual comparison cover fonts and pagination?

## 7. Sources and Limits

Verified files: `resumebuilder/frontend/src/components/ResumePreview.jsx`, `services/exportService.js`, `utils/dateFormatting.js`, `utils/resume.js`, `resumebuilder/backend/src/routes/resumeRoutes.js`, `controllers/resumeController.js`, `services/resumeHtmlRenderer.js`, `services/pdfService.js`, `backend/Tests/pdfDownload.test.js`, and `backend/server.js`. Cold PDF generation completes in ~650–930ms and warm generation in ~110–140ms under local test conditions.
