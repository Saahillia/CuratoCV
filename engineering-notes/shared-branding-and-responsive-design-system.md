# Shared Branding and Responsive Design System

## General understanding

### What this is

A design system is a small set of shared visual rules and components that gives an application one consistent identity. A brand lockup is the logo mark and wordmark arranged together. Responsive design adapts layout, type size, spacing, content priority, and interaction targets to the device and available viewport; it is not only a narrower desktop page.

### Why it helps

One canonical lockup prevents separate pages from changing the logo artwork, proportions, or spacing. Shared color tokens make a primary action look like the same product everywhere. Responsive rules based on width, height, orientation, and input method help prevent cramped landscape screens and controls that are difficult to tap.

### Internal working

The root Vite app compiles the domain source packages together. Tailwind scans those source directories and emits the utility classes it finds. CSS custom properties define shared palette and spacing values; components combine semantic intent (primary, secondary, danger) with responsive layout classes. Browser media queries then select compact landscape behavior, touch target sizes, and reduced motion based on runtime capabilities.

## CuratoCV implementation (verified)

### Ownership and source flow

- `platform/frontend/src/components/common/BrandLockup.jsx` is the single component that references `/logo.svg` and `/brand.svg`. The mark is displayed at 48×48 and the wordmark at 40px high with its intrinsic 900:220 aspect ratio (about 164px wide), so the wordmark is not stretched.
- Platform home hero and mobile drawer, Platform navbar, footer, Products page, auth layout, and Memo workspace import that component. Memo uses the public `@curatocv/platform-frontend/components/BrandLockup` package export and declares the Platform frontend workspace dependency.
- `platform/frontend/src/components/common/Button.jsx` defines primary, secondary, accent, danger, and quiet variants. Intent remains explicit so destructive and success feedback can keep their semantic meaning.
- `frontend/src/index.css` is the root-shell stylesheet. It scans root, Platform, Resume Builder, and Memo sources; brand/accent tokens feed legacy blue/indigo/purple utility names so existing controls use the shared palette without rewriting every utility reference.
- `platform/frontend/src/components/auth/AuthPageLayout.jsx` gives login, forgot/reset password, and verification states a common lockup and a `min-height: 100svh` content frame. On short landscape viewports, the main content spacing compacts so forms remain reachable.
- Fluid page gutters and background glows use `clamp`; the home hero has a viewport-aware minimum height and a short-landscape override. Coarse pointer devices get 44px shared button targets; reduced-motion preference cuts animation and transition durations.

### Failure cases and trade-offs

An SVG can be visually inconsistent if its aspect ratio is forced, so the wordmark dimensions preserve its 900:220 ratio. A global token alias changes the meaning of old blue/indigo/purple utility names throughout all product source packages; new code should use `brand-*` or `accent-*` directly. Red/green semantic states stay distinct. Responsive unit tests can assert component classes and CSS build output, but cannot prove visual quality at every real device size; browser review at representative widths, heights, and orientations remains useful.

### Verification

`frontend/src/design-system/BrandingResponsive.test.jsx` checks canonical assets, dimensions, button intent/sizing, and the auth frame. `frontend/src/memo/MemoWorkspace.test.jsx` checks that Memo mounts the lockup and keeps its content grid/short-landscape responsive hooks. Run the root frontend test and build scripts after changing these components or tokens.

### Interview explanation

“Platform owns a single logo lockup and shared action component. The root Vite shell scans each domain package and compiles shared palette tokens with their UI classes. At runtime, viewport and input media queries adapt spacing, content height, touch targets, and motion. Product pages consume the Platform brand through a public workspace export rather than copying the assets or drawing a second logo.”

#### Follow-up questions

- Why use an SVG lockup instead of rebuilding the wordmark as styled text?
- Why should destructive actions remain red if the brand palette is navy and teal?
- Why does `svh` behave better than a fixed pixel height on mobile browsers?
- How can unit tests validate responsive intent, and what still requires a browser check?
- Why should a source package use a public export instead of a relative path into Platform?
