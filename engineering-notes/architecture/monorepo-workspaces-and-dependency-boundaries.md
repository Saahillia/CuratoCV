# CuratoCV Monorepo Workspaces and Dependency Boundaries

## 1. Plain-Language Summary

CuratoCV keeps multiple related applications and shared capabilities in one repository. The root frontend is the web app shell, and the root backend starts the API and connects product routes. Platform, Resume Builder, and Memo each own their own domain code. The repeated `frontend/` and `backend/` names indicate ownership boundaries; they are not automatically duplicate applications.

## 2. What Is a Monorepo Workspace?

A **monorepo** stores multiple related packages in one version-controlled repository. A **workspace** is the package manager's declared set of projects. pnpm reads `pnpm-workspace.yaml`, discovers each matched `package.json`, and links workspace packages so one package can depend on another using `workspace:*`.

The repository has one root workspace and one root `pnpm-lock.yaml`. The lockfile records dependency resolution for all workspace projects. pnpm's root `node_modules/.pnpm` is its virtual dependency store; small `node_modules` directories inside packages link each package to the dependencies declared for it. Their presence alone does not mean full independent installations or duplicated source code.

## 3. Why CuratoCV Uses This Structure

CuratoCV has two product domains—Resume Builder and Memo—and common Platform capabilities. Keeping ownership separate helps prevent one product's business rules from leaking into another. The root shells compose those domains for the running application.

This structure is useful while the products share a repository and platform, but it has a cost: contributors must understand package ownership, imports, exports, and workspace tooling. A repeated directory name is reasonable only while its role is clear and its package is genuinely consumed.

## 4. Where It Lives in CuratoCV

- `frontend/`: runnable Vite shell, app bootstrap, global routes and providers.
- `backend/`: runnable Express composition root, global middleware, startup/shutdown, and backend test orchestration.
- `platform/frontend` and `platform/backend`: Platform source packages.
- `resumebuilder/frontend` and `resumebuilder/backend`: Resume Builder source packages.
- `memo/frontend` and `memo/backend`: Memo source packages. The UI is currently a placeholder; the backend is active.
- `packages/api-client` and `packages/shared-utils`: the current generic shared packages.
- `pnpm-workspace.yaml` and root `pnpm-lock.yaml`: the authoritative workspace definition and dependency resolution.

The domain frontend directories are consumed by the root Vite app; they are not standalone applications. The root backend imports domain routers and mounts them. Domain business logic remains in its owning package.

## 5. What Happens When pnpm Resolves a Workspace Command?

```text
pnpm command
    ↓
Find the workspace root and read pnpm-workspace.yaml
    ↓
Discover package.json files matching workspace patterns
    ↓
Resolve declared dependencies from pnpm-lock.yaml
    ↓
Link local workspace dependencies and package-specific modules
    ↓
Run the selected package script
```

`pnpm --filter backend test` selects the backend workspace package from the root and runs its Vitest script/config. Running a package command from a nested workspace root can change which lockfile and package graph pnpm sees; therefore nested workspace metadata must not compete with the declared root workspace.

## 6. Runtime Request Flow: Memo API Example

The browser reaches the Express composition root, which mounts the Memo router at the existing `/api/notes` contract. The current Memo frontend is only a placeholder; this describes the backend path, not an implemented frontend-to-API feature.

```text
HTTP request to /api/notes
    ↓
backend/server.js: global API middleware and rate limiting
    ↓
Memo notes router
    ↓
Platform authentication middleware
    ↓
Memo controller: HTTP request/response handling
    ↓
Memo service: validation and domain rules
    ↓
Memo repository: user-scoped database operations
    ↓
Mongoose Note model and MongoDB
    ↓
response returns through controller and Express
```

An unauthenticated request is rejected by Platform auth middleware. Repository queries scope notes by verified `userId`; tests cover cross-user access denial. `/api/notes` remains for compatibility; the frontend product route is `/products/memo`, with current legacy redirects retained.

## 7. Security and Failure Boundaries

