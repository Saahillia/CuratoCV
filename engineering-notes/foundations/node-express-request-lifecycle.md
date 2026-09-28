# Node.js and Express Request Lifecycle

## What Node.js and Express Are

Node.js runs JavaScript outside the browser and provides networking, filesystem, and process APIs. Express is a web framework that builds an HTTP application from middleware and routes. Middleware receives a request/response and either ends the response or passes control to the next middleware with `next()` (or an error).

Node's event loop lets one process coordinate many I/O operations without one JavaScript thread per request. CPU-heavy synchronous work can still block progress; expensive PDF/model/file work needs resource limits and appropriate isolation.

## Why the Pipeline Exists

Cross-cutting concerns such as parsing, CORS, rate limits, authentication, error mapping, and route selection should run in a deliberate order. Middleware ordering is functional: a body parser must run before a handler that reads JSON, and a webhook signature checker must receive the correct raw bytes.

## General Internal Flow

```text
Node HTTP server receives bytes
 → Express creates req/res objects
 → middleware chain (each next() hands off)
 → matching router and handler
 → response ends OR error passes to error middleware
```

Once a response is sent, later middleware should not try to send another one. Async failures must reach error handling. A request that never responds consumes connections/resources until timeout.

## CuratoCV Server Flow (Verified)

`backend/server.js` loads dotenv, imports Express and domain routers, awaits MongoDB connection, creates the app, configures trusted proxy behavior, CORS, production headers, disables `x-powered-by`, and parses JSON (preserving raw webhook bytes for the payment endpoint). It then mounts a global `/api/` rate limiter and routers, followed by a structured 404 handler and Platform error middleware. The server listens only after database initialization and closes the PDF browser during shutdown signals.

An API request therefore passes through global middleware before a domain route. For example, `/api/notes/...` then enters the Memo router, auth middleware, controller, and service. Root backend imports domain packages for composition; domain business logic remains in those packages.

## Failure and Trade-offs

- Middleware order errors can break CORS, body parsing, signature verification, rate limiting, or error responses.
- Trust proxy must match actual infrastructure or client IP/rate-limit decisions can be wrong.
- The current source configures HTTP Express but does not demonstrate HTTPS certificate termination.
- Awaiting MongoDB at startup avoids serving requests without the required database, but makes startup depend on DB availability.
- Signal shutdown closes PDF browser then HTTP server; graceful completion behavior should be checked under real process orchestration.

## Interview Explanation

“Node runs the server process; Express organizes an incoming request as an ordered middleware chain. CuratoCV's root server connects the database, applies global network/security/parsing/rate-limit middleware, mounts Platform and product routers, then 404 and error handling. Each layer either responds or calls `next`; middleware ordering determines what data and protections downstream handlers receive. The root assembles domains but their business rules stay in their workspaces.”

Follow-ups: What does `next(error)` do? Why does middleware order matter? Why preserve raw webhook bytes? What can go wrong with trust proxy? What blocks the Node event loop?

## Sources and Limits

Verified: `backend/server.js`, route/middleware imports, and `platform/backend/src/middlewares/errorMiddleware.js`. Deployment proxy, process manager, TLS, and observed shutdown under production load are not source-verified.
