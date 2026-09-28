# Platform Authentication and Account Lifecycle

## 1. What Authentication Means

Authentication answers “who is making this request?” Authorization answers “what may that identity do?” A credential such as a password is checked at sign-in; a signed token can then carry identity claims on later requests. A token is a credential: anyone holding it may be able to act as that user until it expires or is invalidated.

CuratoCV uses JWT bearer tokens. A JWT is signed, not automatically encrypted; clients must not treat its payload as secret. The API still verifies it server-side before using its claims.

## 2. Why This Flow Exists

Products need a trusted user identity for profile, resume, payment, and note operations. Keeping authentication in Platform gives these domains one shared identity mechanism. Server-side middleware remains authoritative; a frontend route guard only controls navigation experience.

## 3. General Request Mechanics

```text
Credentials → validation/rate limit → account service → password check
      → signed token → client stores token → request sends Bearer token
      → server verifies signature and identity → protected handler
```

Failures should stop the request before protected business logic. Generic credential errors reduce account enumeration. Authorization must still check resource ownership after identity is known.

## 4. CuratoCV Registration and Login Flow (Verified)

1. [`userRoutes.js`](../platform/backend/src/routes/userRoutes.js) mounts register/login routes with an auth rate limit and body validator.
2. [`userController.js`](../platform/backend/src/controllers/userController.js) passes only `req.validatedBody` to the service and returns a bounded response.
3. [`userService.js`](../platform/backend/src/services/userService.js) normalizes email, checks for an existing account, and creates a User. It passes the plaintext password to the model because the model's save hook handles hashing; the service must not hash twice.
4. [`User.js`](../platform/backend/src/models/User.js) defines password storage/comparison behavior and `tokenVersion`.
5. `authUtils` creates a token with user identity and token version. The controller returns the token to the frontend.
6. [`authService.js`](../platform/frontend/src/services/authService.js) calls the API and persists the token under `curatocv_token`. Platform's Redux [`authSlice.js`](../platform/frontend/src/app/features/authSlice.js) owns in-memory auth state.

On subsequent frontend requests, [`api-client`](../packages/api-client/src/index.js) reads the token and attaches `Authorization: Bearer ...`. The backend [`authMiddleware.js`](../platform/backend/src/middlewares/authMiddleware.js) checks the configured secret, limits/parses the header, verifies the JWT using the allowed algorithm, validates the user ID, reloads the user, and checks token version before attaching identity to the request.

## 5. Account Recovery and Lifecycle

The same Platform owner provides email verification, OTP limits, password reset, profile operations, and account deletion. The route layer applies authentication/validation/rate limits where declared; service/model code implements lifecycle behavior. Password reset increments `tokenVersion`, invalidating tokens that no longer match. Account deletion invokes registered user deletion hooks so product data/assets can be cleaned up through explicit lifecycle integration.

Exact route and behavior evidence lives in `platform/backend/src/routes/userRoutes.js`, `platform/backend/src/services/userService.js`, `platform/backend/src/services/otpService.js`, and `platform/backend/src/services/userServiceHooks.js`.

## 6. Frontend State Versus Security Boundary

`frontend/src/App.jsx` calls `/users/me` at startup when a stored token exists and places the returned public profile in Redux. Protected routes redirect when Redux has no token. This is a user-experience gate only: every protected API still needs backend auth/authorization. The API client's global 401 behavior redirects to login and may call the configured unauthorized handler.

The token currently lives in browser `localStorage`. This is source-verified behavior, not a claim that localStorage is immune to XSS. Treat XSS prevention and token exposure as security concerns; do not put secrets or authoritative entitlements in frontend state.

## 7. Failure Modes and Trade-offs

- Missing/weak `JWT_SECRET` makes protected authentication fail closed with a configuration error.
- Missing, malformed, expired, invalid-signature, unknown-user, or stale-version tokens are rejected.
- Login uses a generic invalid-credentials response for unknown user and incorrect password.
- Database lookup on protected requests supports current-user/token-version checks, with latency and database availability cost.
- Local logout clears browser state; it does not itself revoke a token at the server. Server-side version changes provide invalidation for flows that update that version.
- Email/OTP delivery depends on configured external mail infrastructure; tests use mocks where configured.

## 8. How to Verify

Relevant backend tests include `backend/Tests/auth.test.js`, `protectMiddleware.test.js`, `emailVerificationApi.test.js`, `otpService.test.js`, `otpRateLimit.test.js`, `passwordReset.test.js`, and `accountDeletion.test.js`. Run through root `pnpm test` so backend Vitest config/setup apply.

## 9. Interview Explanation

“Platform owns account identity. Registration and login pass through route-level validation and throttling, then a service uses the User model to store or verify credentials and issues a signed JWT. The frontend stores the token and sends it as a bearer credential. On each protected request, backend middleware verifies signature/claims and confirms the current user and token version. Frontend route guards are convenience only; resource authorization remains server-side.”

Follow-ups: Why is a JWT signed rather than encrypted? Why does password reset change token version? What can go wrong with localStorage? Why isn't a protected React route authorization? How do we prevent one user reading another user's resume?

## 10. Sources and Limits

Verified files: `platform/backend/src/routes/userRoutes.js`, `controllers/userController.js`, `services/userService.js`, `models/User.js`, `middlewares/authMiddleware.js`, `utils/authUtils.js`, `platform/frontend/src/services/authService.js`, `platform/frontend/src/app/features/authSlice.js`, `frontend/src/App.jsx`, and `packages/api-client/src/index.js`. This note describes source behavior; it is not a deployment security certification.
