# React Rendering and State

## What React State Is

React components describe UI from current props and state. State is data that changes over time and should cause the component tree to render again when updated. React rendering computes a new UI description; React then applies necessary changes to the browser DOM. A render is not necessarily a full page reload.

## Why State Ownership Matters

State should live at the narrowest owner that needs to coordinate its consumers. Platform authentication is shared application state; resume editor data is Resume Builder domain state; transient editor selection belongs near editor UI. Putting all state in a global store increases coupling and makes ownership unclear.

## General Event-to-UI Flow

```text
User event → handler → state update → React render
 → compare new UI description → commit DOM updates → browser paints
```

Effects synchronize with external systems after rendering (for example network loading or subscriptions). They should not be treated as the place for every calculation; dependencies determine when an effect is re-run.

## CuratoCV Implementation (Verified)

`frontend/src/main.jsx` mounts React with `BrowserRouter` and Redux `Provider`. The root store registers only Platform's auth reducer. `frontend/src/App.jsx` declares routes and uses a `useEffect` to request `/users/me` when a stored token exists. It dispatches Platform auth actions; `ProtectedRoute` reads auth state to decide which page to display.

Resume Builder's `ResumeBuilder.jsx` owns its resume document and editor interaction state with local React state/hooks. It does not store the resume document in the root Redux store. This preserves product ownership and keeps frequent editor state updates within the product page/components.

## Failure and Trade-offs

- Stale effect dependencies can cause outdated closures or repeated requests; lint currently reports a dependency warning in `frontend/src/App.jsx`.
- Too much global state couples unrelated screens; too much deeply local state can make coordination difficult.
- State updates should be immutable in normal React code; Redux Toolkit provides Immer behavior in reducer functions.
- Client route state and guards are presentation logic, never backend authorization.

## Interview Explanation

“React state is data used to produce UI. An event updates state, React renders the component tree again, computes the necessary DOM changes, and the browser paints them. CuratoCV's root shell owns global auth and routing; the Resume Builder page owns the active resume document and editor state. That avoids making product-specific resume state global.”

Follow-ups: Does a render mean the entire page reloads? When should state be local or global? What does `useEffect` synchronize? Why is a React protected route not security? How can stale dependencies create bugs?

## Sources and Limits

Verified: `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/app/store.js`, Platform `authSlice.js`, and `resumebuilder/frontend/src/pages/ResumeBuilder.jsx`. Browser performance and concurrent rendering behavior have not been benchmarked here.
