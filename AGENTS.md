# CuratoCV Engineering Guide

These instructions apply repository-wide. Follow a narrower `AGENTS.md` in a subdirectory when present. Treat source, package manifests, tests, and runtime wiring as evidence; architecture documents describe intent and should be reconciled when they disagree with verified behavior. Never claim a check passed unless it ran successfully.

## Repository Architecture and Ownership

CuratoCV is a pnpm/Turborepo monorepo:

- `frontend/` is the Vite application shell. It owns bootstrap, routing, global providers, navigation, and truly global state.
- `backend/` is a workspace package and the API composition root. It owns startup, global middleware, infrastructure setup, domain route mounting, lifecycle orchestration, and shutdown.
- `platform/` owns authentication, identity, billing, entitlements, shared infrastructure, and common UI/services.
- `resumebuilder/` owns resume state, persistence, editor, APIs, AI, PDF generation, and resume business rules.
- `memo/` owns Memo UI and backend behavior. Its UI is currently a placeholder.
- `packages/` contains generic shared packages such as `api-client` and `shared-utils`.

The Platform, Resume Builder, and Memo frontend directories are source packages consumed by the root Vite app, not standalone apps. Keep domain logic in its owning workspace. The root shell and backend compose products; they must not duplicate product behavior.

## Dependency Rules

Allowed: Product → Platform and Product → Shared. Platform and shared packages must remain product-agnostic. Product-to-product dependencies are forbidden. Declare workspace dependencies and use package exports for cross-package imports; avoid undeclared dependencies and deep filesystem imports when a public export exists. The backend composition root may import domain packages to mount routes and register lifecycle hooks.

## API and Behavior Compatibility

Preserve existing request/response contracts, auth behavior, status codes, and data semantics unless a task explicitly requires a reviewed change. Memo remains the canonical product name, while `/api/notes` is the existing backend contract. Preserve the implemented `/notes` and `/products/notes` redirects. Do not rename these routes for naming consistency. Avoid database/schema/index changes without a compatibility and migration plan.

## Implementation Workflow

Before editing, inspect the target, its consumers, package exports/dependencies, runtime entrypoints, tests, and applicable architecture docs. Identify the canonical owner and make the smallest behavior-preserving change. Search before adding similar functionality. Before deleting, check static and dynamic imports, exports, tests, scripts, configuration, runtime registration, compatibility, and documentation references. Preserve unrelated user changes; never use `git reset --hard`, `git clean -fd`, `git restore .`, or equivalent destructive commands.

Treat auth, authorization, uploads, secrets, and user data as security-sensitive. Validate untrusted input and enforce ownership server-side. Never expose credentials or commit real environment files/secrets. Do not weaken tests to get a green result.

## Build and Test Commands

Run from the repository root:

- `pnpm install` — install the declared workspace graph; do not update dependencies without need.
- `pnpm build` — run the Turbo build graph, including the root frontend build.
- `pnpm test` — run backend tests through `backend/vitest.config.js` and its setup files.
- `pnpm test:all` — run configured workspace test tasks. The root frontend currently has no test files; its command reports an empty suite successfully.
- `pnpm --filter frontend lint` — lint the root application shell.

Domain frontend workspaces are source packages and do not provide independent app scripts. Backend runtime startup (`pnpm --filter backend start`) connects to the configured MongoDB before listening; use an appropriate isolated environment for runtime checks.

Classify failures accurately as code, regression, test, configuration, dependency, infrastructure/environment, or external-service failures. Report exact commands and outcomes; distinguish tests that ran from suites with no tests.

## Documentation and Completion

Keep `README.md`, `docs/architecture/CODEBASE_MAP.md`, and relevant ADRs consistent with verified ownership and boundaries. Do not call the repository production-ready or migration-certified based on documentation alone. Before reporting completion, review `git status` and the diff for accidental, generated, secret, or unrelated changes, and summarize verification evidence and remaining limitations.
