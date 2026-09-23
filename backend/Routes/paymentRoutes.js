// ============================================================
// CuratoCV Payment Routes
// ============================================================
//
// Payment-related HTTP endpoints.
//
// Responsibilities:
// - Define payment API endpoints
// - Apply authentication where required
// - Preserve raw Razorpay webhook payloads
// - Apply webhook signature verification
// - Delegate request handling to paymentController
//
// NOT responsible for:
// - Payment business logic
// - Razorpay API calls
// - Pricing
// - Subscription activation
// - Database access
//
// ============================================================

import express from "express";

import paymentController from "../../platform/backend/src/controllers/paymentController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";
import razorpayWebhookMiddleware from "../Middlewares/razorpayWebhookMiddleware.js";

// ============================================================
// Router
// ============================================================

const router =
    express.Router();

// ============================================================
// Payment Order
// ============================================================
//
// POST /api/payments/orders
//
// Authentication required.
//
// Frontend provides:
//
//     planId
//     billingPeriod
//
// Backend determines the authoritative price.
// ============================================================

router.post(
    "/orders",

    authMiddleware,

    paymentController.createOrder,
);

// ============================================================
// Verify Checkout Payment
// ============================================================
//
// POST /api/payments/verify
//
// Authentication required.
//
// Backend verifies:
// - Razorpay payment ID
// - Razorpay order ID
// - Razorpay signature
// - Payment/order relationship
// - Expected payment amount
//
// ============================================================

router.post(
    "/verify",

    authMiddleware,

    paymentController.verifyCheckoutPayment,
);

// ============================================================
// Razorpay Webhook
// ============================================================
//
// POST /api/payments/webhook
//
// Authentication:
// NOT JWT authentication.
//
// Razorpay authenticates itself through the webhook signature.
//
// IMPORTANT
// ------------------------------------------------------------
// express.raw() MUST execute before the webhook middleware.
//
// This preserves the exact bytes sent by Razorpay so the HMAC
// signature can be verified correctly.
//
// DO NOT replace this with express.json().
// ============================================================

router.post(
    "/webhook",

    express.raw({
        type: "application/json",
        limit: "1mb",
    }),

    razorpayWebhookMiddleware,

    paymentController.handleWebhook,
);

// ============================================================
// Payment History
// ============================================================
//
// GET /api/payments
//
// Authentication required.
//
// Only the authenticated user's payments are returned.
// ============================================================

router.get(
    "/",

    authMiddleware,

    paymentController.getPaymentHistory,
);

// ============================================================
// Single Payment
// ============================================================
//
// GET /api/payments/:paymentId
//
// Authentication required.
//
// Ownership must be enforced by the service/repository layer.
// ============================================================

router.get(
    "/:paymentId",

    authMiddleware,

    paymentController.getPayment,
);

// ============================================================
// Export
// ============================================================

export default router;