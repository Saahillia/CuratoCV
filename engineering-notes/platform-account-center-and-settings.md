# Platform Account Center and Settings Navigation

## Plain-language summary

An account center gives a user one predictable place to review their identity and reach account controls across multiple products. The page is a navigation and presentation layer: it should only offer a control when the owning service can actually perform and persist that change.

## What an account center is

An account center is a shared part of an application that brings together account identity, security entry points, subscription management, product links, and data controls. A **profile** describes the account identity shown to the user. **Settings** describe account-level actions or preferences. A settings screen can link to a secure flow without owning that flow; for example, password recovery belongs to the authentication lifecycle.

Account-level profile data is distinct from product content. A resume may contain a candidate's professional biography and contact details, while the platform profile contains the identity used to sign in and manage the account. Keeping those models distinct avoids overwriting one with the other or making one product responsible for the other product's content.

## Why it is useful

When an application has multiple products, placing separate profile controls in each product creates inconsistent destinations and duplicated state. A single Platform-owned destination gives users a stable route and lets products link to it without depending on each other's implementation. It also makes it easier to show current security and billing status in one place.

The UI must distinguish navigation from a real preference. A switch that is not saved gives a false sense of control; a nonfunctional privacy or notification control can cause users to make incorrect assumptions about their data. If persistence or a backend contract does not exist, provide an honest link to an existing workflow or defer the control.

## Internal working

1. A product link navigates to a canonical account route.
2. The application shell checks that the user has an authenticated session before rendering protected account routes. This is a navigation guard, not the API authorization boundary.
3. The account page reads the current user from Platform auth state and, when needed, loads canonical profile data from the Platform API.
4. For updates, the UI validates obvious form constraints, calls the Platform service, and adopts the server's response as the canonical value.
5. Cross-cutting operations such as password recovery, billing, or account deletion link to their existing flows. Their service/backend code remains authoritative.

## Actual CuratoCV flow (verified)

The root router in [`App.jsx`](../frontend/src/App.jsx) mounts `/app` as a protected Platform layout and defines `/app/profile`, `/app/settings`, and `/app/billing` beneath it. `ProtectedRoute` checks frontend auth state to guide navigation; protected API requests still rely on backend authentication and authorization.

[`AccountCenterNav.jsx`](../platform/frontend/src/components/common/AccountCenterNav.jsx) gives the profile, settings, and billing pages the same route navigation. The shared [`AccountMenu.jsx`](../platform/frontend/src/components/common/AccountMenu.jsx) is consumed by Memo, and routes users to profile, settings, billing, or logout. The Products page has equivalent account links. The Resume Builder dashboard identity and Platform desktop/mobile identity links lead to the canonical profile page.

[`Profile.jsx`](../platform/frontend/src/pages/Profile.jsx) loads the current account through `authService.getCurrentUser()`, which calls `GET /users/me`. It updates the account name through `authService.updateCurrentUser()`, which calls `PATCH /users/me`; the server response updates both local page state and Platform Redux state. The field enforces non-empty text and the existing 100-character limit. The update route uses the Platform validator and authenticated user context. The page also exposes email verification and account deletion flows already owned by Platform. The name form's Save button submits the form; Cancel exits edit mode without making a request.

[`Settings.jsx`](../platform/frontend/src/pages/Settings.jsx) links to the existing password-reset, verification, billing, product, profile, and account-deletion destinations. The current repository does not have persisted account notification or general preference APIs, so this page does not present unsaved preference switches. A Settings link to the profile's deletion section uses an in-page hash target; Profile waits for its data-loading state to finish before scrolling the target into view and focusing it.

`Billing.jsx` gets the resume collection from the authenticated Platform `GET /users/resumes` route. That response includes both the owned resume array and the server count; Billing uses the count and refuses to display a false zero if the request fails. Resume Builder calls Platform's `notifyResumeCollectionUpdated()` after server-confirmed create, duplicate, upload, and delete operations. Billing refreshes on that same-tab event, when the window becomes visible/focused, and every 15 seconds while mounted to pick up changes from another tab. A failed refresh preserves the last known value and shows a retryable warning.

## Code and layer ownership

- **Root shell:** `frontend/src/App.jsx` owns route composition and protected-route placement.
- **Platform frontend:** `platform/frontend/src/pages/Profile.jsx`, `Settings.jsx`, `Billing.jsx`, and `components/common/AccountCenterNav.jsx` own account UI and navigation.
- **Shared identity entry points:** Platform owns `AccountMenu.jsx`, Platform's `Navbar.jsx`, and Products navigation. Resume Builder uses the Platform route through a normal router link.
- **Platform API:** `platform/frontend/src/services/authService.js` calls the existing current-user API. The platform backend route, controller, service, repository/model, and validator own actual profile reads and updates.
- **Cross-product rule:** Memo and Resume Builder link to Platform account routes; neither product owns or imports the other's account behavior.

## Security, failure modes, and trade-offs

- Frontend protected routes improve navigation but do not authorize API access. The server must continue to derive the account identity from verified auth context.
- A failed current-user request must leave the user informed and avoid replacing canonical values with stale form input.
- Password recovery must retain its generic response behavior to avoid revealing whether an email is registered. CuratoCV's existing forgot-password flow requires the user to enter their email; the Settings link does not pass email in the URL.
- Account deletion is irreversible. The existing Profile flow requires the user to type `DELETE`; the Settings page only navigates to that review and confirmation section.
- Adding notifications, locale, timezone, avatar, or other account preferences requires a defined data contract, server-side validation, persistence, and tests before offering interactive controls.
- A shared account route adds links from several products, so route compatibility matters. Existing `/app/profile` remains canonical; the new `/app/settings` route supplements it.

## Verification in CuratoCV

[`AccountCenter.test.jsx`](../frontend/src/account/AccountCenter.test.jsx) checks the cross-product destinations and the canonical name-save behavior. `MemoWorkspace.test.jsx` checks the shared account menu's profile, settings, and billing routes. The relevant commands and outcomes are recorded in the implementation summary and should be rerun after route or API changes.

## Why this design and trade-offs

Platform owns account identity, billing entry points, and the account lifecycle, so it is the right home for shared account UI. Separate route components keep settings discoverable by direct URL while a shared section nav gives Profile, Settings, and Billing a consistent mental model. This adds a small amount of navigation wiring but avoids duplicated product-specific account state.

The page favors truthful links to existing capabilities over a broader-looking preference screen that cannot save changes. That leaves notifications and account preferences as future work until their product semantics and persistence are defined.

## Interview follow-ups

- Why should the frontend route guard not be treated as authorization?
- Why should the account identity model remain separate from resume personal information?
- How should a notification preference move from a UI proposal to a production feature?
- Why does password recovery avoid revealing whether an account exists?
- How can the API prevent one user from updating or deleting another user's account?

## Sources and verification date

Source files: `frontend/src/App.jsx`, `frontend/src/account/AccountCenter.test.jsx`, `frontend/src/account/BillingUsage.test.jsx`, `platform/frontend/src/pages/Profile.jsx`, `Settings.jsx`, `Billing.jsx`, `platform/frontend/src/components/common/AccountCenterNav.jsx`, `AccountMenu.jsx`, `Navbar.jsx`, `platform/frontend/src/services/authService.js`, `platform/frontend/src/services/resumeUsageEvents.js`, `platform/backend/src/routes/userRoutes.js`, and `platform/backend/src/validators/userValidator.js`. Reviewed on 2026-10-03. This note describes repository behavior; it is not a deployment or security certification.
