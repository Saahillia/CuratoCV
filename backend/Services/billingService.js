import plans from "../Constants/plans.js";

import subscriptionRepository from "../Repositories/subscriptionRepository.js";
import paymentRepository from "../Repositories/paymentRepository.js";

// ============================================================
// CuratoCV Billing Service
// ============================================================
//
// Business-logic layer for subscription and entitlement
// management.
//
// Responsibilities:
// - Resolve valid CuratoCV plans
// - Resolve valid billing options
// - Calculate entitlement periods
// - Determine subscription state
// - Create subscription state from verified payment data
// - Activate paid entitlements
// - Renew subscriptions
// - Cancel subscriptions
// - Expire subscriptions
// - Manage AI-credit periods
// - Expose safe billing information to controllers
//
// NOT responsible for:
// - HTTP req/res
// - JWT authentication
// - Authorization middleware
// - Direct Razorpay API calls
// - Razorpay signature verification
// - Webhook HTTP handling
// - Sending emails
// - Frontend state management
//
// Payment-provider communication belongs to paymentService.js.
// Database access belongs to repositories.
// ============================================================

// ============================================================
// Constants
// ============================================================

const { FREE, PRO, PRO_PLUS } = plans.planIds;

const { ACTIVE, PENDING, PAUSED, CANCELLED, EXPIRED, FAILED } =
    subscriptionRepository.constructor?.statuses || {
        ACTIVE: "active",
        PENDING: "pending",
        PAUSED: "paused",
        CANCELLED: "cancelled",
        EXPIRED: "expired",
        FAILED: "failed",
    };

// ============================================================
// Internal Validation Helpers
// ============================================================

/**
 * Normalize a required string.
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
 * Validate a user ID value.
 *
 * The repository/model remains responsible for MongoDB casting,
 * but the service should reject obviously invalid values before
 * reaching the database.
 *
 * @param {*} userId
 * @returns {string}
 */
const requireUserId = (userId) => {
    return requireId(userId, "User ID");
};

/**
 * Validate a positive integer.
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
 * Resolve a plan.
 *
 * @param {string} planId
 * @returns {Object}
 */
const resolvePlan = (planId) => {
    const normalizedPlanId = requireString(planId, "Plan ID");

    if (!plans.isValidPlanId(normalizedPlanId)) {
        const error = new Error("Invalid subscription plan.");

        error.code = "INVALID_PLAN";

        throw error;
    }

    const plan = plans.getPlan(normalizedPlanId);

    if (!plan) {
        const error = new Error("Subscription plan was not found.");

        error.code = "PLAN_NOT_FOUND";

        throw error;
    }

    return plan;
};

/**
 * Resolve a paid billing option.
 *
 * @param {string} planId
 * @param {string} billingPeriod
 * @returns {Object}
 */
const resolveBillingOption = (planId, billingPeriod) => {
    const normalizedPlanId = requireString(planId, "Plan ID");

    const normalizedPeriod = requireString(billingPeriod, "Billing period");

    const option = plans.getBillingOption(normalizedPlanId, normalizedPeriod);

    if (!option) {
        const error = new Error("Invalid billing option.");

        error.code = "INVALID_BILLING_OPTION";

        throw error;
    }

    return option;
};

/**
 * Resolve a paid plan + billing option pair.
 *
 * @param {string} planId
 * @param {string} billingPeriod
 * @returns {Object}
 */
const resolvePaidProduct = (planId, billingPeriod) => {
    const plan = resolvePlan(planId);

    if (planId === FREE) {
        const error = new Error(
            "The Free plan does not have a paid billing option.",
        );

        error.code = "FREE_PLAN_PAYMENT_NOT_ALLOWED";

        throw error;
    }

    const billingOption = resolveBillingOption(planId, billingPeriod);

    return {
        plan,
        billingOption,
    };
};

// ============================================================
// Date Helpers
// ============================================================

