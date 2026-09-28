---
name: auth-bootstrap-timeout-root-cause
description: Root-cause of global auth/bootstrap timeout — MongoDB disconnect + stale nodemon process, not JWT/auth layer.
metadata:
  type: project
---

# Auth / Bootstrap Timeout — Root Cause (What → Why → Flow → Fix)

## What
Every page stayed on `"Loading..."`; `App.jsx` `getUserData` threw `AxiosError: timeout of 10000ms exceeded` on `GET /users/me`. Direct `curl` to `localhost:5000` also hung (exit 28). Root `/` returned 200 only after a clean restart.

## Why (internal working)
- The backend `connectDB()` (`platform/backend/src/configs/db.js`) uses `mongoose.connect(..., { bufferCommands: false, serverSelectionTimeoutMS: 10000 })`; when MongoDB disconnects, operations hang.
- `backend/server.log` showed: `MongoDB connection established.` → `disconnected.` → `established.` → `disconnected.` — the Atlas connection was cycling.
- The live process (PID 19112, started by `nodemon`) was suspended / unresponsive (`0%` CPU, `server.log` stopped writing new entries). The old `nodemon` parent (PID 19094) kept the child alive but not serving.
- `curl` to `/` hung because the suspended process never handled the TCP accept; when restarted cleanly, `/` returned 200 instantly.
- `GET /api/users/me` returned 401 (unauthenticated) and 204 (CORS preflight) instantly after restart — auth middleware (`platform/backend/src/middlewares/authMiddleware.js`) is NOT the stall source.

## Actual CuratoCV flow (post-restart, verified)
1. `App.jsx` `getUserData` → `api.get("/users/me")` → `baseURL` `http://localhost:5000/api` → `GET /api/users/me`.
2. `backend/server.js`: `app.use("/api/users", userRouter)` → `userRoutes.js` `router.get("/me", authMiddleware, userController.getMe)`.
3. `authMiddleware.protect`: verifies Bearer JWT (`jwtSecret` from env) → `User.findById(userIdString)` → sets `req.userId`.
4. `userController.getMe` → `userService.getCurrentUser(req.userId)` → response 200.
5. `App.jsx` dispatches `login()` or `logout()`; `finally` sets `loading: false`; `ProtectedRoute` renders content.

## Boundary verification performed (this session, not skipped)
- `curl --max-time 5 http://localhost:5000/` → hang (old process);
- `curl --max-time 5 /api/users/me` → hang (old process);
- `curl /` (after restart) → 200 OK in ~7ms;
- `curl /api/users/me` (no token) → 401 in ~20ms;
- `curl /api/users/me` (bad token) → 401 in ~28ms;
- CORS preflight (`OPTIONS`) → 204 with allowed headers.
- `pnpm --filter backend test` → 27 test files, 329 passed.
- Direct MongoDB connection test (`mongoose.connect` from `backend/`) → `Connected successfully!` (Atlas reachable).
- `ss -tlpn` confirmed PID 19112 on `*:5000`; `ps` showed `nodemon` parent; killed old process tree and restarted.

## Failure modes / trade-offs
- Old `nodemon` + suspended child = silent failure (logs stop, TCP accepts hang but never respond). Restarting alone fixes it once; root cause is DB disconnect + suspended process.
- `bufferCommands: false` prevents queued DB ops when disconnected, which is correct — it surfaces failure fast instead of queueing indefinitely.
- Do NOT increase `timeout: 10000` in `App.jsx`; the timeout correctly exposed the stall.
- Do NOT claim fix from tests alone — live `curl` and server restart verified.

## Fix applied (minimal, targeted)
- Killed stale `nodemon`/`node` backend trees (`kill -9` on PIDs 19082, 19094, 19112, 53083, 53095, 53116).
- Restarted with `pnpm run server` (new clean `nodemon` + `node server.js` on new PID).
- Verified `MongoDB connection established.` in `server.log`; `/` and `/api/users/me` respond instantly.

## Interview follow-ups
- How does `nodemon` handle child-crash vs child-hang? (Answer: it restarts on crash, not hang — hang requires external kill/restart.)
- Why `bufferCommands: false` vs `true` for DB resilience? (Answer: false surfaces disconnect quickly; true queues silently, hiding failure.)
- How would you detect this without `curl`? (Answer: health-check endpoint + process `readyState` + log tail monitoring.)

## Link
This note: `engineering-notes/auth-bootstrap-timeout-root-cause.md`
