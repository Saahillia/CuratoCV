// ============================================================
// CuratoCV Payment Controller
// ============================================================
//
// HTTP/controller layer for payment operations.
//
// Responsibilities:
// - Receive HTTP requests
// - Read authenticated user identity
// - Pass request data to paymentService
// - Return safe API responses
// - Handle controller-level errors
//
// NOT responsible for:
// - Razorpay API calls
// - Payment verification logic
// - Signature generation/verification
// - Pricing calculations
// - Subscription entitlement decisions
// - MongoDB access
// - Sending emails
//
// Trust boundary:
//     Frontend
//         ↓
//     Controller
//         ↓
//     Payment Service
//         ↓
//     Razorpay / Repository
// ============================================================

import paymentService from "../Services/paymentService.js";

// ============================================================
// Controller Helpers
// ============================================================

/**
 * Extract the authenticated user's ID.
 *
 * Authentication middleware is expected to populate req.user.
 *
 * The controller deliberately does not trust a userId supplied
 * by the frontend request body for ownership-sensitive actions.
 *
 * @param {Object} req
 * @returns {string}
 */
const getAuthenticatedUserId = (req) => {
    const userId = req.user?._id || req.user?.id || req.auth?.userId;

    if (!userId) {
        const error = new Error("Authenticated user is required.");

        error.code = "AUTHENTICATION_REQUIRED";

        error.statusCode = 401;

        throw error;
    }

    return String(userId);
};

/**
 * Normalize an error into a safe HTTP response.
 *
 * Internal implementation details are never exposed to the
 * client.
 *
 * @param {Object} res
 * @param {Error} error
 * @returns {Object}
 */
const sendError = (res, error) => {
    const statusCode = Number.isInteger(error?.statusCode)
        ? error.statusCode
        : resolveStatusCode(error?.code);

    const publicMessage = getPublicErrorMessage(error);

    return res.status(statusCode).json({
        success: false,

        error: {
            code: error?.code || "PAYMENT_ERROR",

            message: publicMessage,
        },
    });
};

/**
 * Resolve appropriate HTTP status from an application error.
 *
 * @param {string|undefined} code
 * @returns {number}
 */
const resolveStatusCode = (code) => {
    switch (code) {
        case "AUTHENTICATION_REQUIRED":
            return 401;

        case "INVALID_PLAN":
        case "INVALID_BILLING_OPTION":
        case "FREE_PLAN_PAYMENT_NOT_ALLOWED":
        case "PAYMENT_AMOUNT_MISMATCH":
        case "PAYMENT_CURRENCY_MISMATCH":
        case "PAYMENT_USER_MISMATCH":
        case "INVALID_PAYMENT_SIGNATURE":
        case "INVALID_WEBHOOK_SIGNATURE":
        case "PAYMENT_ORDER_MISMATCH":
        case "PAYMENT_NOT_CAPTURED":
            return 400;

        case "CURRENT_SUBSCRIPTION_EXISTS":
            return 409;

        case "PAYMENT_RECORD_NOT_FOUND":
        case "PAYMENT_NOT_FOUND":
        case "SUBSCRIPTION_NOT_FOUND":
            return 404;

        case "RAZORPAY_NOT_CONFIGURED":
        case "RAZORPAY_SECRET_NOT_CONFIGURED":
        case "RAZORPAY_WEBHOOK_NOT_CONFIGURED":
        case "RAZORPAY_CLIENT_NOT_CONFIGURED":
            return 503;

        default:
            return 500;
    }
};

/**
 * Return a safe client-facing message.
 *
 * Never expose:
 * - stack traces
 * - database errors
 * - Razorpay credentials
 * - internal provider responses
 * - implementation details
 */
const getPublicErrorMessage = (error) => {
    const safeMessages = new Set([
        "Authenticated user is required.",

        "Invalid subscription plan.",

        "Invalid billing option.",

        "The Free plan does not have a paid billing option.",

        "User already has a current subscription.",

        "Payment amount does not match the selected plan.",

        "Payment currency does not match the selected plan.",

        "Payment does not belong to this user.",

        "Invalid payment signature.",

        "Payment has not been captured.",

        "Payment not found.",

        "Payment record was not found.",

        "Subscription not found.",
    ]);

    if (safeMessages.has(error?.message)) {
        return error.message;
    }

    return "Unable to process the payment request.";
};

// ============================================================
// Create Payment Order
// ============================================================
//
// POST /api/payments/orders
//
// Expected body:
//
// {
//     "planId": "pro",
//     "billingPeriod": "monthly"
// }
//
// IMPORTANT:
// The frontend does NOT send:
// - amount
// - currency
// - Razorpay key secret
// - subscription status
//
// The backend resolves the authoritative price from plans.js.
// ============================================================

/**
 * Create a Razorpay order.
 */
