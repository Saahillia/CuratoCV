# CuratoCV Engineering Guide

These instructions apply repository-wide. Follow a narrower `AGENTS.md` in a subdirectory when present. Treat source, package manifests, tests, and runtime wiring as evidence; architecture documents describe intent and should be reconciled when they disagree with verified behavior. Never claim a check passed unless it ran successfully.

CuratoCV is developed to production engineering standards. For every software task, apply the planning, architecture, security, quality, and operations workflow in [the Production Engineering Standard](docs/engineering/PRODUCTION_ENGINEERING_STANDARD.md). For substantial changes, first state the intended behavior, constraints, acceptance criteria, risks, and verification plan; then implement the smallest complete solution. Do not skip threat modeling for authentication, authorization, payments, uploads, personal data, or AI/tool execution.

After implementing a feature or a meaningful engineering change, create or update its dedicated learning note under the root [`engineering-notes/`](engineering-notes/README.md) folder only for independently teachable, conceptually substantial topics (systemic architecture patterns, security boundaries, data flows, performance trade-offs, authorization models, or state-management design). Keep one Markdown file per independently teachable concept or feature; do not combine unrelated concepts in an omnibus document. A cohesive family of principles (for example, the five SOLID principles) may share one file with a separate section for each principle. For each concept, explain in this order: **What → Why → Internal working → actual CuratoCV flow → code/layers → failure modes and trade-offs → interview follow-ups**. Teach the general concept from fundamentals first, then explain CuratoCV's implementation in a clearly separate section: trace actual files, imports/calls, data or control flow, errors, and tests. Label hypothetical teaching examples as hypothetical; never imply they exist in CuratoCV without source evidence. Link the note in the final report.

