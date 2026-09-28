# Resume Preview Section Rendering and the SECTION_RENDER_MAP Contract

## 1. Plain-language summary

A resume can contain many different kinds of sections (summary, experience,
education, skills, certificates, languages, custom sections, …). The Resume
Preview must render whatever sections the user stored — in the user's saved
order, honouring visibility — without each template hard-coding every section
type. CuratoCV does this with a **section registry → normalization → type-keyed
renderer map** pipeline. This note explains that pipeline, the component
invocation contract it relies on, and the silent failure mode that empty'd the
Classic template's preview when that contract was broken.

## 2. What it is

- **Section registry** — a vocabulary of supported section types and their
  editing configuration (label, entry-based vs single-value, editor component,
  default entry shape).
- **Renderer map** — a dictionary from canonical section type to the function
  that renders that section (`SECTION_RENDER_MAP`).
- **Invocation contract** — the calling convention between a template and a
  renderer. In React, `createElement(Component, props)` calls
  `Component(props)` with **one props object**; a plain
  `fn(data, colors, typography, spacing)` function expects **four positional
  arguments**. Mixing the two conventions silently passes the props bag where
  the data should be.
- **Normalization** — one centralized, pure transformation that converts stored
  resume data (camelCase entry fields, aliases, visibility flags) into the
  exact shape renderers read.

## 3. Why it is needed

Users enter data through the Content Editor into many section types, can
reorder and hide them, and can create custom sections. Templates are a
*presentation* concern; which sections exist is a *data* concern. Without a
registry-driven dispatch, every template duplicates section logic, drifts from
the stored shape, and new section types never appear. A single normalization
step avoids scattering `startDate`-versus-`start_date` conversions through
every renderer.

## 4. General internal working

**Registry-driven rendering.** Instead of templates deciding content, the
template loops the stored sections, resolves each `type` through a map, and
delegates. Empty sections naturally render nothing (renderers early-return
`null` when their data array is empty), and order/visibility are applied by
filtering and sorting the section list before dispatch.

**The component invocation contract.** React function components are just
functions of one argument: the props object. `createElement(type, props)`
builds an element whose render step calls `type(props)`. If the target is
written as a positional multi-argument function, the props object lands in the
first parameter, every other parameter takes its default, and — if the function
checks `data.someField` for an early `return null` — the result is *no output
and no error*. Rendering null is valid React, so nothing is thrown, no error
boundary fires, and the failure is invisible except in the DOM (or in React
DevTools/fiber inspection, where the component fibers exist but produce no
host nodes).

**Adapter pattern.** The safe fix is a thin adapter at the shared layer:
wrap each positional renderer in a component that destructures
`{ data, colors, typography, spacing }` and forwards positionally. One
central adapter fixes every consumer while keeping the original functions
available for direct call sites.

**Centralized normalization.** Field-name aliases (`startDate`/`start_date`,
`school`/`institution`, `major`/`field`), type aliases
(`professional_summary`→`summary`, `experiences`→`experience`), visibility
filtering, and order sorting are computed once, in one pure function, so every
renderer reads one canonical shape.

## 5. CuratoCV implementation (verified)

### Data flow: stored section → preview DOM

1. **Editing** — `resumebuilder/frontend/src/components/ContentEditor/*`
   writes every section (including single-value summary/declaration) as
   `section.entries[]` envelopes: `{ _id, order, visible, customization, data }`
   (`SectionRenderer.jsx` reads/writes `section.entries?.[0]?.data?.description`
   for summary/declaration; `FullScreenEntryEditor.jsx` appends/maps/filters
   entries). The vocabulary comes from
   `resumebuilder/frontend/src/config/resumeSectionRegistry.js` (15 types:
   summary, professional_summary, declaration, experience(s), education(s),
   skills, projects/project, certificates, courses, awards, languages,
   interests, organisations, publications, references, custom).
2. **Persistence** — `PUT /api/resumes/update/:resumeId` stores
   `sections[]{type,title,order,visible,customization,entries[]}` in the
   `Resume` model; `GET /api/resumes/get/:resumeId` returns it unchanged.
