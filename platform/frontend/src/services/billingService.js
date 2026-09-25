// ============================================================
// CuratoCV Billing & Subscription Service
// ============================================================
//
// Wraps all subscription and payment-related API endpoints.
// Point of truth for plans, payments, and client-facing entitlements.
//
// ============================================================

import api from "@curatocv/api-client";

// ============================================================
// Subscription / Plan Endpoints
// ============================================================

/**
 * Get all available dynamic subscription plans.
 * @returns {Promise<Object>} public plans list
 */
export const getPlans = async () => {
    const response = await api.get("/subscriptions/plans");
    return response.data;
};

/**
 * Get accurate billing option detail for a plan and billing period.
 * @param {string} planId
 * @param {string} billingPeriod (monthly / annual etc.)
 * @returns {Promise<Object>} authoritative pricing options
 */
export const getBillingOption = async (planId, billingPeriod) => {
    const response = await api.get(`/subscriptions/plans/${planId}/${billingPeriod}`);
    return response.data;
};

/**
 * Get the current subscription (active or not) for authenticate user.
 * @returns {Promise<Object>} user subscription details
 */
export const getCurrentSubscription = async () => {
    const response = await api.get("/subscriptions/current");
    return response.data;
};

/**
 * Get the active subscription for the user.
 * @returns {Promise<Object>} active subscription details
 */
export const getActiveSubscription = async () => {
    const response = await api.get("/subscriptions/active");
    return response.data;
};

/**
 * Get consolidated details on user feature limits, expiration, etc.
 * @returns {Promise<Object>} user entitlements
 */
export const getEntitlements = async () => {
    const response = await api.get("/subscriptions/entitlements");
    return response.data;
};

/**
 * Get user's plan-level limit on maximum allowed resume count.
 * @returns {Promise<Object>} resume entitlement
 */
export const getResumeEntitlement = async () => {
    const response = await api.get("/subscriptions/entitlements/resumes");
    return response.data;
};

/**
 * Get remaining AI credits and constraints.
 * @returns {Promise<Object>} AI entitlement details
 */
export const getAIEntitlement = async () => {
    const response = await api.get("/subscriptions/entitlements/ai");
    return response.data;
};

/**
 * Cancel the current active subscription at the end of its billing period.
 * @returns {Promise<Object>} updated subscription state
 */
export const cancelSubscription = async () => {
    const response = await api.post("/subscriptions/cancel");
    return response.data;
};

// ============================================================
// Payment / Checkout Endpoints
// ============================================================

/**
 * Create a Razorpay Order ID for checkout.
 * @param {Object} payload { planId, billingPeriod }
 * @returns {Promise<Object>} payment order payload (id, amount, currency)
 */
export const createOrder = async ({ planId, billingPeriod }) => {
    const response = await api.post("/payments/orders", { planId, billingPeriod });
    return response.data;
};

/**
 * Submit Razorpay checkout parameters for Server-side verification and activation.
 * @param {Object} paymentDetails { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * @returns {Promise<Object>} success confirmation and activated subscription
 */
export const verifyCheckoutPayment = async (paymentDetails) => {
    const response = await api.post("/payments/verify", paymentDetails);
    return response.data;
};

/**
 * Get all payment operations history for the user.
 * @returns {Promise<Object>} payment history list
 */
export const getPaymentHistory = async () => {
    const response = await api.get("/payments");
    return response.data;
};

/**
 * Get a single specific payment detail.
 * @param {string} paymentId
 * @returns {Promise<Object>} payment details
 */
export const getPayment = async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
};

const billingService = {
    getPlans,
    getBillingOption,
    getCurrentSubscription,
    getActiveSubscription,
    getEntitlements,
    getResumeEntitlement,
    getAIEntitlement,
    cancelSubscription,
    createOrder,
    verifyCheckoutPayment,
    getPaymentHistory,
    getPayment,
};

export default billingService;
