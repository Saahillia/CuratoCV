# CuratoCV Production Engineering Standard

**Applies to:** all CuratoCV product, platform, shared-package, infrastructure, and documentation work that affects software behavior.

CuratoCV is built for production use. Favor secure, maintainable, testable, observable, and operable solutions. No design can guarantee that a system will never be compromised; the goal is to reduce likelihood and impact, detect abuse, and recover safely. These standards supplement the repository architecture and existing API/data compatibility rules.

## 1. Plan Before Implementation

For substantive work, establish:

1. User problem, intended outcome, non-goals, and measurable acceptance criteria.
2. Existing behavior, canonical owner, consumers, public contracts, data touched, and runtime entrypoints.
3. Dependencies and boundary effects, including whether a new dependency is necessary.
4. Threats, abuse cases, privacy implications, failure modes, and operational impact.
5. Smallest safe implementation sequence, tests, rollout/rollback approach, and evidence needed to call the work complete.

Ask for missing product decisions when they change user-visible behavior, data semantics, permissions, retention, external-provider use, or material cost. Keep independent work moving while a decision is pending. For low-risk changes, use a proportionate plan; do not turn routine edits into unnecessary process.

## 2. Architecture and Technology Choices

- Preserve canonical ownership and the dependency rules in `AGENTS.md` and `docs/architecture/CODEBASE_MAP.md`.
- Prefer existing maintained libraries and public workspace exports. Avoid parallel implementations, hidden cross-domain imports, and infrastructure without a defined owner.
- Select technology by fit, maintenance/support status, compatibility, security record, licensing, performance, accessibility, and operational cost—not popularity or recency alone.
- Before adopting or upgrading a significant dependency, verify current official documentation and relevant security advisories. Record consequential architectural choices as an ADR.
- Keep configuration environment-specific, validated, and separate from source. Never commit real credentials or private configuration.

## 3. Security and Privacy Baseline

For each applicable change, assess the trust boundaries and data flows. Consider authentication, authorization, tenant isolation, input abuse, sensitive data exposure, dependency compromise, and denial of service.

- Enforce authorization on the server for every protected operation and resource. Derive ownership from verified identity, never trust client-supplied owner IDs, and prevent IDOR/cross-user access.
- Validate path, query, headers, and body with explicit schemas and size/range limits. Use allowlisted fields, safe database operations, output encoding, and context-appropriate escaping. Return safe errors without stack traces, credentials, or internals.
- Use least privilege for application identities, database users, cloud roles, and service credentials. Keep secrets in approved secret/config management; rotate exposed credentials and never print them in logs.
- Apply appropriate rate limits, abuse controls, secure session/token handling, password hashing, and account recovery protections. For cookie-based auth, assess CSRF and use secure cookie attributes. Avoid storing sensitive tokens in browser storage unless the existing threat model explicitly accepts that design.
- Configure security headers deliberately: HTTPS/HSTS in deployed environments, a restrictive Content Security Policy where compatible, frame protection, MIME sniffing protection, and suitable referrer/permissions policies. Restrict CORS to known origins; CORS is not authorization.
- Treat uploads as hostile: enforce byte and type limits, verify content rather than trusting filenames or declared MIME, generate storage names, isolate storage, check access, and scan/process safely where the threat model requires it.
- Minimize collection, logs, provider sharing, and retention of personal data. Define deletion/export implications and avoid sensitive payloads in logs, analytics, crash reports, and prompts.
- For high-risk changes, include negative tests for unauthorized, malformed, oversized, cross-tenant, replayed, and rate-limited requests as applicable.

## 4. AI and Model-Connected Features

Treat user prompts, uploaded files, retrieved documents, tool results, and model responses as untrusted input. Prompt instructions do not grant authority.