- Workspace boundaries organize code; they are not runtime security boundaries. Authorization must still be enforced by backend code on each operation.
- Memo's router uses Platform `protect` middleware; note data access is user-scoped in the Memo repository.
- The root server applies global API rate limiting and registers the domain routers.
- A package can be correctly placed and still have unsafe behavior. Validate all request input, enforce access server-side, and return safe errors.
- TLS termination, production CORS/header deployment settings, infrastructure isolation, and production database permissions require deployment-specific verification; workspace structure alone proves none of them.

## 8. CuratoCV Workspace Cleanup (Verified)

The repository previously had a second tracked workspace marker and lockfile under `backend/`, alongside the root workspace. The nested lock recorded an outdated dependency graph. It caused pnpm commands launched from the backend directory to see a different workspace and stale Mongoose 9 metadata, while the root graph used Mongoose 8. The nested metadata was removed; the root workspace is now authoritative.

The old backend-local `node_modules/.pnpm` virtual store was about 194 MB and contained stale packages. It was removed after confirming package links resolve from the root store. Current observed state after cleanup: root store about 602 MB, backend's package link directory about 196 KB, and backend resolves Mongoose 8.24.4. Other workspace-local `node_modules` directories are small pnpm link farms and are expected.

High-confidence unreachable/no-op files were also removed: the route-inspection scratch script, a stale test-results pointer, an empty Playwright config with no Playwright test setup, a comment-only Memo test, an unused legacy Memo launcher, and an unreferenced Resume Redux slice. Searches found no repository consumers for these files. The inactive `useLocalResumePersistence` hook was retained because it uses an older local-storage key and may matter for draft compatibility.

## 9. Design Choice, Alternatives, and Trade-Offs

Keeping a root shell/composition root plus domain packages supports independent product ownership and shared Platform capabilities without splitting repositories. A flatter single frontend/backend source tree could be simpler for a single-product application, but would blur ownership as Resume Builder and Memo evolve. Splitting each product into separate repositories would add deployment/version coordination and is not required by current source structure.

The current workspace design is sound if package boundaries stay explicit. Do not merge folders or create more packages solely to make the tree look uniform. Before adding a workspace, verify that it has a real owner, manifest, consumers, scripts appropriate to its role, and a test/build strategy.

## 10. How to Verify the Workspace

Run from repository root:

```sh
pnpm --recursive list --depth -1
pnpm --dir backend list --depth -1
pnpm --recursive list mongoose --depth 0
pnpm install --lockfile-only --offline --frozen-lockfile --ignore-scripts
pnpm build
pnpm test:all
```

After the nested workspace cleanup, root and backend-context listings both resolve the same 10 workspace projects; backend and domain packages resolve Mongoose 8.24.4. Build passed. `pnpm test:all` passed with 273 backend tests; the root frontend currently has zero tests. Lint reports a pre-existing unused `navigate` error and a hook dependency warning in `frontend/src/App.jsx`.

## 11. Interview-Ready Explanation

> CuratoCV is a pnpm monorepo with one root frontend shell and one backend composition root. Platform, Resume Builder, and Memo are workspace packages that own their respective capabilities. Products may consume Platform and generic shared packages, but products do not depend on each other. pnpm links the workspaces through one root lockfile and virtual store. At runtime the root backend mounts each domain's router; authentication and data ownership are still enforced by backend middleware and domain services. We keep domain frontend folders as source packages rather than pretending each is a separate web app.

Likely follow-up questions:

- Why use a monorepo instead of separate repositories?
- What does pnpm's workspace link do, and what does it not do?
- Why is `backend/server.js` a composition root rather than a business-logic layer?
- How does a Memo request get authenticated and restricted to its owner?
- Why are package-local `node_modules` directories present?
- Which deployment/security properties are not guaranteed by this repository structure?
- How would you add another product without introducing product-to-product imports?

## 12. Evidence and Limits

Verified from `pnpm-workspace.yaml`, package manifests/exports, `backend/server.js`, Memo routes/controllers/services/repository/model, app routes, and backend tests. Checks included workspace listings, direct backend Mongoose resolution, frozen lockfile validation, build, and the complete configured test suite. Production traffic routing, deployed TLS, cloud permissions, and live database operations were not tested by this workspace cleanup.
