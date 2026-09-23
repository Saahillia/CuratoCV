// ============================================================
// CuratoCV Payment Service
// ============================================================
//
// Wraps the payment API endpoints. Used by the Razorpay
// checkout flow and payment history UI.
//
// Responsibilities:
// - createOrder (ask backend for an authoritative order)
// - verifyPayment (hand the Razorpay result back for verification)
// - getPaymentHistory
// - getPayment
//
// SECURITY NOTES
// ------------------------------------------------------------
// - createOrder only sends planKey + billingPeriod. The backend
//   determines the AUTHORITATIVE price and amount. The frontend
//   never computes or trusts a price locally.
// - verifyPayment sends the Razorpay order/payment/signature
//   ids. The backend verifies the HMAC signature and the payment
//   amount. The frontend must NOT treat a "payment succeeded"
//   UI state as authoritative — only a successful verify
//   response from the backend confirms the purchase.
// - The Razorpay secret is NEVER used here. Only VITE_RAZORPAY_
//   KEY_ID (public key) is used, and only by the checkout UI
//   component, not this service.
// - Razorpay webhook handling is server-side only.
// ============================================================

import api from "./api";

// ============================================================
// Public methods
// ============================================================

/**
 * Create a Razorpay order for the given plan and billing period.
 * The backend returns the authoritative order (with amount,
 * currency, order id) — do NOT construct the amount client-side.
 *
 * @param {Object} payload
 * @param {string} payload.planKey      e.g. "pro", "basic"
 * @param {string} payload.billingPeriod e.g. "monthly", "yearly"
 * @returns {Promise<Object>} Razorpay order object from backend
 */
async function createOrder({ planKey, billingPeriod }) {
    const response = await api.post("/payments/orders", {
        planKey,
        billingPeriod,
    });
    return response.data;
}

/**
 * Verify a completed Razorpay checkout with the backend.
 * The backend verifies the signature and payment/order
 * relationship and returns entitlement/subscription results.
 *
 * @param {Object} payload
 * @param {string} payload.razorpay_order_id
 * @param {string} payload.razorpay_payment_id
 * @param {string} payload.razorpay_signature
 * @returns {Promise<Object>} verification result from backend
 */
async function verifyPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
}) {
    const response = await api.post("/payments/verify", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    });
    return response.data;
}

/**
 * Fetch the authenticated user's payment history.
 * @returns {Promise<Array>} list of payments from backend
 */
async function getPaymentHistory() {
    const response = await api.get("/payments");
    return response.data;
}

/**
 * Fetch a single payment by id (ownership enforced server-side).
 * @param {string} paymentId
 * @returns {Promise<Object>} payment record from backend
 */
async function getPayment(paymentId) {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
}

const paymentService = {
    createOrder,
    verifyPayment,
    getPaymentHistory,
    getPayment,
};

export default paymentService;
