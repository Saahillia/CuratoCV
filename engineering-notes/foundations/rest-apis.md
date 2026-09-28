# REST APIs

## What Is an API?

An Application Programming Interface (API) is a contract that lets one piece of software ask another piece to perform work. A web API exposes that contract over a network, usually through HTTP. It defines operations, input/output shapes, authentication expectations, errors, and compatibility rules.

REST is an architectural style for networked resources. In common HTTP APIs, resources have URLs and methods describe operations: `GET` reads, `POST` creates or starts an operation, `PUT` replaces/updates, `PATCH` partially updates, and `DELETE` removes. Real APIs may use conventions imperfectly; inspect the actual contract instead of assuming every endpoint is perfectly RESTful.

## Why Use a Backend API?

The browser should not connect directly to a private database or hold server secrets. An API gives the backend a place to authenticate identity, validate input, enforce ownership and business rules, control persistence, and return a stable response. A frontend route or hidden button is not a security boundary.

## Internal Request Mechanics

```text
Frontend action → API service/client → HTTP request
 → DNS/network/TLS (for HTTPS) → server route
 → middleware → controller → business service → data access
 → HTTP status/headers/body → client parses response → UI state
```

The HTTP method, path, headers, query, and body are separate parts of a request. The response includes status, headers, and an optional body. A useful API contract documents success and failure shapes, authorization, limits, and retry behavior.

## CuratoCV Flow

CuratoCV's root shell uses package `@curatocv/api-client`; domain API methods live in Platform or Resume Builder frontend service modules. Example: `authService` sends registration/login requests to `/users/register` and `/users/login`; the shared client normalizes the base to `/api`, attaches the bearer token when present, and maps some 401 errors to login navigation. `backend/server.js` mounts routers under `/api/users`, `/api/resumes`, `/api/ai`, `/api/payments`, `/api/subscriptions`, `/api/notes`, and `/api/health`.

The create-note request demonstrates an API flow: `POST /api/notes/create` → authentication middleware → Memo controller → service validation → repository/model → JSON response. The endpoint remains `/api/notes` for compatibility; it is not renamed merely because the product is Memo.

## Failure and Trade-offs

- `400` generally indicates invalid input; `401` missing/invalid authentication; `403` authenticated but disallowed; `404` missing resource; `409` conflict; `429` throttling; `5xx` server/provider failures. The actual response contract is endpoint-specific.
- Clients may retry only when the operation is safe or idempotent; repeating a payment or create request can have side effects unless deduplicated.
- Versioning and compatibility cost effort but prevent old clients from breaking silently.
- CORS controls which browser origins may read responses; it does not authenticate users or protect non-browser callers.

## Interview Explanation

“A web API is a network contract between client and server. The client sends a method, path, headers, and data; backend routing and middleware establish context, controllers handle HTTP details, services apply domain rules, and repositories access data. The response returns a status and a documented body. In CuratoCV, a shared Axios client handles transport while product-owned services call the appropriate backend routes. The server—not the UI—enforces identity and resource ownership.”

Follow-ups: Why not expose database credentials to React? What is the difference between authentication and authorization? When can a client safely retry? What does CORS protect and what does it not protect? How do you preserve `/api/notes` compatibility?

## Sources and Verification

CuratoCV source: `packages/api-client/src/index.js`, `platform/frontend/src/services/authService.js`, `backend/server.js`, domain route modules, and `memo/backend/src/routes/notesRoutes.js`. Network infrastructure outside source (DNS, TLS termination, proxy) is deployment-specific and is not certified here.
