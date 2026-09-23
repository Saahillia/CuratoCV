// ============================================================
// CuratoCV Subscription Routes
// ============================================================
//
// HTTP routes for subscription and entitlement operations.
//
// Responsibilities:
// - Define subscription API endpoints
// - Apply authentication where required
// - Delegate requests to subscriptionController
//
// NOT responsible for:
// - Subscription business logic
// - Payment processing
// - Pricing calculations
// - Entitlement calculations
// - MongoDB access
//
// Public:
// - Plan/pricing information
//
// Authenticated:
// - Current subscription
// - Active subscription
// - Entitlements
// - Cancellation
//
// IMPORTANT
// ------------------------------------------------------------
// Frontend subscription information is informational only.
//
// Backend services remain authoritative for:
// - plan access
// - resume limits
// - AI credits
// - feature permissions
// ============================================================

import express from "express";

import subscriptionController from "../../platform/backend/src/controllers/subscriptionController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";

// ============================================================
// Router
// ============================================================

const router =
    express.Router();

// ============================================================
// Public Plan Information
// ============================================================
//
// GET /api/subscriptions/plans
//
// No authentication required.
//
// Used by:
// - Pricing page
// - Plan comparison UI
// - Public marketing pages
//
// The frontend must NEVER be trusted to determine payment
// amounts or entitlements.
// ============================================================

router.get(
    "/plans",

    subscriptionController.getPlans,
);

// ============================================================
// Public Billing Option
// ============================================================
//
// GET /api/subscriptions/plans/:planId/:billingPeriod
//
// Example:
//
// GET /api/subscriptions/plans/pro/monthly
//
// No authentication required.
//
// The backend returns the authoritative billing option.
// ============================================================

router.get(
    "/plans/:planId/:billingPeriod",

    subscriptionController.getBillingOption,
);

// ============================================================
// Current Subscription
// ============================================================
//
// GET /api/subscriptions/current
//
// Authentication required.
//
// Returns the subscription associated with the authenticated
// user.
// ============================================================

router.get(
    "/current",

    authMiddleware,

    subscriptionController.getCurrentSubscription,
);

// ============================================================
// Active Subscription
// ============================================================
//
// GET /api/subscriptions/active
//
// Authentication required.
//
// Returns the currently active subscription, if one exists.
// ============================================================

router.get(
    "/active",

    authMiddleware,

    subscriptionController.getActiveSubscription,
);

// ============================================================
// Effective Entitlements
// ============================================================
//
// GET /api/subscriptions/entitlements
//
// Authentication required.
//
// Primary endpoint for frontend entitlement information.
//
// IMPORTANT:
// The frontend can use this for UI decisions, but backend
// services must independently enforce every entitlement.
// ============================================================

router.get(
    "/entitlements",

    authMiddleware,

    subscriptionController.getEntitlements,
);

// ============================================================
// Resume Entitlement
// ============================================================
//
// GET /api/subscriptions/entitlements/resumes
//
// Authentication required.
//
// Returns the user's plan-level resume limit.
//
// Actual resume creation enforcement belongs to the backend.
// ============================================================

router.get(
    "/entitlements/resumes",

    authMiddleware,

    subscriptionController.getResumeEntitlement,
);

// ============================================================
// AI Entitlement
// ============================================================
//
// GET /api/subscriptions/entitlements/ai
//
// Authentication required.
//
// Returns the user's current AI entitlement information.
//
// Actual AI credit consumption occurs on the backend.
// ============================================================

router.get(
    "/entitlements/ai",

    authMiddleware,

    subscriptionController.getAIEntitlement,
);

// ============================================================
// Cancel Current Subscription
// ============================================================
//
// POST /api/subscriptions/cancel
//
// Authentication required.
//
// Cancels the authenticated user's current subscription at
// the end of the current billing period.
//
// This preserves already-paid access.
// ============================================================

router.post(
    "/cancel",

    authMiddleware,

    subscriptionController.cancelSubscription,
);

// ============================================================
// Export
// ============================================================

export default router;