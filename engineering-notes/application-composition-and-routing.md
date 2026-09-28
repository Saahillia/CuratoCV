# Application Composition and Routing

## 1. What Composition Means

An application has many modules, but a running process needs one place to connect them: load configuration, create the server or UI root, register middleware/providers, and mount routes. That assembly point is the composition root. It wires components together; domain rules should stay with their owning modules.

## 2. Why CuratoCV Uses Composition Roots

CuratoCV has multiple workspace packages but serves one web application and one API process. The root shell can mount product pages, while the root server mounts product routers. This keeps application startup centralized without moving product business logic into root files.

## 3. Frontend Startup and Route Flow (Verified)

```text
frontend/src/main.jsx
 → BrowserRouter + Redux Provider
 → frontend/src/App.jsx
 → route selects page exported by Platform / Resume Builder / Memo package
```

The root Redux store registers Platform's auth reducer only. On initial load, `App.jsx` checks a stored token and requests `/users/me`; it populates Platform auth state or clears it on 401. `ProtectedRoute` checks loading/token state to choose whether to render or redirect. This is navigation UX; backend middleware still enforces API authentication and authorization.

The shell declares public routes for home/login/email verification/password reset/pricing/public resume views, authenticated product routes, Resume Builder editor/preview, billing/profile, and compatibility redirects. `/notes` and `/products/notes` redirect to Memo; `/memo` redirects to `/products/memo`. Memo currently mounts `MemoPlaceholder`, not a full notes application.

## 4. Backend Startup and Route Flow (Verified)

```text
backend/server.js
 → load dotenv / connect database / configure proxy, CORS, headers, JSON parser
 → global API rate limiter
 → mount Platform, Resume Builder, Memo and health routers
 → 404 and global error middleware
 → listen + graceful shutdown (close PDF browser)
```

The composition root imports domain routers and lifecycle hooks. Mounted prefixes include `/api/users`, `/api/resumes`, `/api/ai`, `/api/payments`, `/api/subscriptions`, `/api/notes`, and `/api/health`. It preserves raw webhook data for the Razorpay endpoint. Business controllers/services/repositories remain in their domain workspace.

## 5. Failure and Operational Considerations

- Database connection is awaited before the server begins accepting requests; startup depends on configured MongoDB.
- CORS allows no-Origin calls and configured origins, plus local origins outside production; deployed origins need configuration.
- Production security headers are set from Platform security configuration; deployed values still require environment/runtime verification.
- Global API rate limiting runs before mounted API routers; auth routes apply stricter route-level limits.
- Graceful shutdown closes the Puppeteer browser and HTTP server. Signals and external resource failures should be exercised in deployment checks.
- Root imports across workspace directories are intentional composition imports. Product-to-product imports remain forbidden.

## 6. How to Verify

Inspect `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/app/store.js`, `backend/server.js`, `pnpm-workspace.yaml`, and package exports. Current recorded checks are summarized in root `README.md`; rerun them after changes rather than treating this note as certification.

## 7. Interview Explanation

“The frontend root composes BrowserRouter, Redux, global notifications, and product routes. Product pages come from workspace source packages, while the shell owns routing and global auth state. On the backend, `backend/server.js` connects infrastructure and mounts domain routers, global middleware, errors, and shutdown behavior. It is allowed to import domains for composition, but it does not own their business logic.”

Follow-ups: Why is a route guard not API authorization? Why can root backend import product routers? Where does API rate limiting execute? What happens if the database cannot connect during startup? Which routes are compatibility redirects?

## 8. Sources and Limits

Verified paths: `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/app/store.js`, `backend/server.js`, `pnpm-workspace.yaml`, and package manifests/exports. The deployment environment, reverse proxy, TLS termination, and production origin configuration are outside this source-level verification.