3. **Normalization** — `ResumePreview` calls
   `normalizePreviewData(data)` from
   `resumebuilder/frontend/src/utils/previewNormalization.js` (re-exported by
   `ResumePreview.jsx` for existing importers). It canonicalizes types via an
   alias map, filters `visible !== false`, sorts by `order`, keeps the full
   section shape (customization + entries) in `previewSections`, renames entry
   fields into snake_case top-level arrays (`experience`, `education`,
   `skills`, `projects`, …), zeroes top-level fields for hidden core sections,
   and polyfills `sections` from legacy root-level arrays when a stored resume
   has no `sections` array.
4. **Dispatch** — `SECTION_RENDER_MAP` in
   `resumebuilder/frontend/src/components/templates/TemplateSections.jsx`
   maps all 15 canonical types to renderers. Since the fix for the empty
   Classic preview, every map value is produced by the local
   `asSectionComponent(renderFn)` adapter, which returns a component
   `({ data, colors, typography, spacing }) => renderFn(data, colors, typography, spacing)`.
   The positional functions (`renderSummary`, `renderExperience`, …) stay
   exported for direct call sites.
5. **Templates**:
   - **Classic** (`templates/ClassicTemplate.jsx`) loops
     `data.sections`, filters `visible !== false`, sorts by `order`, resolves
     the type alias, and calls
     `createElement(renderSection, { data, colors: col, typography, spacing })`.
     The template decides *presentation* only; the stored sections decide what
     exists.
   - **Modern / Minimal / MinimalImage** render their five core types
     (summary, experience, projects, education, skills) with inline JSX and
     literal headings; their ten supplemental types (certificates, courses,
     awards, languages, interests, organisations, publications, references,
     declaration, custom) are dispatched through the same map in
     `ResumePreview.jsx`'s `supplementalSections` list (classic excluded to
     avoid duplication), now passing `resolveColors(design.colors)` because
     this direct path — unlike templates, which resolve colors internally —
     must hand renderers already-resolved semantic colors.
6. **Renderers** (`TemplateSections.jsx`) are plain positional functions
   `renderX(data, colors, typography, spacing)`. They read the normalized
   top-level arrays (`data.education`, `data.skills`, …), look up per-section
   customization with `findSectionCustomization(data, type)` and
   `getSectionTitle(data, types, fallback)` from `data.sections`, and early
   return `null` when their data is empty. Classic keeps the ATS skills
   format: `renderSkills` renders `<strong>Category: </strong>a, b` rows
   (or the stored `sectionSpecific.layout` grid).
7. **Pagination** — `ResumePreview`'s `useLayoutEffect` measures the
   measurement root's `<section>` elements and clones them into A4 page
   markup. It consumes whatever the section pipeline produced.

### The bug and its diagnosis (Classic preview empty)

Symptom: the Classic preview rendered only `<header>` (and footer) — zero
`<section>` elements — despite stored data for 14 visible sections, with no
console or page errors.

Evidence chain (single-run browser probe on an isolated stack):

- `ClassicTemplate` fiber props: `data.sections = 14`,
  `professional_summary` present, `education: 2`, `skills: 2` — normalization
  was correct.
- The fiber tree contained all 14 renderer component fibers
  (`renderSummary` … `renderCustomSections`) — dispatch found every type.
- The DOM had only `HEADER` — every renderer returned `null`.

Root cause: the renderers are positional functions, but both consumers
dispatched them with `createElement(Renderer, { data, colors, typography,
spacing })`. React called `Renderer(propsBag)`, so the first parameter `data`
received `{ data, colors, typography, spacing }`; `data.professional_summary`
was `undefined` → `return null` (and `findSectionCustomization(propsBag)`
found no `sections` → the other renderers returned `null` too). Affected:
**all** Classic sections, plus the ten supplemental types for
Modern/Minimal/MinimalImage through the same `createElement` pattern in
`ResumePreview.jsx`. The five inline core sections of the non-classic
templates were unaffected.

### Code and layers

