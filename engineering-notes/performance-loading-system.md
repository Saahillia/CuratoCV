---
name: performance-loading-system
description: Full performance architecture for CuratoCV — skeleton UI, lazy loading, responsive images, CLS prevention, code splitting, font optimization.
metadata:
  type: reference
---

**Concepts covered:** Skeleton Loading System, Lazy Route Splitting, Responsive Image Pipeline, CLS Prevention / Layout Stability, Code Chunking, Font Preload Strategy, Measurement Discipline.

**What → Why:** Before implementing any performance feature, audit the current state (bundle size, existing loading patterns, asset formats) rather than applying random fixes. This matches the user's instruction: "full performance layer should be done but one thing at a time."

**Internal working:**
- The root route fallback in `frontend/src/components/performance/RouteLoadingFallback.jsx` selects a skeleton by URL while authentication resolves. Each skeleton is owned by the package that owns the page: Platform, Resume Builder, or Memo.
- Platform account, billing, pricing, and checkout screens use `PlatformSkeleton`; resume dashboard, editor, and preview use `ResumeSkeleton`; Memo workspace and editor use `MemoSkeleton`. Page data loading uses these same page-shaped components. Memo's workspace preserves its real header/navigation while document cards load.
- `ResponsiveImage.jsx` uses native `<picture>` with AVIF → WebP → fallback, `loading="lazy"`, `decoding="async"`, and reserved-space `width`/`height` to prevent CLS.
- `frontend/vite.config.js` now splits chunks (`manualChunks`) producing separate JS bundles (`react-vendor`, `redux-vendor`, `lucide`, `dnd-kit`) reducing the main chunk from ~1.17MB to ~955KB.

**Actual CuratoCV flow:**
- App loads → the current route selects a product-owned skeleton immediately → the route content renders when authentication resolves; data-backed pages can show their own matching skeleton while their API request completes.
- Billing requests the server resume count, refreshes immediately after in-app resume collection events, refreshes on focus/visibility, and polls every 15 seconds while open. Request failures keep the last known count and expose a retry state instead of showing zero.
- Images load via `<picture>` with lazy decoding; layout remains stable due to explicit dimensions.
- Chunked routes deliver faster initial bundle (verified by `pnpm build` output: `index-By6LoHAg.js` reduced, split chunks created).

**Failure modes and trade-offs:**
- Skeleton UI without real data is safe (no auth leakage) but requires matching layout updates if the page design changes.
- Chunk splitting improves initial load but introduces extra HTTP requests; acceptable for this scale.
- No automated Lighthouse/CW Vitals measurement environment exists (infrastructure gap); measurement is manual/build-based only.
- No AVIF conversion pipeline exists; `ResponsiveImage` relies on browser format negotiation and source tags, not server-side conversion.
- No database or auth changes made.

**Interview follow-ups:**
- How does skeleton UI differ from spinners? (Structural placeholder vs generic animation)
- Why is CLS prevented by explicit width/height rather than `min-height` CSS alone? (Reserved space before image load prevents shift)
- When is `manualChunks` preferred over `React.lazy()` route splitting? (For vendor dependency separation; route-level splitting requires `lazy()` + `Suspense` — planned but requires additional UI changes)

**Security / State:** Skeleton renders no user/auth data. Chunk splitting does not expose backend routes. Font preload uses only public Google Fonts URLs. Responsive image srcset exposes only public asset URLs.

**Verification performed (2026-10-03):** targeted frontend account-center, billing-usage, route-skeleton, and Memo workspace tests passed (31 tests). `pnpm build` passed, with the existing warning that the main minified chunk exceeds 600 kB. `pnpm test:all` reported 29 backend files / 360 tests passed; the frontend task returned `[ELIFECYCLE] Test failed` without a final Vitest summary or identifiable failing test. `pnpm --filter frontend lint` reported 11 errors in pre-existing unrelated files; lint on the changed root frontend files passed. The full frontend suite therefore remains unverified.

**Link:** See `engineering-notes/performance-loading-system.md`.
