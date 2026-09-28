# Shared API Client and Utilities

## 1. What a Shared Package Is

A shared package contains code used across product boundaries without taking ownership of one product's behavior. A shared API client centralizes HTTP transport setup; domain services still own product-specific endpoints and business interpretation.

## 2. Why Centralize HTTP Plumbing

Without a shared client, products can drift in API base URL, timeouts, bearer token attachment, or error handling. Centralization makes transport policy consistent. It does not make the frontend trusted: backend auth, validation, ownership, prices and entitlements remain authoritative.

## 3. CuratoCV API Request Flow (Verified)

`@curatocv/api-client` exports an Axios instance. It resolves the API URL from supported Vite environment variables, normalizes the `/api` suffix, sets JSON defaults and a 30-second timeout, and reads `curatocv_token` from localStorage at request time to add a Bearer header. Its response interceptor routes 401s through an optional handler and redirects to `/login`; it also extracts a safe server message when present.

Product services import that client: for example, Platform's `authService.js` calls `/users/...`, and Resume Builder's `resumeService.js` calls `/resumes/...`. Memo's frontend currently has a placeholder page and no active API service consumer was verified. Thus:

```text
Product page → product service → shared api-client → backend route
```

The shared package owns HTTP transport behavior, not user authentication policy or domain endpoint semantics.

## 4. Shared Utility Boundary

`packages/shared-utils` currently exports generic helpers such as validation, sanitization, and object ID handling. It must stay product-agnostic. A utility that knows resume sections, Memo content, or billing entitlements would belong to that owning domain, not this package.

## 5. Failure Modes and Trade-offs

- Invalid/missing API URL falls back to the source default `http://localhost:5000/api`; deployments must configure the proper URL.
- localStorage reads can throw or be unavailable; client catches token-read errors and continues without a token, so protected calls fail server-side.
- A global 401 redirect is convenient but can interrupt a page; callers should not treat a frontend callback as token revocation.
- One shared client makes common behavior consistent but should not absorb product-specific retry, caching, or request contracts without a genuine cross-domain need.

## 6. How to Verify

Inspect `packages/api-client/src/index.js`, both shared package manifests/exports, consumer imports, and root Vite alias configuration. Search for direct Axios clients before adding another transport wrapper.

## 7. Interview Explanation

“The shared API client centralizes URL configuration, timeouts, bearer-token attachment, and global unauthorized handling. Product services call it with their own endpoints, keeping domain behavior in the owning package. This reduces transport duplication, but the backend remains the security authority and shared packages must not import product code.”

Follow-ups: What belongs in a generic client? Why is client-side token handling not authorization? What happens when no API URL is configured? Why keep product API service methods outside the shared package?

## 8. Sources and Limits

Verified files: `packages/api-client/src/index.js`, `packages/api-client/package.json`, `packages/shared-utils/package.json`, product service files, root `frontend/vite.config.js` (or current Vite config), and workspace boundary docs. This note does not certify deployment environment configuration.