/**
 * Add calendar months to a date.
 *
 * This intentionally uses calendar arithmetic rather than
 * milliseconds because subscription periods are expressed in
 * calendar months.
 *
 * Example:
 *
 *     January 31 + 1 month
 *
 * must not be calculated as simply:
 *
 *     30 * 24 * 60 * 60 * 1000
 *
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
const addMonths = (date, months) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new TypeError("A valid Date is required.");
    }

    if (!Number.isInteger(months) || months <= 0) {
        throw new TypeError("Months must be a positive integer.");
    }

    const result = new Date(date.getTime());

    const originalDay = result.getDate();

    result.setDate(1);

    result.setMonth(result.getMonth() + months);

    const lastDayOfTargetMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0,
    ).getDate();

    result.setDate(Math.min(originalDay, lastDayOfTargetMonth));

    return result;
};

/**
 * Calculate the entitlement period for a billing option.
 *
 * @param {Date} startDate
 * @param {number} durationMonths
 * @returns {{start: Date, end: Date}}
 */
const calculateEntitlementPeriod = (startDate, durationMonths) => {
    const start = new Date(startDate);

    if (Number.isNaN(start.getTime())) {
        throw new TypeError("Invalid entitlement start date.");
    }

    const end = addMonths(start, durationMonths);

    return {
        start,
        end,
    };
};

// ============================================================
// AI Credit Helpers
// ============================================================

/**
 * Resolve AI entitlement for a plan.
 *
 * @param {string} planId
 * @returns {Object}
 */
const getAIEntitlement = (planId) => {
    resolvePlan(planId);

    return plans.getAIEntitlement(planId);
};

/**
 * Calculate AI credit period.
 *
 * AI credits are tied to the subscription billing period.
 *
 * @param {string} planId
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @returns {Object}
 */
const calculateAICreditPeriod = (planId, periodStart, periodEnd) => {
    const entitlement = getAIEntitlement(planId);

    return {
        aiCreditsPeriodStart: new Date(periodStart),

        aiCreditsPeriodEnd: new Date(periodEnd),

        aiCreditsGranted: entitlement.enabled
            ? entitlement.creditsPerPeriod
            : 0,

        aiCreditsUsed: 0,
    };
};

// ============================================================
// Public Plan Information
// ============================================================
//
// This is safe plan information intended for controllers that
// need to return pricing/feature information to the frontend.
//
// Do NOT return internal provider IDs or secrets.
// ============================================================

/**
 * Return safe public plan definitions.
 *
 * @returns {Array<Object>}
 */
const getPublicPlans = () => {
    return Object.values(plans.plans).map((plan) => ({
        id: plan.id,

        name: plan.name,

        description: plan.description,

        currency: plan.currency,

        resumeLimit: plan.resumeLimit,

        ai: {
            enabled: plan.ai.enabled,

            creditsPerBillingPeriod: plan.ai.creditsPerPeriod,
        },

        features: {
            ...plan.features,
        },

        billing: plan.id === plans.planIds.FREE ? null : {
            recurring: Object.values(plan.billingOptions).some(option => option.recurring),

            periods: Object.fromEntries(
                Object.entries(plan.billingOptions).map(([period, option]) => [
                    period,
                    {
                        amount: option.amount,

                        amountMinor: option.amountMinor,

                        currency: option.currency,

                        durationMonths: option.durationMonths,

                        recurring: option.recurring,
                    },
                ]),
            ),
        },

        lifetimeAccess: plan.access?.lifetimeCoreAccess || false,
    }));
};

// ============================================================
// Billing Option Information
// ============================================================

/**
 * Get a safe billing option.
 *
 * @param {string} planId
 * @param {string} billingPeriod
 * @returns {Object}
 */
const getBillingOption = (planId, billingPeriod) => {
    const { plan, billingOption } = resolvePaidProduct(planId, billingPeriod);

    return {
        planId: plan.id,

        planName: plan.name,

        billingPeriod,

        billingOptionId: billingOption.id,

        amount: billingOption.amount,

        amountMinor: billingOption.amountMinor,

        currency: billingOption.currency,

        durationMonths: billingOption.durationMonths,

        recurring: billingOption.recurring,
    };
};

// ============================================================
// Current Subscription
// ============================================================

/**
 * Get the current subscription for a user.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object|null>}
 */
const getCurrentSubscription = async (userId) => {
    const normalizedUserId = requireUserId(userId);

    return subscriptionRepository.findCurrentByUserId(normalizedUserId);
};

// ============================================================
// Active Subscription
// ============================================================

/**
 * Get the active subscription for a user.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object|null>}
 */
const getActiveSubscription = async (userId) => {
    const normalizedUserId = requireUserId(userId);

    return subscriptionRepository.findActiveByUserId(normalizedUserId);
};

