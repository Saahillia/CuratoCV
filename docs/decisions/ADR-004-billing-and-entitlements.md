# ADR 004: Centralized Billing & Entitlements

## Status
Accepted

## Context
Payment processing (Razorpay), subscription plans, and AI credit limits were previously coupled to resume generation logic. As new products (such as Notes) are onboarded, billing must be product-agnostic.

## Decision
Billing mechanisms, subscription lifecycle management, payment webhooks, and AI credit ledger logic are centralized in `@curatocv/platform-backend` (`billingService.js`, `paymentService.js`). Products request entitlement checks via service interfaces.

## Consequences
- Single subscription and payment gateway integration.
- Unified AI credit consumption system across all products.
- Product domains remain free of payment provider SDK dependencies.
