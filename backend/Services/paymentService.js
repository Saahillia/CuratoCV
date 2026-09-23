import crypto from "node:crypto";

import razorpay from "../Configs/razorpay.js";

import plans from "../Constants/plans.js";

import paymentRepository from "../Repositories/paymentRepository.js";
import subscriptionRepository from "../Repositories/subscriptionRepository.js";

import billingService from "./billingService.js";
import emailService from "./emailService.js";
import userRepository from "../Repositories/userRepository.js";

// ============================================================
// CuratoCV Payment Service
// ============================================================
//
// Responsibilities:
// - Create Razorpay orders
// - Validate server-side plan/pricing information
// - Create internal payment records
// - Verify Razorpay checkout signatures
// - Verify payment/order relationships
// - Capture trusted payment state
// - Process verified webhook events
// - Maintain payment idempotency
// - Activate/renew subscriptions after trusted payment events
// - Handle refunds
//
// NOT responsible for:
// - HTTP req/res
// - Authentication
// - Authorization middleware
// - Frontend state
// - Rendering checkout UI
// - Email delivery
// - Direct MongoDB queries
//
// IMPORTANT TRUST BOUNDARY
// ------------------------------------------------------------
// The frontend may REQUEST a plan.
//
// The frontend may NEVER decide:
// - price
// - currency
// - subscription status
// - payment status
// - entitlement
// - AI credits
//
// Those values are resolved/verified on the backend.
// ============================================================

// ============================================================
// Environment
// ============================================================

const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();

const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

// ============================================================
// Provider Constants
// ============================================================

const PAYMENT_PROVIDER = "razorpay";

const PAYMENT_STATUSES = Object.freeze({
    CREATED: "created",
    PENDING: "pending",
    CAPTURED: "captured",
    FAILED: "failed",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded",
});

const WEBHOOK_EVENTS = Object.freeze({
    PAYMENT_CAPTURED: "payment.captured",

    PAYMENT_FAILED: "payment.failed",

    PAYMENT_REFUNDED: "refund.processed",

    SUBSCRIPTION_ACTIVATED: "subscription.activated",

    SUBSCRIPTION_CHARGED: "subscription.charged",

    SUBSCRIPTION_CANCELLED: "subscription.cancelled",

    SUBSCRIPTION_COMPLETED: "subscription.completed",
});

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Require a non-empty string.
 *
 * @param {*} value
 * @param {string} fieldName
 * @returns {string}
 */
const requireString = (value, fieldName) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new TypeError(`${fieldName} must be a non-empty string.`);
    }

    return value.trim();
};

const requireId = (id, fieldName) => {
    if (id === undefined || id === null) {
        throw new TypeError(`${fieldName} must be provided.`);
    }
    if (typeof id === "object" && id.toString) {
        id = id.toString();
    }
    return requireString(id, fieldName);
};

/**
 * Require a valid user ID.
 *
 * MongoDB/Mongoose performs the final ObjectId casting.
 *
 * @param {*} userId
 * @returns {string}
 */
const requireUserId = (userId) => {
    return requireId(userId, "User ID");
};

/**
 * Require a positive integer.
 *
 * @param {*} value
 * @param {string} fieldName
 * @returns {number}
 */
const requirePositiveInteger = (value, fieldName) => {
    if (!Number.isInteger(value) || value <= 0) {
        throw new TypeError(`${fieldName} must be a positive integer.`);
    }

    return value;
};

/**
 * Require a non-negative integer.
 *
 * @param {*} value
 * @param {string} fieldName
 * @returns {number}
 */
const requireNonNegativeInteger = (value, fieldName) => {
    if (!Number.isInteger(value) || value < 0) {
        throw new TypeError(`${fieldName} must be a non-negative integer.`);
    }

    return value;
};

/**
 * Create an application error with a stable error code.
 *
 * @param {string} message
 * @param {string} code
 * @returns {Error}
 */
const createError = (message, code) => {
    const error = new Error(message);

    error.code = code;

    return error;
};

// ============================================================
// Razorpay Configuration
// ============================================================

/**
 * Ensure Razorpay credentials are available.
 *
 * Configuration itself should normally be validated during
 * application startup, but this defensive check prevents
 * payment operations from proceeding with an invalid setup.
 */
const ensureRazorpayConfiguration = () => {
    if (!razorpayKeyId) {
        throw createError(
            "RAZORPAY_KEY_ID is not configured.",
            "RAZORPAY_NOT_CONFIGURED",
        );
    }

    if (!razorpayWebhookSecret) {
        throw createError(
            "RAZORPAY_WEBHOOK_SECRET is not configured.",
            "RAZORPAY_WEBHOOK_NOT_CONFIGURED",
        );
    }

    if (!razorpay) {
        throw createError(
            "Razorpay client is not configured.",
            "RAZORPAY_CLIENT_NOT_CONFIGURED",
        );
    }
};

// ============================================================
// Amount Verification
// ============================================================

/**
 * Verify that a provider amount matches the authoritative
 * CuratoCV billing option.
 *
 * Amounts are compared in the smallest currency unit.
 *
 * @param {number} providerAmountMinor
 * @param {number} expectedAmountMinor
 */