// ============================================================
// Create Pending Subscription
// ============================================================
//
// This creates the internal subscription state before payment
// completion.
//
// It does NOT activate premium access.
//
// The payment service will later create/verify the provider
// transaction and the billing service will activate the
// subscription only after trusted payment confirmation.
// ============================================================

/**
 * Create a pending paid subscription.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.userId
 * @param {string} data.planId
 * @param {string} data.billingPeriod
 * @param {string} data.provider
 * @param {string|null} data.providerSubscriptionId
 * @param {string|null} data.providerCustomerId
 * @returns {Promise<Object>}
 */
const createPendingSubscription = async (data) => {
    const userId = requireUserId(data.userId);

    const { plan, billingOption } = resolvePaidProduct(
        data.planId,
        data.billingPeriod,
    );

    const provider = requireString(data.provider, "Payment provider");

    const existing = await subscriptionRepository.findCurrentByUserId(userId);

    if (existing) {
        const error = new Error("User already has a current subscription.");

        error.code = "CURRENT_SUBSCRIPTION_EXISTS";

        throw error;
    }

    const subscriptionData = {
        userId,

        planId: plan.id,

        billingOptionId: billingOption.id,

        billingPeriod: data.billingPeriod,

        provider,

        providerSubscriptionId: data.providerSubscriptionId || null,

        providerCustomerId: data.providerCustomerId || null,

        status: PENDING,

        currentPeriodStart: null,

        currentPeriodEnd: null,

        startedAt: null,

        expiresAt: null,

        cancelAtPeriodEnd: false,

        cancelledAt: null,

        aiCreditsPeriodStart: null,

        aiCreditsPeriodEnd: null,

        aiCreditsGranted: 0,

        aiCreditsUsed: 0,

        latestPaymentId: null,
    };

    return subscriptionRepository.create(subscriptionData);
};

// ============================================================
// Activate Subscription
// ============================================================
//
// This method must only be called after payment/provider
// verification has succeeded.
//
// It creates the entitlement period and initializes AI credits.
//
// IMPORTANT
// ------------------------------------------------------------
// This method should be invoked by trusted backend code only.
// A frontend request must never be allowed to directly call
// this operation.
// ============================================================

/**
 * Activate a paid subscription after verified payment.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.subscriptionId
 * @param {Date} [data.startDate]
 * @param {string|ObjectId} [data.paymentId]
 * @returns {Promise<Object>}
 */
const activateSubscription = async (data) => {
    const subscriptionId = requireId(data.subscriptionId, "Subscription ID");

    const subscription = await subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
        const error = new Error("Subscription not found.");

        error.code = "SUBSCRIPTION_NOT_FOUND";

        throw error;
    }

    if (subscription.status === ACTIVE) {
        return subscription;
    }

    if (subscription.status !== PENDING) {
        const error = new Error("Only pending subscriptions can be activated.");

        error.code = "INVALID_SUBSCRIPTION_STATE";

        throw error;
    }

    const billingOption = resolveBillingOption(
        subscription.planId,
        subscription.billingPeriod,
    );

    const startDate = data.startDate ? new Date(data.startDate) : new Date();

    const { start, end } = calculateEntitlementPeriod(
        startDate,
        billingOption.durationMonths,
    );

    const aiCredits = calculateAICreditPeriod(subscription.planId, start, end);

    const updated = await subscriptionRepository.updateById(subscription._id, {
        status: ACTIVE,

        currentPeriodStart: start,

        currentPeriodEnd: end,

        startedAt: subscription.startedAt || start,

        expiresAt: end,

        cancelAtPeriodEnd: false,

        cancelledAt: null,

        ...aiCredits,

        ...(data.paymentId
            ? {
                  latestPaymentId: data.paymentId,
              }
            : {}),
    });

    if (!updated) {
        const error = new Error("Subscription activation failed.");

        error.code = "SUBSCRIPTION_ACTIVATION_FAILED";

        throw error;
    }

    return updated;
};

// ============================================================
// Activate From Payment
// ============================================================
//
// Convenience method used when a verified payment is already
// available.
//
// This links the payment and subscription while keeping
// provider verification outside this service.
// ============================================================

/**
 * Activate a subscription using a verified payment.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.subscriptionId
 * @param {string|ObjectId} data.paymentId
 * @param {Date} [data.startDate]
 * @returns {Promise<Object>}
 */
