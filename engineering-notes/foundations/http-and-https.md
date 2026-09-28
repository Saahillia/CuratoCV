# HTTP and HTTPS

## What HTTP Is

HTTP is an application protocol for request/response communication. A request includes a method, target path, headers, and sometimes a body. A response includes a status code, headers, and sometimes a body. HTTP defines message semantics; it does not itself mean a request is authenticated or authorized.

HTTPS is HTTP sent through TLS. TLS protects data in transit from passive reading and tampering and authenticates the server when certificate validation succeeds. Modern TLS negotiates keys during a handshake and uses efficient symmetric session keys for application data. TLS does not protect data after it reaches a compromised endpoint, and it does not replace API authorization.

## Why the Layers Matter

The browser needs to resolve a domain (DNS), establish transport to a server (typically TCP, though HTTP/3 uses QUIC), establish TLS for HTTPS, then send HTTP messages. Thinking in layers helps diagnose errors: DNS resolution, TCP reachability, certificate/TLS failure, HTTP routing, and application logic are different failure classes.

## Request Flow

```text
URL/domain → DNS address lookup → transport connection
 → TLS handshake/certificate validation (HTTPS)
 → HTTP request → server/proxy → route and middleware
 → HTTP response → TLS-protected return path → client
```

Status codes report protocol-level outcomes; headers carry metadata; body carries representation data. Persistent connections can reuse transport/TLS sessions. Exact protocol versions, ciphers, certificates, proxy, and termination point are deployment concerns.

## CuratoCV Source Reality

The application creates an Express server in `backend/server.js` and mounts its API routes. The source configures CORS, JSON parsing, rate limits, and production security response headers. The provided Express code does not itself show TLS certificate loading or an HTTPS listener; production HTTPS may terminate at a reverse proxy or hosting platform, but that cannot be claimed without deployment configuration.

`frontend/src/App.jsx` calls API paths through the shared Axios client, whose default API base is `http://localhost:5000/api` unless a Vite environment URL is supplied. Therefore HTTPS behavior depends on production environment/deployment configuration. Security headers configured in Express do not encrypt traffic by themselves.

## Failure and Security Considerations

- Certificate hostname/chain/expiry failures prevent trusted HTTPS connections.
- Redirecting HTTP to HTTPS, HSTS, and secure cookie policy must be configured at the public edge where TLS terminates.
- CORS is browser policy, not encryption or authentication.
- Don't put secrets in URLs; URLs can appear in logs/history/referrers.
- Avoid reporting “HTTPS enabled” based only on server application code when TLS may live in infrastructure.

## Interview Explanation

“HTTP defines request and response messages. HTTPS is HTTP protected by TLS, which authenticates the server and encrypts/integrity-protects traffic in transit. DNS and transport connect the client to the server; TLS secures the channel; HTTP routes the application request. CuratoCV's Express source handles HTTP but does not configure certificates, so actual HTTPS must be verified at the deployment edge. TLS still does not authorize a user's API action.”

Follow-ups: What does TLS protect? What happens in a certificate check? Where can TLS terminate? Does CORS replace TLS? Does HTTPS stop a logged-in user accessing another user's resume?

## Sources and Limits

CuratoCV source: `backend/server.js`, `platform/backend/src/configs/security.js`, `frontend/src/App.jsx`, and `packages/api-client/src/index.js`. No production proxy/certificate settings were available in this source inspection.