- Keep authorization, entitlements, data access, and policy enforcement in trusted server code. Never let a model decide whether a user may access a resource or perform a privileged action.
- Give tools the minimum capability required. Use explicit tool allowlists, strict argument schemas, per-user authorization at execution time, timeouts, quotas, and audit events that avoid sensitive content.
- Require explicit user confirmation for consequential or irreversible actions. Do not let generated text trigger payments, deletion, external messaging, or privileged mutations without deterministic validation and authorization.
- Validate structured output against schemas; safely render text to prevent XSS and injection. Handle refusal, malformed output, provider errors, timeouts, retries, and fallback without leaking prompts or secrets.
- Minimize data sent to providers, document retention/training settings and regional constraints when relevant, and provide appropriate user disclosure. Never place provider keys in frontend code.
- Test prompt injection in direct input and retrieved/uploaded content, tool escalation attempts, data exfiltration attempts, unsafe output rendering, and cost/usage abuse. Keep versioned evaluations for critical behavior and monitor quality, safety, latency, and spend.

## 5. API, Data, and Compatibility

- Define route ownership, auth requirements, validation, response/error shapes, pagination/limits, idempotency, timeouts, and version/compatibility expectations before implementation.
- Keep existing routes and contracts stable unless a migration is explicitly planned. Update all known consumers and meaningful contract tests when a change is approved.
- Make retryable operations idempotent where practical. Use optimistic concurrency or transactions where required by the data model; do not assume client-side sequencing prevents races.
- Treat schema/index/retention changes as migrations: inspect current production assumptions, use backward-compatible expand/migrate/contract steps where possible, plan backups and rollback, and verify old and new code overlap safely. Never run destructive operations against production casually.
- Establish data classification, retention, backup, restore, and deletion expectations for new sensitive data. Test restore procedures for critical data paths.

## 6. Code Quality and Verification

Use layered verification appropriate to the change:

- Unit tests for deterministic logic and validation.
- Integration/API tests for persistence, authorization, contracts, and failure handling.
- Security tests for trust boundaries and abuse cases.
- Frontend tests for critical interactions, accessibility, loading/error/empty states, and safe rendering.
- Build, lint, typecheck, dependency/license/security checks when configured and relevant.
- Runtime smoke checks for startup, health/readiness, route registration, external service failure, and graceful shutdown when feasible.

Keep modules cohesive and interfaces explicit. Apply SOLID, DRY, and KISS as practical design guides, not reasons to introduce abstractions without a real use case. Prefer readable code, consistent error handling, narrow types/contracts, and reviewable changes. For user-facing work, include semantic markup, keyboard operation, visible focus, accessible names/errors, and adequate contrast; target WCAG AA where applicable. Measure performance on critical paths and avoid unbounded queries, payloads, concurrency, or background work.

Do not weaken assertions, hide skipped tests, or claim an empty suite as coverage. Classify each failure and report exact commands, counts, skipped tests, and environmental limits. Review the final diff and Git status; do not leave generated artifacts, secrets, debug output, or unrelated changes.

## 7. Operations and Release Readiness

- Validate required configuration at startup and fail clearly without exposing secrets. Separate development, test, staging, and production settings.
- Use structured, useful logs and appropriate metrics/traces. Exclude secrets and unnecessary personal data; define alerts for user-impacting errors, saturation, abuse, and provider failures.
- Provide liveness/readiness semantics that reflect actual dependencies. Use timeouts, bounded retries, backoff, graceful shutdown, and resource limits to prevent cascading failures.
- CI should install reproducibly from the lockfile and run relevant validation, security checks, tests, and builds. Production artifacts should be traceable to a commit and built with least privilege.
- Roll out risky changes gradually where infrastructure permits. Define rollback/disable paths, migrations compatibility, backup/restore expectations, and post-deploy health checks before release.
- Document operational ownership, required configuration, known limitations, and recovery steps for new services or critical flows.

## 8. Definition of Done

A change is done only when acceptance criteria are met; ownership and contracts are correct; relevant security, privacy, and failure cases are handled; verification ran and its results are reported; documentation and operational needs are updated; and the final diff contains only intended changes. For each feature or meaningful engineering change, create or update one dedicated fundamentals-first learning note in root `engineering-notes/` and link it in the completion report. Mark unverified items explicitly. Separate migration work, defects, security improvements, technical debt, and product features rather than silently expanding scope.