const activateFromVerifiedPayment = async (data) => {
    const paymentId = requireId(data.paymentId, "Payment ID");

    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
        const error = new Error("Payment not found.");

        error.code = "PAYMENT_NOT_FOUND";

        throw error;
    }

    if (payment.status !== "captured") {
        const error = new Error(
            "Only captured payments can activate a subscription.",
        );

        error.code = "PAYMENT_NOT_CAPTURED";

        throw error;
    }

    const subscription = await activateSubscription(data);

    const linkedPayment = await paymentRepository.attachSubscription(
        payment._id,
        subscription._id,
    );

    if (!linkedPayment) {
        const error = new Error(
            "Failed to associate payment with subscription.",
        );

        error.code = "PAYMENT_SUBSCRIPTION_LINK_FAILED";

        throw error;
    }

    const finalSubscription = await subscriptionRepository.setLatestPayment(
        subscription._id,
        payment._id,
    );

    return finalSubscription || subscription;
};

// ============================================================
// Renew Subscription
// ============================================================
//
// Used after a verified successful recurring payment.
//
// The next period begins at the end of the current period,
// rather than at "now", preventing gaps when a renewal is
// processed slightly before/after the exact period boundary.
// ============================================================

/**
 * Renew an active subscription.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.subscriptionId
 * @param {string|ObjectId} [data.paymentId]
 * @param {Date} [data.periodStart]
 * @returns {Promise<Object>}
 */
const renewSubscription = async (data) => {
    const subscriptionId = requireId(data.subscriptionId, "Subscription ID");

    const subscription = await subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
        const error = new Error("Subscription not found.");

        error.code = "SUBSCRIPTION_NOT_FOUND";

        throw error;
    }

    if (subscription.status !== ACTIVE && subscription.status !== PAUSED) {
        const error = new Error(
            "Only active or paused subscriptions can be renewed.",
        );

        error.code = "INVALID_RENEWAL_STATE";

        throw error;
    }

    const billingOption = resolveBillingOption(
        subscription.planId,
        subscription.billingPeriod,
    );

    const periodStart = data.periodStart
        ? new Date(data.periodStart)
        : subscription.currentPeriodEnd || new Date();

    const { start, end } = calculateEntitlementPeriod(
        periodStart,
        billingOption.durationMonths,
    );

    const aiCredits = calculateAICreditPeriod(subscription.planId, start, end);

    const updated = await subscriptionRepository.updateById(subscription._id, {
        status: ACTIVE,

        currentPeriodStart: start,

        currentPeriodEnd: end,

        expiresAt: end,

        cancelAtPeriodEnd: false,

        cancelledAt: null,

        ...aiCredits,

        ...(data.paymentId
            ? {
                  latestPaymentId: data.paymentId,
              }
            : {}),
    });

    if (!updated) {
        const error = new Error("Subscription renewal failed.");

        error.code = "SUBSCRIPTION_RENEWAL_FAILED";

        throw error;
    }

    if (data.paymentId) {
        await paymentRepository.attachSubscription(
            data.paymentId,
            subscription._id,
        );
    }

    return updated;
};

// ============================================================
// Cancel Subscription
// ============================================================
//
// Default behavior is cancellation at period end.
//
// This preserves paid entitlement until the user has consumed
// the period they already purchased.
//
// Immediate cancellation should be an explicit provider/business
// operation and should not happen accidentally through this
// method.
// ============================================================

/**
 * Cancel a subscription at the end of its current period.
 *
 * @param {Object} data
 * @param {string|ObjectId} data.subscriptionId
 * @param {Date} [data.cancelledAt]
 * @returns {Promise<Object>}
 */
const cancelAtPeriodEnd = async (data) => {
    const subscriptionId = requireId(
        data?.subscriptionId ?? data,
        "Subscription ID",
    );

    const subscription = await subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
        const error = new Error("Subscription not found.");

        error.code = "SUBSCRIPTION_NOT_FOUND";

        throw error;
    }

    if (subscription.status !== ACTIVE) {
        const error = new Error("Only active subscriptions can be cancelled.");

        error.code = "INVALID_CANCELLATION_STATE";

        throw error;
    }

    return subscriptionRepository.updateCancellation(subscription._id, {
        cancelAtPeriodEnd: true,

        cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : new Date(),
    });
};

