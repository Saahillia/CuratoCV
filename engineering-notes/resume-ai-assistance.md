# Resume Builder AI Assistance

## 1. What an AI-Assisted Feature Is

An AI-assisted feature sends selected user-provided content to a model provider and uses its response to help with a task. The model is a probabilistic text generator, not an authorization or policy engine. The server must decide who may use it, what data can be sent, what tools/actions are allowed, and how output is validated before use.

## 2. Why Server-Side Controls Matter

Putting provider secrets or credit enforcement in browser code would let users inspect or bypass them. CuratoCV routes AI requests through the backend, where authentication, input normalization, entitlement checks, per-operation credit cost, provider errors, and response shaping can be applied.

## 3. General Internal Request Flow

```text
User content → authenticated route → bounded/normalized input
     → entitlement & quota check → model provider request
     → provider response parse/validate → successful credit consumption
     → safe API response → UI
```

Timeouts, provider rate limits, malformed responses, and unexpected content must be treated as normal failure cases. Model output remains untrusted: validate structure and safely render it; never let it decide permissions.

## 4. CuratoCV Implementation (Verified)

`backend/server.js` mounts Resume Builder AI routes under `/api/ai`. [`aiRoutes.js`](../resumebuilder/backend/src/routes/aiRoutes.js) applies Platform auth to professional-summary enhancement, job-description enhancement, resume upload, and entry tips. [`aiControllers.js`](../resumebuilder/backend/src/controllers/aiControllers.js) normalizes and bounds resume text/fields, constructs prompts for text operations, handles upload extraction, and maps service failures to API responses.

[`aiService.js`](../resumebuilder/backend/src/services/aiService.js) checks the user's AI entitlement through Platform billing before model work. It computes operation credit cost, calls the provider adapter, handles provider/rate-limit errors, and consumes credits through billing after successful generation. [`aiProvider.js`](../resumebuilder/backend/src/services/aiProvider.js) is the provider-facing boundary; configuration is in `resumebuilder/backend/src/configs/ai.js`. The frontend calls these APIs through Resume Builder's `aiService.js` and the shared API client.

Resume upload additionally checks resume entitlement/limits, extracts or normalizes returned resume data, and returns structured data for user review/edit. It does not make the model an authority for account permissions.

## 5. Security, Failure, and Trade-offs

- Authentication is required at the route; billing entitlement and credit checks happen server-side.
- Inputs and resume fields are bounded/normalized, but prompts and uploaded content are still untrusted. Prompt instructions alone are not a security boundary.
- Provider rate limits and failures are mapped to safe responses; provider secrets belong only in server configuration.
- Credits are consumed after successful output in the service flow, but concurrent requests and exact atomic guarantees must be understood from billing's persistence implementation and tests before claiming stronger guarantees.
- Sending resume text to an external provider has privacy implications. The source proves a provider call, not the provider's retention/training policy or deployment settings.
- Output should be reviewed by the user. AI-generated resume claims can be inaccurate; the system must not silently invent personal facts.

## 6. How to Verify

Relevant tests include `backend/Tests/aiCredits.test.js`, `aiUploadResume.test.js`, and resume entitlement tests. Inspect test mocks under `backend/Tests/__mocks__/openai.js`. The root backend test command loads the backend Vitest configuration.

## 7. Interview Explanation

“Resume AI requests enter authenticated backend routes. Controllers bound and normalize input, then the AI service checks Platform-owned entitlement and credit balance before calling the provider adapter. The response is parsed and mapped to a bounded API result; credits are consumed on successful generation. The model is not trusted for authorization, provider secrets stay server-side, and rate limits/provider errors are handled as failures. Uploaded resume content remains untrusted input, and generated content needs user review.”

Follow-ups: Why not call the provider from React? When are credits consumed? What happens if the provider times out? Can a prompt enforce authorization? What personal data leaves our system? How do we test malformed model output?

## 8. Sources and Limits

Verified paths: `backend/server.js`, `resumebuilder/backend/src/routes/aiRoutes.js`, `controllers/aiControllers.js`, `services/aiService.js`, `services/aiProvider.js`, `configs/ai.js`, `platform/backend/src/services/billingService.js`, and frontend `resumebuilder/frontend/src/services/aiService.js`. This note does not claim prompt-injection resistance, provider privacy certification, or production model evaluation coverage beyond inspected tests.