const createOrder = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const planId = req.body?.planId || req.body?.planKey;
        const billingPeriod = req.body?.billingPeriod;

        const result = await paymentService.createOrder({
            userId,

            planId,

            billingPeriod,
        });

        return res.status(201).json({
            success: true,

            data: {
                paymentId: result.paymentId,

                subscriptionId: result.subscriptionId,

                provider: result.provider,

                providerOrderId: result.providerOrderId,

                keyId: result.keyId,

                amount: result.amount,

                amountMinor: result.amountMinor,

                currency: result.currency,

                planId: result.planId,

                billingPeriod: result.billingPeriod,

                durationMonths: result.durationMonths,
            },
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// ============================================================
// Verify Checkout Payment
// ============================================================
//
// POST /api/payments/verify
//
// Expected body:
//
// {
//     "paymentId": "pay_...",
//     "orderId": "order_...",
//     "signature": "..."
// }
//
// IMPORTANT:
// userId is obtained from authentication middleware.
//
// The frontend cannot choose which user owns the payment.
// ============================================================

/**
 * Verify a completed Razorpay Checkout payment.
 */
const verifyCheckoutPayment = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const paymentId = req.body?.paymentId || req.body?.razorpay_payment_id;
        const orderId = req.body?.orderId || req.body?.razorpay_order_id;
        const signature = req.body?.signature || req.body?.razorpay_signature;

        const result = await paymentService.verifyCheckoutPayment({
            userId,

            paymentId,

            orderId,

            signature,
        });

        return res.status(200).json({
            success: true,

            data: {
                paymentId: result.paymentId,

                subscriptionId: result.subscriptionId,

                status: result.status,

                planId: result.planId,

                billingPeriod: result.billingPeriod,

                currentPeriodStart: result.currentPeriodStart,

                currentPeriodEnd: result.currentPeriodEnd,

                alreadyProcessed: Boolean(result.alreadyProcessed),
            },
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// ============================================================
// Razorpay Webhook
// ============================================================
//
// POST /api/payments/webhook
//
// IMPORTANT:
//
// This endpoint is NOT authenticated using the normal user
// authentication middleware.
//
// Razorpay calls this endpoint directly.
//
// Authentication is performed using the Razorpay webhook
// signature.
//
// The raw request body MUST be preserved by middleware before
// JSON parsing.
//
// Expected middleware:
//
//     req.rawBody
//
// or equivalent raw body storage.
// ============================================================

/**
 * Process a Razorpay webhook.
 */
const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];

        if (typeof signature !== "string" || !signature.trim()) {
            return res.status(400).json({
                success: false,

                error: {
                    code: "WEBHOOK_SIGNATURE_MISSING",

                    message: "Webhook signature is required.",
                },
            });
        }

        // ----------------------------------------------------
        // The webhook middleware must provide the exact raw
        // bytes received from Razorpay.
        //
        // Never reconstruct rawBody using JSON.stringify(req.body)
        // because that can change the signed payload.
        // ----------------------------------------------------

        const rawBody = req.rawBody;

        if (!rawBody) {
            return res.status(400).json({
                success: false,

                error: {
                    code: "WEBHOOK_RAW_BODY_MISSING",

                    message: "Webhook payload could not be verified.",
                },
            });
        }

        const result = await paymentService.processWebhook({
            rawBody,

            signature,
        });

        // ----------------------------------------------------
        // Razorpay only needs an acknowledgement.
        //
        // Do not expose internal payment/subscription details
        // unnecessarily from a provider webhook endpoint.
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,

            received: true,

            processed: Boolean(result.processed),

            ignored: Boolean(result.ignored),
        });
    } catch (error) {
        // ----------------------------------------------------
        // For signature failures we explicitly reject the
        // webhook.
        //
        // For valid-but-unprocessable events we also return
        // an error so provider retries can occur where
        // appropriate.
        // ----------------------------------------------------

        if (error?.code === "INVALID_WEBHOOK_SIGNATURE") {
            return res.status(400).json({
                success: false,

                error: {
                    code: "INVALID_WEBHOOK_SIGNATURE",

                    message: "Invalid webhook signature.",
                },
            });
        }

        console.error("[PaymentWebhook]", {
            code: error?.code,

            message: error?.message,
        });

        return res.status(500).json({
            success: false,

            error: {
                code: "WEBHOOK_PROCESSING_FAILED",

                message: "Webhook processing failed.",
            },
        });
    }
};

// ============================================================
// Get Payment
// ============================================================
//
// GET /api/payments/:paymentId
//
// Only the authenticated owner can retrieve their payment.
// ============================================================

/**
 * Get a user's payment.
 */
const getPayment = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const { paymentId } = req.params;

        const payment = await paymentService.getUserPayment(userId, paymentId);

        return res.status(200).json({
            success: true,

            data: {
                id: payment._id,

                planId: payment.planId,

                billingPeriod: payment.billingPeriod,

                amountMinor: payment.amountMinor,

                currency: payment.currency,

                status: payment.status,

                provider: payment.provider,

                providerOrderId: payment.providerOrderId,

                providerPaymentId: payment.providerPaymentId,

                method: payment.method,

                paidAt: payment.paidAt,

                refundedAmountMinor: payment.refundedAmountMinor,
            },
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// ============================================================
// Payment History
// ============================================================
//
// GET /api/payments
//
// Query:
//
// ?limit=20&skip=0
// ============================================================

/**
 * Get authenticated user's payment history.
 */
const getPaymentHistory = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const rawLimit = req.query?.limit;

        const rawSkip = req.query?.skip;

        const limit = rawLimit === undefined ? 50 : Number(rawLimit);

        const skip = rawSkip === undefined ? 0 : Number(rawSkip);

        const payments = await paymentService.getPaymentHistory(userId, {
            limit,

            skip,
        });

        return res.status(200).json({
            success: true,

            data: {
                payments: payments.map((payment) => ({
                    id: payment._id,

                    planId: payment.planId,

                    billingPeriod: payment.billingPeriod,

                    amountMinor: payment.amountMinor,

                    currency: payment.currency,

                    status: payment.status,

                    provider: payment.provider,

                    providerOrderId: payment.providerOrderId,

                    providerPaymentId: payment.providerPaymentId,

                    method: payment.method,

                    paidAt: payment.paidAt,

                    refundedAmountMinor: payment.refundedAmountMinor,
                })),

                count: payments.length,

                limit,

                skip,
            },
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// ============================================================
// Export
// ============================================================

const paymentController = Object.freeze({
    createOrder,

    verifyCheckoutPayment,

    handleWebhook,

    getPayment,

    getPaymentHistory,
});

export default paymentController;