// ============================================================
// Mark Cancelled
// ============================================================
//
// Used after provider confirmation when the subscription has
// actually transitioned into a cancelled state.
// ============================================================

/**
 * Mark a subscription as cancelled.
 *
 * @param {string|ObjectId} subscriptionId
 * @returns {Promise<Object>}
 */
const markCancelled = async (subscriptionId) => {
    const normalizedId = requireId(subscriptionId, "Subscription ID");

    const updated = await subscriptionRepository.updateStatus(
        normalizedId,
        CANCELLED,
    );

    if (!updated) {
        const error = new Error("Subscription not found.");

        error.code = "SUBSCRIPTION_NOT_FOUND";

        throw error;
    }

    return updated;
};

// ============================================================
// Expire Subscription
// ============================================================
//
// Expiration should be performed by a trusted scheduled job,
// webhook workflow, or reconciliation service.
//
// It should never depend on the frontend deciding that a
// subscription has expired.
// ============================================================

/**
 * Expire a subscription.
 *
 * @param {string|ObjectId} subscriptionId
 * @param {Date} [now]
 * @returns {Promise<Object>}
 */
const expireSubscription = async (subscriptionId, options = {}) => {
    const normalizedId = requireId(subscriptionId, "Subscription ID");

    const subscription = await subscriptionRepository.findById(normalizedId);

    if (!subscription) {
        const error = new Error("Subscription not found.");

        error.code = "SUBSCRIPTION_NOT_FOUND";

        throw error;
    }

    const now = options?.now || (options instanceof Date ? options : new Date());

    if (options?.checkDate) {
        const expiry = subscription.expiresAt || subscription.currentPeriodEnd;

        if (expiry && new Date(expiry) > new Date(now)) {
            const error = new Error("Subscription has not expired yet.");

            error.code = "SUBSCRIPTION_NOT_EXPIRED";

            throw error;
        }
    }

    const updated = await subscriptionRepository.updateById(subscription._id, {
        status: EXPIRED,

        expiresAt: now,
    });

    if (!updated) {
        const error = new Error("Failed to expire subscription.");

        error.code = "SUBSCRIPTION_EXPIRY_FAILED";

        throw error;
    }

    return updated;
};

// ============================================================
// Reconcile Expired Subscriptions
// ============================================================
//
// Returns candidates rather than blindly changing every record.
// This allows the eventual reconciliation worker to check
// provider state where necessary before making irreversible
// entitlement changes.
// ============================================================

/**
 * Find subscriptions whose entitlement period has ended.
 *
 * @param {Date} [now]
 * @param {number} [limit=100]
 * @returns {Promise<Array>}
 */
const findExpiredCandidates = async (now = new Date(), limit = 100) => {
    return subscriptionRepository.findActivePastExpiry(now, limit);
};

// ============================================================
// Get Subscription Entitlements
// ============================================================
//
// This is the central read operation that other services can
// use when determining user capabilities.
//
// It does NOT trust frontend-provided plan information.
// ============================================================

/**
 * Get the effective entitlements for a user.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>}
 */
const getUserEntitlements = async (userId) => {
    const normalizedUserId = requireUserId(userId);

    const subscription =
        await subscriptionRepository.findActiveByUserId(normalizedUserId);

    // --------------------------------------------------------
    // Free entitlement
    // --------------------------------------------------------

    if (!subscription) {
        const freePlan = resolvePlan(FREE);

        return {
            source: "free",

            planId: FREE,

            planName: freePlan.name,

            resumeLimit: freePlan.resumeLimit,

            ai: {
                enabled: false,

                creditsGranted: 0,

                creditsUsed: 0,

                creditsRemaining: 0,

                consumed: 0,

                available: 0,
            },

            features: {
                ...freePlan.features,
            },

            subscriptionId: null,

            expiresAt: null,

            hasActiveSubscription: false,
        };
    }

    // --------------------------------------------------------
    // Paid entitlement
    // --------------------------------------------------------

    const plan = resolvePlan(subscription.planId);

    const creditsGranted = subscription.aiCreditsGranted || 0;

    const creditsUsed = subscription.aiCreditsUsed || 0;

    const creditsRemaining = Math.max(0, creditsGranted - creditsUsed);

    return {
        source: "subscription",

        planId: plan.id,

        planName: plan.name,

        resumeLimit: plan.resumeLimit,

        ai: {
            enabled: plan.ai.enabled,

            creditsGranted,

            creditsUsed,

            creditsRemaining,

            consumed: creditsUsed,

            available: Math.max(0, creditsGranted - creditsUsed),
        },

        features: {
            ...plan.features,
        },

        subscriptionId: subscription._id,

        status: subscription.status,

        currentPeriodStart: subscription.currentPeriodStart,

        currentPeriodEnd: subscription.currentPeriodEnd,

        expiresAt: subscription.expiresAt,

        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,

        hasActiveSubscription: subscription.status === ACTIVE,

        startDate: subscription.startedAt || subscription.currentPeriodStart,

        endDate: subscription.expiresAt || subscription.currentPeriodEnd,
    };
};