**Do NOT create a note for trivial formatting, cosmetic, or purely visual tweaks** (color adjustments, gradient refinements, shadow adjustments, spacing changes, icon swaps, minor responsive tweaks, or pure CSS style revisions). Do NOT create notes that duplicate existing notes (e.g., micro-notes that repeat a larger architecture note's content). Only write notes that add real conceptual value — a new security model, a new persistence or authorization pattern, a new API contract, a significant UI interaction architecture (e.g., physical paper-stack hover with GPU-compositor reasoning), or a verified failure-mode fix. Before writing, confirm no existing note already covers the concept; if a micro-change is cosmetic, skip it entirely and do not reference it in `engineering-notes/`.

## Repository Architecture and Ownership

CuratoCV is a pnpm/Turborepo monorepo:

- `frontend/` is the Vite application shell. It owns bootstrap, routing, global providers, navigation, and truly global state.
- `backend/` is a workspace package and the API composition root. It owns startup, global middleware, infrastructure setup, domain route mounting, lifecycle orchestration, and shutdown.
- `platform/` owns authentication, identity, billing, entitlements, shared infrastructure, and common UI/services.
- `resumebuilder/` owns resume state, persistence, editor, APIs, AI, PDF generation, and resume business rules.
- `memo/` owns Memo UI and backend behavior. The current frontend lists/previews documents and supports persistent nested folders; editing, autosave, and drawing remain future work.
- `packages/` contains generic shared packages such as `api-client` and `shared-utils`.

The Platform, Resume Builder, and Memo frontend directories are source packages consumed by the root Vite app, not standalone apps. Keep domain logic in its owning workspace. The root shell and backend compose products; they must not duplicate product behavior.

### Responsive UI Standard

Every new or changed user-facing interface must adapt on phone, tablet, and desktop. Responsiveness includes more than width: account for viewport height and landscape layouts, fluid type and spacing, content density, touch targets, keyboard access, and what navigation/actions should collapse or move at each breakpoint. Hide secondary content only when the primary task remains clear and reachable. CuratoCV's logo and wordmark must use the shared Platform `BrandLockup` so their assets, colors, proportions, and texture stay identical throughout all products. Use shared brand tokens and action variants; retain distinct semantic colors for destructive and success states. For each UI feature, verify the relevant responsive states in tests or a browser/runtime check and report the viewports/checks performed.

## Dependency Rules

Allowed: Product → Platform and Product → Shared. Platform and shared packages must remain product-agnostic. Product-to-product dependencies are forbidden. Declare workspace dependencies and use package exports for cross-package imports; avoid undeclared dependencies and deep filesystem imports when a public export exists. The backend composition root may import domain packages to mount routes and register lifecycle hooks.

## API and Behavior Compatibility

Preserve existing request/response contracts, auth behavior, status codes, and data semantics unless a task explicitly requires a reviewed change. Memo remains the canonical product name, while `/api/notes` is the existing backend contract. Preserve the implemented `/notes` and `/products/notes` redirects. Do not rename these routes for naming consistency. Avoid database/schema/index changes without a compatibility and migration plan.

## Implementation Workflow

Before editing, inspect the target, its consumers, package exports/dependencies, runtime entrypoints, tests, and applicable architecture docs. Identify the canonical owner and make the smallest behavior-preserving change. Search before adding similar functionality. Before deleting, check static and dynamic imports, exports, tests, scripts, configuration, runtime registration, compatibility, and documentation references. Preserve unrelated user changes; never use `git reset --hard`, `git clean -fd`, `git restore .`, or equivalent destructive commands.

Treat auth, authorization, uploads, secrets, and user data as security-sensitive. Validate untrusted input and enforce ownership server-side. Never expose credentials or commit real environment files/secrets. Do not weaken tests to get a green result.

### Required Feature Testing

Every code feature must have relevant automated tests, and those tests must be run before the feature is reported complete. Cover the main user outcome plus important validation, loading/error, authorization, and responsive behavior where applicable. Do not silently skip tests or replace them with build success. If the current harness cannot test the feature, add the smallest maintainable test setup or report the blocking reason; do not claim completion while required verification is unrun.

For technology choices, prefer the simplest maintained option that fits existing boundaries and operational capability. For a new framework, service, or security-sensitive dependency, verify current official documentation, support status, compatibility, licensing, and security advisories before recommending it. “Best” means best fit supported by evidence, not newest by default.

For AI features, treat prompts, uploaded documents, retrieved content, and model output as untrusted. Enforce permissions and policy on the server, constrain tools to least privilege and explicit allowlists, validate arguments and structured output, minimize sensitive data sent to providers, and test prompt-injection and abuse cases. A system prompt is not an authorization boundary.

## Build and Test Commands

Run from the repository root:

- `pnpm install` — install the declared workspace graph; do not update dependencies without need.
- `pnpm build` — run the Turbo build graph, including the root frontend build.
- `pnpm test` — run backend tests through `backend/vitest.config.js` and its setup files.
- `pnpm test:all` — run configured workspace test tasks, including frontend UI tests under `frontend/src`.
- `pnpm --filter frontend lint` — lint the root application shell.

Domain frontend workspaces are source packages and do not provide independent app scripts. Backend runtime startup (`pnpm --filter backend start`) connects to the configured MongoDB before listening; use an appropriate isolated environment for runtime checks.

Classify failures accurately as code, regression, test, configuration, dependency, infrastructure/environment, or external-service failures. Report exact commands and outcomes; distinguish tests that ran from suites with no tests.

## Production Engineering Standard

The task workflow and release gates are in [`docs/engineering/PRODUCTION_ENGINEERING_STANDARD.md`](docs/engineering/PRODUCTION_ENGINEERING_STANDARD.md). Apply it on every CuratoCV software task. Scale the depth of planning and testing to risk, but never omit ownership, authorization, data-handling, failure-mode, and verification checks where relevant. Do not promise that a system is unhackable; use layered controls, minimize exposure, monitor failures, and maintain tested recovery paths.

## Documentation and Completion

Keep `README.md`, `docs/architecture/CODEBASE_MAP.md`, and relevant ADRs consistent with verified ownership and boundaries. Do not call the repository production-ready or migration-certified based on documentation alone. Before reporting completion, review `git status` and the diff for accidental, generated, secret, or unrelated changes, and summarize verification evidence and remaining limitations.

For feature work, also finish the corresponding `engineering-notes/` document before calling implementation complete. The final response must link it and briefly state what it teaches. Keep architecture/reference documentation (what the system is) separate from learning notes (how and why it works, layer by layer).
