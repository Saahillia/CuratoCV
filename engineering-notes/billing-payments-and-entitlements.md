# Billing, Payments, Subscriptions, and Entitlements

## 1. The Core Concepts

A **payment** is a provider transaction. A **subscription** records a customer's plan and time period. An **entitlement** is the capability/limit the application grants based on current account state. These are related but not interchangeable: a browser saying “paid” does not prove payment, and a captured provider payment must be reconciled before access is granted.

## 2. Why the Backend Is Authoritative

The browser is controlled by the user, so it cannot determine prices, payment status, subscription state, resume limits, or AI credits. Platform owns plans, payment verification, subscription lifecycle, and entitlements; product backends request entitlement decisions from Platform.

## 3. General Purchase Flow

```text
Frontend requests plan → backend resolves canonical price
 → provider order + internal pending payment record
 → provider checkout → frontend submits proof
 → backend verifies signature/order/user/amount/currency
 → trusted payment state → subscription/entitlement update
```

Webhooks are a second provider-to-server path. Their signatures must be verified over the exact raw request bytes. Idempotency is required because providers may retry events.

## 4. CuratoCV Order and Verification Flow (Verified)

Platform routes are mounted by `backend/server.js`. `paymentRoutes.js` requires auth for order creation and checkout verification. The controller takes the authenticated user identity, not a user ID trusted from the request body, and calls `paymentService`.

`paymentService.js` resolves plan and billing period from Platform's `plans.js`; amount/currency are authoritative server values. It creates a Razorpay order and internal payment/subscription records through repositories. The client receives the provider order identifiers and public checkout key ID, not provider secrets.

On verify, server-side code checks checkout signature and the payment/order relationship, status, user, amount and currency before invoking billing lifecycle behavior. `billingService.js` calculates subscription periods and activates/renews state. Entitlements are subsequently read by Resume Builder operations such as resume creation and AI use.

## 5. Webhook Flow and Raw-Body Requirement

Root JSON parsing's `verify` callback copies exact webhook bytes to `req.rawBody`. The payment router also installs `express.raw()` and then `razorpayWebhookMiddleware`, which verifies the signature using `req.body` and requires it to be a Buffer. Because the global JSON parser is registered earlier, the combined parser behavior must be confirmed in an integration request: the middleware does not fall back to the saved `req.rawBody`. This is a source-visible integration risk; unit tests of signature calculation alone do not prove the composed webhook path works. `paymentService` processes captured/failed/refund/subscription events with repository-backed state once the middleware accepts them.

## 6. Failure Modes and Trust Boundaries

- Invalid plan or billing period is rejected; a frontend amount is not authoritative.
- Signature, order, user, amount, currency, or captured-status mismatches reject activation.
- Missing provider configuration fails payment operations rather than inventing a success state.
- Webhook retries require idempotent state transitions; tests cover payment integrity and subscription lifecycle behavior.
- The global `express.json()` / route-level `express.raw()` ordering and the middleware's use of `req.body` are a potential webhook parsing defect requiring an integration test or runtime check. This documentation does not claim webhook route success.
- Entitlements must be checked server-side when a protected product action runs, not only when rendering plan UI.
- Provider downtime and webhook delay can leave payment pending; reconciliation/operational monitoring remains important.

## 7. How to Verify

Relevant tests: `backend/Tests/paymentIntegrity.test.js`, `subscriptionLifecycle.test.js`, `resumeEntitlement.test.js`, and `aiCredits.test.js`. Routes and boundary code: `platform/backend/src/routes/paymentRoutes.js`, `subscriptionRoutes.js`, `middlewares/razorpayWebhookMiddleware.js`, `services/paymentService.js`, `services/billingService.js`, `repositories/paymentRepository.js`, and `repositories/subscriptionRepository.js`.

## 8. Interview Explanation

“Platform owns billing and is the source of truth. The client asks to buy a plan, but the backend resolves its price and creates the provider order. After checkout, the server verifies the provider signature plus order, user, amount and currency before recording trusted payment state and activating subscription entitlements. Webhooks are verified against the raw body and processed idempotently. Resume and AI operations check entitlements server-side.”

Follow-ups: Why can't the UI submit the amount? Why preserve raw webhook bytes? How do duplicate webhook deliveries behave? When are entitlements applied? What happens if the provider succeeds but our callback is lost?

## 9. Sources and Limits

Source paths listed above were inspected alongside `backend/server.js` and product `aiService.js`/`resumeController.js`. This note explains code paths and test intent; provider dashboard configuration, production webhook delivery and reconciliation operations require separate deployment evidence.