// ============================================================
// Resume Entitlement
// ============================================================
//
// Resume count itself belongs to the resume service/repository.
// Billing service only provides the plan-level entitlement.
//
// The caller should compare the current user's resume count
// against this limit.
// ============================================================

/**
 * Get the resume limit for a user.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<number|null>}
 */
const getResumeLimit = async (userId) => {
    const entitlements = await getUserEntitlements(userId);

    return entitlements.resumeLimit;
};

// ============================================================
// AI Entitlement
// ============================================================

/**
 * Get AI entitlement for a user.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>}
 */
const getUserAIEntitlement = async (userId) => {
    const entitlements = await getUserEntitlements(userId);

    return entitlements.ai;
};

// ============================================================
// Consume AI Credits
// ============================================================
//
// This operation uses the repository's atomic conditional
// update.
//
// If the database returns null, there were not enough credits
// available or the subscription no longer exists.
// ============================================================

/**
 * Consume AI credits for a user.
 *
 * @param {string|ObjectId} userId
 * @param {number} credits
 * @returns {Promise<Object>}
 */
const consumeUserAICredits = async (userId, credits) => {
    const normalizedUserId = requireUserId(userId);

    const amount = requirePositiveInteger(credits, "AI credits");

    const subscription =
        await subscriptionRepository.findActiveByUserId(normalizedUserId);

    if (!subscription) {
        const error = new Error(
            "AI features require an active paid subscription.",
        );

        error.code = "AI_SUBSCRIPTION_REQUIRED";

        throw error;
    }

    const plan = resolvePlan(subscription.planId);

    if (!plan.ai.enabled) {
        const error = new Error("AI features are not available on this plan.");

        error.code = "AI_NOT_INCLUDED";

        throw error;
    }

    const updated = await subscriptionRepository.consumeAICredits(
        subscription._id,
        amount,
    );

    if (!updated) {
        const error = new Error("Insufficient AI credits.");

        error.code = "AI_CREDITS_EXHAUSTED";

        throw error;
    }

    return {
        subscriptionId: updated._id,

        creditsGranted: updated.aiCreditsGranted,

        creditsUsed: updated.aiCreditsUsed,

        creditsRemaining: Math.max(
            0,
            updated.aiCreditsGranted - updated.aiCreditsUsed,
        ),
    };
};

// ============================================================
// Payment Association
// ============================================================

/**
 * Associate a payment with a subscription.
 *
 * This is useful for verified payment processing.
 *
 * @param {string|ObjectId} subscriptionId
 * @param {string|ObjectId} paymentId
 * @returns {Promise<Object>}
 */
const associatePayment = async (subscriptionId, paymentId) => {
    const normalizedSubscriptionId = requireId(subscriptionId, "Subscription ID");

    const normalizedPaymentId = requireId(paymentId, "Payment ID");

    const subscription = await subscriptionRepository.setLatestPayment(
        normalizedSubscriptionId,
        normalizedPaymentId,
    );

    if (!subscription) {
        const error = new Error("Subscription not found.");

        error.code = "SUBSCRIPTION_NOT_FOUND";

        throw error;
    }

    return subscription;
};

// ============================================================
// Export
// ============================================================

const billingService = Object.freeze({
    getPublicPlans,

    getBillingOption,

    getCurrentSubscription,

    getActiveSubscription,

    createPendingSubscription,

    activateSubscription,

    activateFromVerifiedPayment,

    renewSubscription,

    cancelAtPeriodEnd,

    markCancelled,

    expireSubscription,

    findExpiredCandidates,

    getUserEntitlements,

    getResumeLimit,

    getUserAIEntitlement,

    consumeUserAICredits,

    associatePayment,
});

export default billingService;
    