# AI Guardrails and Trust Boundaries

## What “Guardrails” Means

AI guardrails are deterministic controls around a probabilistic model: authorization, bounded inputs, tool permissions, output validation, quotas, human confirmation, and monitoring. A prompt telling the model to behave safely is not an enforceable security boundary. Model input and output can be adversarial or incorrect.

## Why They Matter

User documents and prompts can contain instruction-like text. A model can produce unsafe markup, false facts, malformed JSON, or costly repeated requests. The application must retain authority over data access, billing, external actions, and what is rendered or saved.

## General Control Flow

```text
Authenticate user → authorize requested operation
 → minimize and bound data → call provider with least capability
 → handle timeout/refusal/malformed response
 → validate output and safely render/review
 → apply quotas/audit/monitoring
```

If tools are used, expose only explicitly allowed tools with strict schemas and per-call authorization. Consequential actions require deterministic policy and, where appropriate, user confirmation. Prompt injection defenses reduce risk but do not replace access controls.

## CuratoCV: Verified Controls and Gaps

The AI routes require Platform authentication. Resume Builder's AI controller normalizes and bounds input data; its service checks Platform-owned AI entitlement/credits before provider calls, maps provider errors, and reports consumption. This makes backend code—not model output—the authority for basic access and quotas.

The inspected AI feature is text generation/extraction rather than an agent with privileged tools. The reviewed sources do not prove a comprehensive prompt-injection evaluation suite, provider data-retention terms, content moderation guarantees, or an output review workflow for every generated value. These are not to be claimed as implemented without additional code/test/deployment evidence.

Uploaded resume text is still untrusted. Generated resume details may be inaccurate and should remain reviewable by the user. Any frontend rendering must avoid interpreting model text as executable HTML.

## Failure and Trade-offs

- Provider timeout/rate limit/outage should fail with a safe response; don't endlessly retry or charge for unsuccessful work without an explicit policy.
- Input bounds protect cost and availability but may truncate useful content.
- Output validation catches schema/size problems but cannot prove factual correctness.
- Sending resumes to an external provider is a privacy decision: minimize data, protect credentials server-side, and document provider retention/configuration.
- Quotas are useful abuse controls; concurrent quota checks require atomic backend enforcement if overspend must be impossible.

## Interview Explanation

“AI guardrails are controls in trusted application code around the model, not just prompt wording. CuratoCV authenticates AI routes, bounds/normalizes input, checks Platform-owned entitlements and credits server-side, calls the provider through a backend service, and handles provider failures. The model cannot authorize a user or grant credits. Prompt-injection evaluation, provider retention guarantees, and broader production monitoring are not proven by these source paths, so I would describe them as gaps unless separately verified.”

Follow-ups: Why is a system prompt not authorization? How can a document prompt-inject an AI feature? What if JSON output is malformed? What data leaves the backend? How do concurrent requests affect credit limits? Can output be trusted as fact?

## Sources and Limits

Verified: `resumebuilder/backend/src/routes/aiRoutes.js`, `controllers/aiControllers.js`, `services/aiService.js`, `services/aiProvider.js`, `platform/backend/src/services/billingService.js`, relevant AI tests and provider mocks. Production provider retention configuration and any uninspected cloud controls remain unverified.
