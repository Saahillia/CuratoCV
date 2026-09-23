// ============================================================
// CuratoCV Subscription Service
// ============================================================
//
// Wraps the subscription / entitlement API endpoints.
//
// Responsibilities:
// - getEntitlements
// - getResumeEntitlement
// - getAIEntitlement
//
// SECURITY NOTES
// ------------------------------------------------------------
// - These endpoints return the backend's authoritative view of
//   the user's plan, limits, and credits. The frontend may use
//   them for UI hints (e.g. "You have 2 resumes left"), but the
//   backend independently enforces every limit on each action.
// - The frontend MUST NOT derive pricing, plan access, or
//   feature permissions from anything other than these backend
//   responses. Never trust client state for authorization.
// - Public plan/pricing info is also available from the backend
//   ("/subscriptions/plans") but is informational only.
// ============================================================

import api from "./api";

// ============================================================
// Public methods
// ============================================================

/**
 * Get the user's full effective entitlements.
 * Primary source of truth for UI entitlement decisions.
 * @returns {Promise<Object>} entitlements from backend
 */
async function getEntitlements() {
    const response = await api.get("/subscriptions/entitlements");
    return response.data;
}

/**
 * Get the user's plan-level resume limit/entitlement.
 * Actual resume creation is enforced by the backend.
 * @returns {Promise<Object>} resume entitlement from backend
 */
async function getResumeEntitlement() {
    const response = await api.get("/subscriptions/entitlements/resumes");
    return response.data;
}

/**
 * Get the user's current AI entitlement (credits/usage).
 * Actual AI credit consumption is enforced by the backend.
 * @returns {Promise<Object>} AI entitlement from backend
 */
async function getAIEntitlement() {
    const response = await api.get("/subscriptions/entitlements/ai");
    return response.data;
}

const subscriptionService = {
    getEntitlements,
    getResumeEntitlement,
    getAIEntitlement,
};

export default subscriptionService;
