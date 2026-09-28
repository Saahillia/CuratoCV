# JSON Web Tokens (JWT)

## What a JWT Is

A JSON Web Token is a compact token format made of Base64URL-encoded header, payload, and signature segments. A signed JWT lets a verifier detect tampering if it has the correct key. The payload is readable unless a separate encryption format is used; never put secrets in ordinary JWT claims.

## Why Use One

A client can present a signed token on later requests without sending the password repeatedly. The server verifies signature and registered/required claims, then derives identity. A JWT is still a bearer credential: theft can allow impersonation. It is not automatically a session database, not authorization by itself, and not encryption.

## Internal Verification Flow

```text
Login credentials → password verification → sign claims with key
 → client holds token → Authorization: Bearer <token>
 → parse scheme/token → verify signature + allowed algorithm + expiry
 → validate claims and current account → attach request identity
```

The verifier must choose allowed algorithms explicitly, validate required claim types/values, and apply expiry/revocation policy. A signed claim is trustworthy only after signature verification and still may need current database/authorization checks.

## CuratoCV JWT Implementation (Verified)

`platform/backend/src/utils/authUtils.js` signs HS256 tokens with `JWT_SECRET`, a one-hour expiry, `userId`, optional email, `tokenVersion`, issuer `curatocv`, and issue time. HS256 is symmetric: signer and verifier share the secret. The source requires `JWT_SECRET` to exist for token creation; middleware also rejects missing or weak secrets.

`platform/backend/src/middlewares/authMiddleware.js` accepts a Bearer header, caps its size, verifies only HS256, validates `userId`, fetches the User, and compares token version. A legacy-token cutoff permits only older tokens lacking `tokenVersion`; modern tokens must exactly match the current account version. The middleware attaches `req.userId` and decoded claims as `req.auth`. Password reset increments token version in `userService`, invalidating older modern tokens.

On the browser, `packages/api-client/src/index.js` loads `curatocv_token` from localStorage for requests. This makes the token available to same-origin JavaScript and creates an XSS exposure concern. The backend remains authoritative. The token is not decoded by the frontend to authorize entitlements.

## Failure Modes and Trade-offs

- Wrong key/algorithm, malformed token, expiry, invalid user ID, deleted user, or token-version mismatch is rejected.
- Symmetric signing simplifies issuance/verification but means every verifier with the secret can also issue tokens; secret management is critical.
- Stateless verification alone makes immediate revocation difficult. CuratoCV's user lookup/tokenVersion check adds a server-side revocation mechanism and database cost per protected request.
- localStorage is convenient but exposed to scripts running in the origin; `HttpOnly` cookies reduce direct JS token access but introduce CSRF design requirements and would be an architectural change.
- JWT claims should be minimal, short-lived, and non-sensitive.

## Interview Explanation

“A JWT is a signed claim container, not an encrypted password or authorization engine. CuratoCV signs HS256 tokens for one hour with the user ID and token version. The client presents the token as a Bearer credential; Platform middleware verifies the allowed algorithm/signature, validates the user, reloads the account, checks token version, and sets request identity. The current frontend stores the bearer token in localStorage, which has an XSS trade-off.”

Follow-ups: Can a user read the payload? Why specify allowed algorithms? How does password reset invalidate tokens? What risk comes from HS256 key sharing? What is the difference between JWT authentication and route authorization?

## Sources and Limits

Verified: `platform/backend/src/utils/authUtils.js`, `middlewares/authMiddleware.js`, `models/User.js`, `services/userService.js`, `platform/frontend/src/services/authService.js`, and `packages/api-client/src/index.js`. Token issuance, config, and code behavior are described; production secret rotation and incident response are not verified.