const verifyAmount = (providerAmountMinor, expectedAmountMinor) => {
    if (providerAmountMinor !== expectedAmountMinor) {
        throw createError(
            "Payment amount does not match the selected plan.",
            "PAYMENT_AMOUNT_MISMATCH",
        );
    }
};

/**
 * Verify currency.
 *
 * @param {string} providerCurrency
 * @param {string} expectedCurrency
 */
const verifyCurrency = (providerCurrency, expectedCurrency) => {
    if (providerCurrency !== expectedCurrency) {
        throw createError(
            "Payment currency does not match the selected plan.",
            "PAYMENT_CURRENCY_MISMATCH",
        );
    }
};

// ============================================================
// Razorpay Checkout Signature
// ============================================================
//
// Razorpay checkout verification uses:
//
// HMAC-SHA256(
//     order_id + "|" + payment_id,
//     key_secret
// )
//
// IMPORTANT:
// This verification must happen on the backend.
//
// Never perform this with the Razorpay secret in Vite/frontend.
// ============================================================

/**
 * Verify Razorpay checkout signature.
 *
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean}
 */
const verifyCheckoutSignature = (orderId, paymentId, signature) => {
    if (
        typeof orderId !== "string" ||
        typeof paymentId !== "string" ||
        typeof signature !== "string"
    ) {
        return false;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keySecret) {
        throw createError(
            "RAZORPAY_KEY_SECRET is not configured.",
            "RAZORPAY_SECRET_NOT_CONFIGURED",
        );
    }

    const payload = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(payload, "utf8")
        .digest("hex");

    const providedBuffer = Buffer.from(signature, "utf8");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

// ============================================================
// Razorpay Webhook Signature
// ============================================================
//
// Webhook signatures must be calculated against the RAW request
// body, not JSON.stringify(req.body).
//
// The webhook middleware/controller must preserve the original
// raw bytes.
// ============================================================

/**
 * Verify Razorpay webhook signature.
 *
 * @param {Buffer|string} rawBody
 * @param {string} signature
 * @returns {boolean}
 */
const verifyWebhookSignature = (rawBody, signature) => {
    if (!rawBody || typeof signature !== "string" || !signature.trim()) {
        return false;
    }

    ensureRazorpayConfiguration();

    const expectedSignature = crypto
        .createHmac("sha256", razorpayWebhookSecret)
        .update(rawBody)
        .digest("hex");

    const providedBuffer = Buffer.from(signature, "utf8");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

// ============================================================
// Resolve Requested Product
// ============================================================
//
// This is ALWAYS resolved from backend plan definitions.
//
// Never accept:
// - amount
// - currency
// - Razorpay amount
// - feature flags
//
// from the frontend.
// ============================================================

/**
 * Resolve the authoritative billing product.
 *
 * @param {string} planId
 * @param {string} billingPeriod
 * @returns {Object}
 */
const resolveProduct = (planId, billingPeriod) => {
    const normalizedPlanId = requireString(planId, "Plan ID");

    const normalizedPeriod = requireString(billingPeriod, "Billing period");

    return billingService.getBillingOption(normalizedPlanId, normalizedPeriod);
};

// ============================================================
// Existing Payment Lookup
// ============================================================

/**
 * Find an existing internal payment by provider order ID.
 *
 * @param {string} providerOrderId
 * @returns {Promise<Object|null>}
 */
const findExistingPaymentByOrder = async (providerOrderId) => {
    return paymentRepository.findByProviderOrderReference(
        PAYMENT_PROVIDER,
        providerOrderId,
    );
};

// ============================================================
// Create Razorpay Order
// ============================================================
//
// IMPORTANT:
// This creates an ORDER only.
//
// It does NOT activate a subscription.
//
// The internal payment record starts as pending.
// ============================================================

/**
 * Create a Razorpay order for a paid CuratoCV plan.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.userId
 * @param {string} data.planId
 * @param {string} data.billingPeriod
 * @returns {Promise<Object>}
 */
const createOrder = async (data) => {
    ensureRazorpayConfiguration();

    const userId = requireUserId(data.userId);

    const product = resolveProduct(data.planId, data.billingPeriod);

    const existingSubscription =
        await subscriptionRepository.findCurrentByUserId(userId);

    if (existingSubscription) {
        throw createError(
            "User already has a current subscription.",
            "CURRENT_SUBSCRIPTION_EXISTS",
        );
    }

    const receipt = `ccv_${crypto.randomBytes(12).toString("hex")}`;

    const order = await razorpay.orders.create({
        amount: product.amountMinor,

        currency: product.currency,

        receipt,

        notes: {
            userId: String(userId),

            planId: product.planId,

            billingPeriod: product.billingPeriod,
        },
    });

    if (!order || !order.id) {
        throw createError(
            "Razorpay did not return a valid order.",
            "RAZORPAY_ORDER_CREATION_FAILED",
        );
    }

    verifyAmount(Number(order.amount), product.amountMinor);

    verifyCurrency(order.currency, product.currency);

    const subscription = await billingService.createPendingSubscription({
        userId,

        planId: product.planId,

        billingPeriod: product.billingPeriod,

        provider: PAYMENT_PROVIDER,
    });

    let payment;

    try {
        payment = await paymentRepository.create({
            userId,

            subscriptionId: subscription._id,

            provider: PAYMENT_PROVIDER,

            providerOrderId: order.id,

            providerPaymentId: null,

            planId: product.planId,

            billingOptionId: product.billingOptionId,

            billingPeriod: product.billingPeriod,

            amountMinor: product.amountMinor,

            currency: product.currency,

            status: PAYMENT_STATUSES.PENDING,

            method: null,

            paidAt: null,

            refundedAmountMinor: 0,

            failure: null,

            refund: null,

            lastWebhookEventId: null,
        });
    } catch (error) {
        // ----------------------------------------------------
        // Best-effort cleanup of the pending internal
        // subscription if payment persistence fails.
        //
        // The Razorpay order remains harmless because no
        // entitlement has been granted.
        // ----------------------------------------------------

        try {
            await subscriptionRepository.updateStatus(
                subscription._id,
                "failed",
            );
        } catch {
            // Preserve the original payment persistence error.
        }

        throw error;
    }

    await subscriptionRepository.setLatestPayment(
        subscription._id,
        payment._id,
    );

    return {
        paymentId: payment._id,

        subscriptionId: subscription._id,

        provider: PAYMENT_PROVIDER,

        providerOrderId: order.id,

        keyId: razorpayKeyId,

        amount: product.amount,

        amountMinor: product.amountMinor,

        currency: product.currency,

        planId: product.planId,

        billingPeriod: product.billingPeriod,

        durationMonths: product.durationMonths,
    };
};

// ============================================================
// Verify Checkout Payment
// ============================================================
//
// This is called after Razorpay Checkout returns payment data.
//
// IMPORTANT:
// Signature verification alone is not enough.
//
// We additionally retrieve the provider payment/order and
// verify:
// - order relationship
// - amount
// - currency
// - payment status
// - internal payment record
// - plan information
//
// Only after all checks succeed do we activate entitlements.
// ============================================================

/**
 * Verify a Razorpay checkout payment.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.userId
 * @param {string} data.paymentId
 * @param {string} data.orderId
 * @param {string} data.signature
 * @returns {Promise<Object>}
 */
const verifyCheckoutPayment = async (data) => {
    ensureRazorpayConfiguration();

    const userId = requireUserId(data.userId);

    const providerPaymentId = requireString(data.paymentId, "Payment ID");

    const providerOrderId = requireString(data.orderId, "Order ID");

    const signature = requireString(data.signature, "Payment signature");

    const signatureValid = verifyCheckoutSignature(
        providerOrderId,
        providerPaymentId,
        signature,
    );

    if (!signatureValid) {
        throw createError(
            "Invalid payment signature.",
            "INVALID_PAYMENT_SIGNATURE",
        );
    }

    const payment = await paymentRepository.findByProviderOrderReference(
        PAYMENT_PROVIDER,
        providerOrderId,
    );

    if (!payment) {
        throw createError(
            "Internal payment record was not found.",
            "PAYMENT_RECORD_NOT_FOUND",
        );
    }

    if (String(payment.userId) !== String(userId)) {
        throw createError(
            "Payment does not belong to this user.",
            "PAYMENT_USER_MISMATCH",
        );
    }

    // --------------------------------------------------------
    // Idempotency
    // --------------------------------------------------------

    if (
        payment.status === PAYMENT_STATUSES.CAPTURED &&
        payment.providerPaymentId === providerPaymentId
    ) {
        return {
            paymentId: payment._id,

            subscriptionId: payment.subscriptionId,

            status: "captured",

            alreadyProcessed: true,
        };
    }

    // --------------------------------------------------------
    // Retrieve authoritative provider order/payment
    // --------------------------------------------------------

    const [providerOrder, providerPayment] = await Promise.all([
        razorpay.orders.fetch(providerOrderId),

        razorpay.payments.fetch(providerPaymentId),
    ]);

    if (!providerOrder || !providerPayment) {
        throw createError(
            "Unable to retrieve payment information from Razorpay.",
            "RAZORPAY_PAYMENT_LOOKUP_FAILED",
        );
    }

    // --------------------------------------------------------
    // Verify order relationship
    // --------------------------------------------------------

    if (providerPayment.order_id !== providerOrderId) {
        throw createError(
            "Payment does not belong to the expected Razorpay order.",
            "PAYMENT_ORDER_MISMATCH",
        );
    }

    // --------------------------------------------------------
    // Verify internal amount/currency against our own record
    // --------------------------------------------------------

    verifyAmount(Number(providerOrder.amount), payment.amountMinor);

    verifyAmount(Number(providerPayment.amount), payment.amountMinor);

    verifyCurrency(providerOrder.currency, payment.currency);

    verifyCurrency(providerPayment.currency, payment.currency);

    // --------------------------------------------------------
    // Verify payment status
    // --------------------------------------------------------

    if (providerPayment.status !== "captured") {
        if (providerPayment.status === "failed") {
            await paymentRepository.updateProviderPayment(payment._id, {
                status: PAYMENT_STATUSES.FAILED,

                providerPaymentId,

                failure: {
                    code: providerPayment.error_code || null,

                    description: providerPayment.error_description || null,

                    source: providerPayment.error_source || null,

                    reason: providerPayment.error_reason || null,
                },
            });
        }

        throw createError(
            "Payment has not been captured.",
            "PAYMENT_NOT_CAPTURED",
        );
    }

    // --------------------------------------------------------
    // Persist verified payment
    // --------------------------------------------------------

    const updatedPayment = await paymentRepository.updateProviderPayment(
        payment._id,
        {
            status: PAYMENT_STATUSES.CAPTURED,

            providerPaymentId,

            method: providerPayment.method || null,

            paidAt: providerPayment.created_at
                ? new Date(providerPayment.created_at * 1000)
                : new Date(),

            failure: null,
        },
    );

    if (!updatedPayment) {
        throw createError(
            "Failed to persist captured payment.",
            "PAYMENT_UPDATE_FAILED",
        );
    }

    // --------------------------------------------------------
    // Activate subscription
    // --------------------------------------------------------

    const subscription = await billingService.activateFromVerifiedPayment({
        subscriptionId: payment.subscriptionId,

        paymentId: payment._id,
    });

    // --------------------------------------------------------
    // Fire-and-forget order confirmation email.
    //
    // Non-blocking: never await this. Payment success must not
    // be delayed or failed by email delivery problems.
    // --------------------------------------------------------

    sendOrderConfirmationEmail({
        userId: userId,

        subscription,

        payment: updatedPayment,
    });

    return {
        paymentId: updatedPayment._id,

        subscriptionId: subscription._id,

        status: PAYMENT_STATUSES.CAPTURED,

        planId: subscription.planId,

        billingPeriod: subscription.billingPeriod,

        currentPeriodStart: subscription.currentPeriodStart,

        currentPeriodEnd: subscription.currentPeriodEnd,

        alreadyProcessed: false,
    };
};

// ============================================================
// Email Helpers
// ============================================================

/**
 * Fetch user email and send order confirmation + subscription active.
 *
 * Fire-and-forget: never await the returned promise.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.userId
 * @param {Object} data.subscription
 * @param {Object} data.payment
 * @returns {Promise<void>}
 */
const sendOrderConfirmationEmail = async ({ userId, subscription, payment }) => {
    try {
        const user = await userRepository.findById(userId);

        if (!user || !user.email) {
            return;
        }

        const plan = billingService.getBillingOption(
            subscription.planId,
            subscription.billingPeriod,
        );

        // Send order confirmation
        emailService.sendOrderConfirmation(user.email, payment, plan);

        // Send subscription active (fire-and-forget)
        emailService.sendSubscriptionActive(user.email, subscription, plan);
    } catch (error) {
        // Non-blocking: never throw
        // Logging is handled inside emailService
    }
};

/**
 * Send subscription active email after webhook activates subscription.
 *
 * Fire-and-forget: never await the returned promise.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.userId
 * @param {Object} data.subscription
 * @param {Object} data.payment
 * @returns {Promise<void>}
 */
const sendSubscriptionActiveEmail = async ({ userId, subscription, payment }) => {
    try {
        const user = await userRepository.findById(userId);

        if (!user || !user.email) {
            return;
        }

        const plan = billingService.getBillingOption(
            subscription.planId,
            subscription.billingPeriod,
        );

        emailService.sendSubscriptionActive(user.email, subscription, plan);
    } catch (error) {
        // Non-blocking: never throw
    }
};

/**
 * Send payment failed email.
 *
 * Fire-and-forget: never await the returned promise.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.userId
 * @param {Object} data.payment
 * @returns {Promise<void>}
 */
const sendPaymentFailedEmail = async ({ userId, payment }) => {
    try {
        const user = await userRepository.findById(userId);

        if (!user || !user.email) {
            return;
        }

        emailService.sendPaymentFailed(user.email, payment);
    } catch (error) {
        // Non-blocking: never throw
    }
};

// ============================================================
// Webhook Event Parsing
// ============================================================

/**
 * Safely parse a webhook body.
 *
 * @param {Buffer|string|Object} rawBody
 * @returns {Object}
 */
const parseWebhookBody = (rawBody) => {
    if (rawBody && typeof rawBody === "object" && !Buffer.isBuffer(rawBody)) {
        return rawBody;
    }

    const text = Buffer.isBuffer(rawBody)
        ? rawBody.toString("utf8")
        : String(rawBody || "");

    if (!text) {
        throw createError("Webhook body is empty.", "EMPTY_WEBHOOK_BODY");
    }

    try {
        return JSON.parse(text);
    } catch {
        throw createError(
            "Webhook body is not valid JSON.",
            "INVALID_WEBHOOK_JSON",
        );
    }
};

// ============================================================
// Webhook Event ID
// ============================================================

/**
 * Extract Razorpay webhook event ID.
 *
 * @param {Object} body
 * @returns {string|null}
 */
const getWebhookEventId = (body) => {
    return body?.id || body?.event_id || null;
};

// ============================================================
// Webhook Payment Data
// ============================================================

/**
 * Extract a payment entity from a Razorpay webhook.
 *
 * @param {Object} body
 * @returns {Object|null}
 */
const getWebhookPaymentEntity = (body) => {
    return body?.payload?.payment?.entity || null;
};

/**
 * Extract a subscription entity from a Razorpay webhook.
 *
 * @param {Object} body
 * @returns {Object|null}
 */
const getWebhookSubscriptionEntity = (body) => {
    return body?.payload?.subscription?.entity || null;
};

// ============================================================
// Process Captured Payment Webhook
// ============================================================

/**
 * Process payment.captured.
 *
 * @param {Object} body
 * @param {string|null} eventId
 * @returns {Promise<Object>}
 */
const processPaymentCapturedWebhook = async (body, eventId) => {
    const providerPayment = getWebhookPaymentEntity(body);

    if (!providerPayment) {
        throw createError(
            "Webhook does not contain a payment entity.",
            "WEBHOOK_PAYMENT_MISSING",
        );
    }

    const providerPaymentId = requireString(
        providerPayment.id,
        "Provider payment ID",
    );

    const providerOrderId = requireString(
        providerPayment.order_id,
        "Provider order ID",
    );

    const payment = await paymentRepository.findByProviderOrderReference(
        PAYMENT_PROVIDER,
        providerOrderId,
    );

    if (!payment) {
        // ------------------------------------------------
        // Unknown payment.
        //
        // Do not create a payment record from arbitrary
        // webhook data because the order may not belong
        // to a CuratoCV transaction.
        // ------------------------------------------------

        throw createError(
            "No internal payment record exists for this order.",
            "UNKNOWN_WEBHOOK_PAYMENT",
        );
    }

    // ----------------------------------------------------
    // Idempotency
    // ----------------------------------------------------

    if (eventId && payment.lastWebhookEventId === eventId) {
        return {
            processed: true,

            alreadyProcessed: true,

            paymentId: payment._id,
        };
    }

    // ----------------------------------------------------
    // Verify amount and currency against our own record
    // ----------------------------------------------------

    verifyAmount(Number(providerPayment.amount), payment.amountMinor);

    verifyCurrency(providerPayment.currency, payment.currency);

    // ----------------------------------------------------
    // Persist payment
    // ----------------------------------------------------

    const updatedPayment = await paymentRepository.updateProviderPayment(
        payment._id,
        {
            status: PAYMENT_STATUSES.CAPTURED,

            providerPaymentId,

            method: providerPayment.method || null,

            paidAt: providerPayment.created_at
                ? new Date(providerPayment.created_at * 1000)
                : new Date(),

            failure: null,

            lastWebhookEventId: eventId,
        },
    );

    if (!updatedPayment) {
        throw createError(
            "Failed to persist webhook payment.",
            "WEBHOOK_PAYMENT_UPDATE_FAILED",
        );
    }

    // ----------------------------------------------------
    // Activate entitlement
    // ----------------------------------------------------

    const subscription = await billingService.activateFromVerifiedPayment({
        subscriptionId: payment.subscriptionId,

        paymentId: payment._id,
    });

    // --------------------------------------------------------
    // Fire-and-forget subscription active email.
    //
    // Non-blocking: never await this. Webhook processing must
    // succeed even if email delivery fails.
    // --------------------------------------------------------

    sendSubscriptionActiveEmail({
        userId: payment.userId,

        subscription,

        payment: updatedPayment,
    });

    return {
        processed: true,

        alreadyProcessed: false,

        paymentId: updatedPayment._id,

        subscriptionId: subscription._id,
    };
};

// ============================================================
// Process Payment Failed Webhook
// ============================================================

/**
 * Process payment.failed.
 *
 * @param {Object} body
 * @param {string|null} eventId
 * @returns {Promise<Object>}
 */
const processPaymentFailedWebhook = async (body, eventId) => {
    const providerPayment = getWebhookPaymentEntity(body);

    if (!providerPayment) {
        throw createError(
            "Webhook does not contain a payment entity.",
            "WEBHOOK_PAYMENT_MISSING",
        );
    }

    const providerPaymentId = providerPayment.id;

    const providerOrderId = providerPayment.order_id;

    if (typeof providerOrderId !== "string") {
        throw createError(
            "Failed payment webhook does not contain an order ID.",
            "WEBHOOK_ORDER_MISSING",
        );
    }

    const payment = await paymentRepository.findByProviderOrderReference(
        PAYMENT_PROVIDER,
        providerOrderId,
    );

    if (!payment) {
        throw createError(
            "No internal payment record exists for this order.",
            "UNKNOWN_WEBHOOK_PAYMENT",
        );
    }

    if (eventId && payment.lastWebhookEventId === eventId) {
        return {
            processed: true,

            alreadyProcessed: true,

            paymentId: payment._id,
        };
    }

    const updated = await paymentRepository.updateProviderPayment(payment._id, {
        status: PAYMENT_STATUSES.FAILED,

        providerPaymentId: providerPaymentId || null,

        failure: {
            code: providerPayment.error_code || null,

            description: providerPayment.error_description || null,

            source: providerPayment.error_source || null,

            reason: providerPayment.error_reason || null,
        },

        lastWebhookEventId: eventId,
    });

    if (!updated) {
        throw createError(
            "Failed to persist failed payment.",
            "WEBHOOK_PAYMENT_UPDATE_FAILED",
        );
    }

    // --------------------------------------------------------
    // Fire-and-forget payment failure email.
    //
    // Non-blocking: never await this. Webhook must respond
    // quickly to provider retries.
    // --------------------------------------------------------

    sendPaymentFailedEmail({
        userId: payment.userId,

        payment: updated,
    });

    return {
        processed: true,

        alreadyProcessed: false,

        paymentId: updated._id,

        status: PAYMENT_STATUSES.FAILED,
    };
};

// ============================================================
// Process Refund Webhook
// ============================================================

/**
 * Process refund.processed.
 *
 * @param {Object} body
 * @param {string|null} eventId
 * @returns {Promise<Object>}
 */
const processRefundWebhook = async (body, eventId) => {
    const refund = body?.payload?.refund?.entity;

    if (!refund) {
        throw createError(
            "Webhook does not contain a refund entity.",
            "WEBHOOK_REFUND_MISSING",
        );
    }

    const providerPaymentId = requireString(
        refund.payment_id,
        "Provider payment ID",
    );

    const payment =
        await paymentRepository.findByProviderPaymentId(providerPaymentId);

    if (!payment) {
        throw createError(
            "No internal payment exists for this refund.",
            "UNKNOWN_WEBHOOK_REFUND",
        );
    }

    if (eventId && payment.lastWebhookEventId === eventId) {
        return {
            processed: true,

            alreadyProcessed: true,

            paymentId: payment._id,
        };
    }

    const refundAmountMinor = requireNonNegativeInteger(
        Number(refund.amount),
        "Refund amount",
    );

    const existingRefundedAmount = payment.refundedAmountMinor || 0;

    const newRefundedAmount = existingRefundedAmount + refundAmountMinor;

    let status = PAYMENT_STATUSES.PARTIALLY_REFUNDED;

    if (newRefundedAmount >= payment.amountMinor) {
        status = PAYMENT_STATUSES.REFUNDED;
    }

    const updated = await paymentRepository.recordRefund(payment._id, {
        refundedAmountMinor: newRefundedAmount,

        providerRefundId: refund.id || null,

        processedAt: refund.created_at
            ? new Date(refund.created_at * 1000)
            : new Date(),

        reason: refund.notes?.reason || null,

        status,
    });

    if (!updated) {
        throw createError("Failed to persist refund.", "REFUND_PERSIST_FAILED");
    }

    // --------------------------------------------------------
    // Store the webhook ID separately.
    //
    // recordRefund() updates refund state; this operation
    // handles webhook idempotency.
    // --------------------------------------------------------

    if (eventId) {
        await paymentRepository.setWebhookEventId(payment._id, eventId);
    }

    return {
        processed: true,

        alreadyProcessed: false,

        paymentId: updated._id,

        refundedAmountMinor: newRefundedAmount,

        status,
    };
};

// ============================================================
// Process Subscription Webhook
// ============================================================
//
// Razorpay subscription webhooks are intentionally handled
// separately from one-time checkout payments.
//
// The exact event payload should be reconciled against the
// internal subscription/provider subscription ID before any
// entitlement transition is performed.
// ============================================================

/**
 * Find an internal subscription from a Razorpay subscription
 * webhook entity.
 *
 * @param {Object} providerSubscription
 * @returns {Promise<Object>}
 */
const findInternalSubscription = async (providerSubscription) => {
    const providerSubscriptionId = requireString(
        providerSubscription.id,
        "Provider subscription ID",
    );

    const subscription = await subscriptionRepository.findByProviderReference(
        PAYMENT_PROVIDER,
        providerSubscriptionId,
    );

    if (!subscription) {
        throw createError(
            "No internal subscription matches the provider subscription.",
            "UNKNOWN_PROVIDER_SUBSCRIPTION",
        );
    }

    return subscription;
};

/**
 * Process subscription activation webhook.
 *
 * @param {Object} body
 * @param {string|null} eventId
 * @returns {Promise<Object>}
 */
const processSubscriptionActivatedWebhook = async (body, eventId) => {
    const providerSubscription = getWebhookSubscriptionEntity(body);

    if (!providerSubscription) {
        throw createError(
            "Webhook does not contain a subscription entity.",
            "WEBHOOK_SUBSCRIPTION_MISSING",
        );
    }

    const subscription = await findInternalSubscription(providerSubscription);

    const payment = await subscriptionRepository.findByLatestPaymentId(
        subscription.latestPaymentId,
    );

    // ----------------------------------------------------
    // Provider subscription activation does not itself
    // prove a payment unless the event payload/provider
    // state indicates that payment has been collected.
    //
    // We therefore only synchronize provider identifiers
    // here. Payment capture remains handled by payment
    // events/reconciliation.
    // ----------------------------------------------------

    const updated = await subscriptionRepository.updateById(subscription._id, {
        providerSubscriptionId: providerSubscription.id,

        providerCustomerId:
            providerSubscription.customer_id || subscription.providerCustomerId,

        ...(eventId
            ? {
                  lastWebhookEventId: eventId,
              }
            : {}),
    });

    return {
        processed: true,

        alreadyProcessed: false,

        subscriptionId: updated?._id || subscription._id,

        paymentId: payment?._id || null,
    };
};

// ============================================================
// Process Subscription Charged
// ============================================================

/**
 * Process subscription.charged.
 *
 * This event represents a provider-side recurring charge.
 *
 * @param {Object} body
 * @param {string|null} eventId
 * @returns {Promise<Object>}
 */
const processSubscriptionChargedWebhook = async (body, eventId) => {
    const providerSubscription = getWebhookSubscriptionEntity(body);

    if (!providerSubscription) {
        throw createError(
            "Webhook does not contain a subscription entity.",
            "WEBHOOK_SUBSCRIPTION_MISSING",
        );
    }

    const subscription = await findInternalSubscription(providerSubscription);

    if (eventId && subscription.lastWebhookEventId === eventId) {
        return {
            processed: true,

            alreadyProcessed: true,

            subscriptionId: subscription._id,
        };
    }

    const providerPayment = getWebhookPaymentEntity(body);

    let payment = null;

    // ----------------------------------------------------
    // Some provider subscription events include payment
    // information. If available, reconcile it.
    // ----------------------------------------------------

    if (providerPayment?.id) {
        payment = await paymentRepository.findByProviderPaymentId(
            providerPayment.id,
        );
    }

    // ----------------------------------------------------
    // If no internal payment exists, do not blindly create
    // an entitlement. Provider subscription state must be
    // reconciled through the appropriate payment record.
    // ----------------------------------------------------

    if (payment && providerPayment.amount != null) {
        verifyAmount(Number(providerPayment.amount), payment.amountMinor);

        verifyCurrency(providerPayment.currency, payment.currency);
    }

    if (payment && payment.status !== PAYMENT_STATUSES.CAPTURED) {
        await paymentRepository.updateProviderPayment(payment._id, {
            status: PAYMENT_STATUSES.CAPTURED,

            providerPaymentId: providerPayment.id,

            method: providerPayment.method || null,

            paidAt: providerPayment.created_at
                ? new Date(providerPayment.created_at * 1000)
                : new Date(),

            lastWebhookEventId: eventId,
        });

        const renewed = await billingService.renewSubscription({
            subscriptionId: subscription._id,

            paymentId: payment._id,
        });

        // --------------------------------------------------------
        // Fire-and-forget subscription active email for renewal.
        //
        // Non-blocking: never await this.
        // --------------------------------------------------------

        sendSubscriptionActiveEmail({
            userId: payment.userId,

            subscription: renewed,

            payment,
        });

        return {
            processed: true,

            alreadyProcessed: false,

            subscriptionId: renewed._id,

            paymentId: payment._id,
        };
    }

    // ----------------------------------------------------
    // If payment is already captured, the event is
    // effectively synchronized.
    // ----------------------------------------------------

    if (payment?.status === PAYMENT_STATUSES.CAPTURED) {
        return {
            processed: true,

            alreadyProcessed: false,

            subscriptionId: subscription._id,

            paymentId: payment._id,
        };
    }

    // ----------------------------------------------------
    // Do not activate/renew without an internal payment
    // record.
    // ----------------------------------------------------

    throw createError(
        "Recurring charge could not be reconciled with an internal payment.",
        "UNRECONCILED_SUBSCRIPTION_CHARGE",
    );
};

// ============================================================
// Process Subscription Cancelled
// ============================================================

/**
 * Process subscription.cancelled.
 *
 * @param {Object} body
 * @param {string|null} eventId
 * @returns {Promise<Object>}
 */
const processSubscriptionCancelledWebhook = async (body, eventId) => {
    const providerSubscription = getWebhookSubscriptionEntity(body);

    if (!providerSubscription) {
        throw createError(
            "Webhook does not contain a subscription entity.",
            "WEBHOOK_SUBSCRIPTION_MISSING",
        );
    }

    const subscription = await findInternalSubscription(providerSubscription);

    if (eventId && subscription.lastWebhookEventId === eventId) {
        return {
            processed: true,

            alreadyProcessed: true,

            subscriptionId: subscription._id,
        };
    }

    const updated = await subscriptionRepository.updateById(subscription._id, {
        providerSubscriptionId: providerSubscription.id,

        providerCustomerId:
            providerSubscription.customer_id || subscription.providerCustomerId,

        cancelAtPeriodEnd: true,

        cancelledAt: new Date(),

        ...(eventId
            ? {
                  lastWebhookEventId: eventId,
              }
            : {}),
    });

    return {
        processed: true,

        alreadyProcessed: false,

        subscriptionId: updated?._id || subscription._id,
    };
};

// ============================================================
// Process Subscription Completed
// ============================================================

/**
 * Process subscription.completed.
 *
 * This represents provider-side completion/cancellation of
 * the subscription lifecycle.
 *
 * @param {Object} body
 * @param {string|null} eventId
 * @returns {Promise<Object>}
 */
const processSubscriptionCompletedWebhook = async (body, eventId) => {
    const providerSubscription = getWebhookSubscriptionEntity(body);

    if (!providerSubscription) {
        throw createError(
            "Webhook does not contain a subscription entity.",
            "WEBHOOK_SUBSCRIPTION_MISSING",
        );
    }

    const subscription = await findInternalSubscription(providerSubscription);

    if (eventId && subscription.lastWebhookEventId === eventId) {
        return {
            processed: true,

            alreadyProcessed: true,

            subscriptionId: subscription._id,
        };
    }

    const updated = await subscriptionRepository.updateById(subscription._id, {
        cancelAtPeriodEnd: true,

        cancelledAt: new Date(),

        ...(eventId
            ? {
                  lastWebhookEventId: eventId,
              }
            : {}),
    });

    return {
        processed: true,

        alreadyProcessed: false,

        subscriptionId: updated?._id || subscription._id,
    };
};

// ============================================================
// Process Webhook
// ============================================================
//
// This function expects the RAW request body.
//
// The webhook route/controller must NOT parse the request body
// before signature verification.
// ============================================================

/**
 * Process a verified Razorpay webhook.
 *
 * @param {Object} data
 * @param {Buffer|string} data.rawBody
 * @param {string} data.signature
 * @returns {Promise<Object>}
 */
const processWebhook = async (data) => {
    ensureRazorpayConfiguration();

    const rawBody = data.rawBody;

    const signature = requireString(data.signature, "Webhook signature");

    const valid = verifyWebhookSignature(rawBody, signature);

    if (!valid) {
        throw createError(
            "Invalid Razorpay webhook signature.",
            "INVALID_WEBHOOK_SIGNATURE",
        );
    }

    const body = parseWebhookBody(rawBody);

    const event = requireString(body.event, "Webhook event");

    const eventId = getWebhookEventId(body);

    // --------------------------------------------------------
    // Event dispatch
    // --------------------------------------------------------

    switch (event) {
        case WEBHOOK_EVENTS.PAYMENT_CAPTURED:
            return processPaymentCapturedWebhook(body, eventId);

        case WEBHOOK_EVENTS.PAYMENT_FAILED:
            return processPaymentFailedWebhook(body, eventId);

        case WEBHOOK_EVENTS.PAYMENT_REFUNDED:
            return processRefundWebhook(body, eventId);

        case WEBHOOK_EVENTS.SUBSCRIPTION_ACTIVATED:
            return processSubscriptionActivatedWebhook(body, eventId);

        case WEBHOOK_EVENTS.SUBSCRIPTION_CHARGED:
            return processSubscriptionChargedWebhook(body, eventId);

        case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELLED:
            return processSubscriptionCancelledWebhook(body, eventId);

        case WEBHOOK_EVENTS.SUBSCRIPTION_COMPLETED:
            return processSubscriptionCompletedWebhook(body, eventId);

        default:
            // ------------------------------------------------
            // Unknown events should be acknowledged by the
            // controller rather than treated as successful
            // payment events.
            // ------------------------------------------------

            return {
                processed: false,

                ignored: true,

                event,
            };
    }
};

// ============================================================
// Refund Lookup
// ============================================================

/**
 * Retrieve payment information for a user's payment.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} paymentId
 * @returns {Promise<Object>}
 */
const getUserPayment = async (userId, paymentId) => {
    const normalizedUserId = requireUserId(userId);

    const normalizedPaymentId = requireString(String(paymentId), "Payment ID");

    const payment = await paymentRepository.findByIdAndUserId(
        normalizedPaymentId,
        normalizedUserId,
    );

    if (!payment) {
        throw createError("Payment not found.", "PAYMENT_NOT_FOUND");
    }

    return payment;
};

// ============================================================
// Payment History
// ============================================================

/**
 * Retrieve a user's payment history.
 *
 * @param {string|ObjectId} userId
 * @param {Object} [options]
 * @param {number} [options.limit=50]
 * @param {number} [options.skip=0]
 * @returns {Promise<Array>}
 */
const getPaymentHistory = async (userId, options = {}) => {
    const normalizedUserId = requireUserId(userId);

    const limit = options.limit ?? 50;

    const skip = options.skip ?? 0;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("Payment history limit must be between 1 and 100.");
    }

    if (!Number.isInteger(skip) || skip < 0) {
        throw new TypeError(
            "Payment history offset must be a non-negative integer.",
        );
    }

    return paymentRepository.findAllByUserId(normalizedUserId, limit, skip);
};

// ============================================================
// Export
// ============================================================

const paymentService = Object.freeze({
    createOrder,

    verifyCheckoutPayment,

    verifyCheckoutSignature,

    verifyWebhookSignature,

    processWebhook,

    getUserPayment,

    getPaymentHistory,

    paymentStatuses: PAYMENT_STATUSES,

    webhookEvents: WEBHOOK_EVENTS,
});

export default paymentService;