| Layer | File | Role |
| --- | --- | --- |
| Editor | `resumebuilder/frontend/src/components/ContentEditor/*.jsx` | writes `section.entries[]` |
| Registry | `resumebuilder/frontend/src/config/resumeSectionRegistry.js` | canonical type vocabulary |
| API/model | `resumebuilder/backend/src/models/Resume.js`, `routes/resumeRoutes.js` | persists/returns sections |
| Normalization | `resumebuilder/frontend/src/utils/previewNormalization.js` | one canonical preview shape |
| Renderer map | `resumebuilder/frontend/src/components/templates/TemplateSections.jsx` | type → adapter-wrapped renderer |
| Templates | `templates/ClassicTemplate.jsx` (+ Modern/Minimal/MinimalImage inline core) | presentation + dispatch |
| Preview shell | `components/ResumePreview.jsx` | normalization call, supplemental dispatch, pagination |
| Tests | `frontend/src/resume-builder/ResumePreview.test.jsx` (5 tests) | order, data fields, ATS skills, visibility, supplemental |
| Parity suites | `tests/unit/backend/services/resumeDesignParity.test.js`, `resumeHtmlRenderer.test.js` | unchanged; source-text assertions unaffected |

## 6. Failure modes and trade-offs

- **Silent null rendering** (the incident above): wrong calling convention
  produces no exception — only missing DOM. Mitigation: the contract now lives
  in one adapter (`asSectionComponent`) next to the map, with the renderers'
  positional signatures left explicit and exported. A focused React test
  asserts the end-to-end outcome (sections present, ordered, filtered).
- **Empty means invisible by design**: renderers return `null` when their data
  array is empty, so a stored-but-empty section shows nothing (a heading is
  never stranded without content).
- **Index-based customization fallback**: `findEntryCustomization` first tries
  a reference match (`e.data === entryData`) but normalization creates new
  renamed objects, so it falls back to array index; entry lists are filtered
  identically in both paths, so indexes stay aligned — but reordering entries
  without updating both sides would mis-assign customization.
- **Dual calling conventions**: positional functions are convenient for
  non-React reuse (and for the backend parity suites reading helpers), while
  components serve `createElement` dispatch. The adapter keeps both working;
  the cost is one indirection layer to understand.
- **Observed, out of scope — zoom × pagination measurement**: the preview's
  zoom wrapper applies `transform: scale(0.85)` to an ancestor of the
  measurement root, so `getBoundingClientRect()` heights are scaled while
  `usableHeight` is computed in unscaled A4 pixels. For the verified test
  fixture this under-measured content (`scaledUsed 1033 ≤ budget 1047` while
  `unscaledUsed 1214 > 1047`, `scrollHeight 1500 > 1123`), so Classic stayed
  on a single overflowing page, whereas the same code split correctly when
  over the scaled budget (Modern: 2 pages). This interaction predates the
  section-rendering fix and any change belongs to the A4/pagination system
  (which this task must not modify); a future fix would measure with
  `offsetHeight` or move the measurement root outside the scaled wrapper.

## 7. Interview follow-ups

- Why does `createElement(fn, props)` not "just work" for a function written
  as `fn(a, b, c)`? What error would you expect — and why is the *absence* of
  an error more dangerous here?
- Where would you put the type-alias conversion so both the preview and a
  server-side renderer agree? How do you prove they stay in sync?
- How do order and visibility propagate from the editor to the DOM? Which
  layer filters, and what happens if two layers filter differently?
- Renderers returning `null` for empty data: a feature or a hazard? What UI
  (if any) should show an empty section in the editor versus the preview?
- How would you test a component whose pagination depends on layout
  measurement in jsdom (where all heights are 0)?

## 8. Verification performed

- `pnpm --filter frontend test` — 3 files / 16 tests passed (5 new:
  `frontend/src/resume-builder/ResumePreview.test.jsx`).
- `pnpm test` — 26 files / 328 tests passed (backend + shared suites).
- `pnpm build` — success.
- Browser (isolated stack + Vite, Chrome): Classic preview renders 14
  sections / 14 `<h2>`s in saved order with the hidden section excluded;
  Modern renders 5 core + 9 supplemental headings; no page errors.
- PDF download unchanged: `GET /api/resumes/pdf/:id` → 200, valid `%PDF`,
  expected filename, section text present (3 pages).
