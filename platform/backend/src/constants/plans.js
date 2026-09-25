// ============================================================
// CuratoCV Subscription Plans
// ============================================================
//
// Central source of truth for:
// - Public subscription plans
// - Billing options
// - Pricing
// - Resume entitlements
// - AI entitlements
// - Feature entitlements
//
// IMPORTANT
// ------------------------------------------------------------
// This file contains application-level plan definitions only.
//
// It does NOT:
// - access MongoDB
// - access Razorpay
// - create payments
// - create subscriptions
// - authenticate users
// - authorize requests
// - consume AI credits
// - enforce resume limits
// - handle HTTP requests
//
// Enforcement belongs to the service layer.
//
// Payment-provider identifiers belong to the payment-provider
// integration layer and MUST NOT be stored here.
//
// The frontend may receive a sanitized public representation
// of these definitions, but the frontend MUST NEVER be trusted
// to enforce these rules.
// ============================================================

// ============================================================
// Plan IDs
// ============================================================
//
// These IDs are internal application identifiers.
//
// IMPORTANT:
// Once used in persisted subscription records, these values
// should be treated as stable identifiers.
// ============================================================

const PLAN_IDS = Object.freeze({
    FREE: "free",
    PRO: "pro",
    PRO_PLUS: "pro_plus",
});

// ============================================================
// Billing Option IDs
// ============================================================
//
// Billing options identify a specific commercial offering.
//
// Example:
//
//     PRO + MONTHLY
//     PRO + THREE_MONTH
//
// These are intentionally separate from the plan ID.
// ============================================================

const BILLING_PERIODS = Object.freeze({
    MONTHLY: "monthly",
    THREE_MONTH: "three_month",
    SIX_MONTH: "six_month",
    YEARLY: "yearly",
});

// ============================================================
// Currency
// ============================================================

const CURRENCY = "INR";

// ============================================================
// Currency Conversion
// ============================================================
//
// Razorpay expects monetary amounts in the smallest currency
// unit.
//
// For INR:
//
//     ₹1 = 100 paise
//
// The application stores the human-readable amount as INR and
// derives the provider amount through this helper.
// ============================================================

const CURRENCY_MINOR_UNIT_MULTIPLIER = 100;

// ============================================================
// AI Entitlements
// ============================================================
//
// AI access is measured using application-defined credits.
//
// A credit is NOT necessarily equal to one Gemini API request.
//
// Different AI operations can consume different numbers of
// credits.
//
// Examples:
//
//     small rewrite       → 1 credit
//     generation          → 2 credits
//     larger generation   → more credits
//
// The AI service is responsible for deciding the actual cost
// of an operation.
//
// IMPORTANT:
// ------------------------------------------------------------
// Pro Plus is intentionally NOT represented as mathematically
// unlimited AI.
//
// A high allowance plus independent abuse/rate/cost protection
// prevents a compromised account or abusive client from causing
// uncontrolled provider costs.
// ============================================================

const AI_ENTITLEMENTS = Object.freeze({
    DISABLED: Object.freeze({
        enabled: false,
        creditsPerPeriod: 0,
    }),

    PRO: Object.freeze({
        enabled: true,
        creditsPerPeriod: 200,
    }),

    PRO_PLUS: Object.freeze({
        enabled: true,
        creditsPerPeriod: 2000,
    }),
});

// ============================================================
// Resume Entitlements
// ============================================================
//
// `null` means there is no plan-level resume-count entitlement
// limit.
//
// This does NOT mean the API has no abuse protection.
// Operational safeguards remain independent.
// ============================================================

const RESUME_ENTITLEMENTS = Object.freeze({
    FREE: 2,
    PRO: 4,
    PRO_PLUS: null,
});

// ============================================================
// Common Core Features
// ============================================================
//
// These are product capabilities rather than security rules.
//
// Whether a user can actually perform an operation is decided
// server-side by the entitlement/billing service.
// ============================================================

const CORE_FEATURES = Object.freeze({
    resumeEditing: true,
    resumePreview: true,
    resumeDownload: true,
    resumeSharing: true,

    templates: true,
    customization: true,

    photoUpload: true,

    publicResume: true,
});

// ============================================================
// Plan Definitions
// ============================================================

const PLANS = Object.freeze({
    [PLAN_IDS.FREE]: Object.freeze({
        id: PLAN_IDS.FREE,

        name: "Free",

        description:
            "Essential resume building with no subscription required.",

        currency: CURRENCY,

        resumeLimit:
            RESUME_ENTITLEMENTS.FREE,

        ai: AI_ENTITLEMENTS.DISABLED,

        features: Object.freeze({
            ...CORE_FEATURES,

            ai: false,
        }),

        access: Object.freeze({
            lifetimeCoreAccess: true,
        }),

        billingOptions: Object.freeze({}),
    }),

    [PLAN_IDS.PRO]: Object.freeze({
        id: PLAN_IDS.PRO,

        name: "Pro",

        description:
            "Advanced resume building with AI assistance.",

        currency: CURRENCY,

        resumeLimit:
            RESUME_ENTITLEMENTS.PRO,

        ai: AI_ENTITLEMENTS.PRO,

        features: Object.freeze({
            ...CORE_FEATURES,

            ai: true,
        }),

        access: Object.freeze({
            lifetimeCoreAccess: false,
        }),

        billingOptions: Object.freeze({
            [BILLING_PERIODS.MONTHLY]:
                Object.freeze({
                    id: "pro_monthly",

                    amount: 199,

                    amountMinor:
                        199 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 1,

                    recurring: true,
                }),

            [BILLING_PERIODS.THREE_MONTH]:
                Object.freeze({
                    id: "pro_three_month",

                    amount: 549,

                    amountMinor:
                        549 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 3,

                    recurring: false,
                }),

            [BILLING_PERIODS.SIX_MONTH]:
                Object.freeze({
                    id: "pro_six_month",

                    amount: 999,

                    amountMinor:
                        999 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 6,

                    recurring: false,
                }),

            [BILLING_PERIODS.YEARLY]:
                Object.freeze({
                    id: "pro_yearly",

                    amount: 1799,

                    amountMinor:
                        1799 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 12,

                    recurring: false,
                }),
        }),
    }),

    [PLAN_IDS.PRO_PLUS]: Object.freeze({
        id: PLAN_IDS.PRO_PLUS,

        name: "Pro Plus",

        description:
            "Complete CuratoCV access with high AI usage limits.",

        currency: CURRENCY,

        resumeLimit:
            RESUME_ENTITLEMENTS.PRO_PLUS,

        ai: AI_ENTITLEMENTS.PRO_PLUS,

        features: Object.freeze({
            ...CORE_FEATURES,

            ai: true,
        }),

        access: Object.freeze({
            lifetimeCoreAccess: false,
        }),

        billingOptions: Object.freeze({
            [BILLING_PERIODS.MONTHLY]:
                Object.freeze({
                    id: "pro_plus_monthly",

                    amount: 499,

                    amountMinor:
                        499 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 1,

                    recurring: true,
                }),

            [BILLING_PERIODS.THREE_MONTH]:
                Object.freeze({
                    id: "pro_plus_three_month",

                    amount: 1299,

                    amountMinor:
                        1299 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 3,

                    recurring: false,
                }),

            [BILLING_PERIODS.SIX_MONTH]:
                Object.freeze({
                    id: "pro_plus_six_month",

                    amount: 2399,

                    amountMinor:
                        2399 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 6,

                    recurring: false,
                }),

            [BILLING_PERIODS.YEARLY]:
                Object.freeze({
                    id: "pro_plus_yearly",

                    amount: 4499,

                    amountMinor:
                        4499 *
                        CURRENCY_MINOR_UNIT_MULTIPLIER,

                    currency: CURRENCY,

                    durationMonths: 12,

                    recurring: false,
                }),
        }),
    }),
});

// ============================================================
// Plan Validation
// ============================================================

/**
 * Determine whether a plan ID is supported.
 *
 * @param {unknown} planId
 * @returns {boolean}
 */
const isValidPlanId = (
    planId
) => {
    if (
        typeof planId !==
        "string"
    ) {
        return false;
    }

    return Object.prototype.hasOwnProperty.call(
        PLANS,
        planId
    );
};

// ============================================================
// Billing Period Validation
// ============================================================

/**
 * Determine whether a billing period is supported.
 *
 * @param {unknown} billingPeriod
 * @returns {boolean}
 */
const isValidBillingPeriod = (
    billingPeriod
) => {
    if (
        typeof billingPeriod !==
        "string"
    ) {
        return false;
    }

    return Object.values(
        BILLING_PERIODS
    ).includes(
        billingPeriod
    );
};

// ============================================================
// Billing Option Lookup
// ============================================================

/**
 * Retrieve a billing option for a plan.
 *
 * Returns null when the plan or billing period does not exist.
 *
 * @param {unknown} planId
 * @param {unknown} billingPeriod
 * @returns {Object|null}
 */
const getBillingOption = (
    planId,
    billingPeriod
) => {
    if (
        !isValidPlanId(
            planId
        )
    ) {
        return null;
    }

    if (
        !isValidBillingPeriod(
            billingPeriod
        )
    ) {
        return null;
    }

    return (
        PLANS[planId]
            .billingOptions
            ?.[billingPeriod] ||
        null
    );
};

// ============================================================
// Public Plan Lookup
// ============================================================

/**
 * Retrieve a complete internal plan definition.
 *
 * This function is intended for trusted backend code.
 *
 * Do NOT serialize the returned object directly to clients
 * without creating a public/sanitized representation.
// ============================================================

/**
 * @param {unknown} planId
 * @returns {Object|null}
 */
const getPlan = (
    planId
) => {
    if (
        !isValidPlanId(
            planId
        )
    ) {
        return null;
    }

    return PLANS[planId];
};

// ============================================================
// Resume Limit Lookup
// ============================================================

/**
 * Retrieve the resume limit for a plan.
 *
 * `null` means unlimited at the plan-entitlement level.
 *
 * @param {unknown} planId
 * @returns {number|null}
 */
const getResumeLimit = (
    planId
) => {
    const plan =
        getPlan(
            planId
        );

    if (!plan) {
        return null;
    }

    return plan.resumeLimit;
};

// ============================================================
// AI Entitlement Lookup
// ============================================================

/**
 * Retrieve AI entitlement information for a plan.
 *
 * @param {unknown} planId
 * @returns {Object|null}
 */
const getAIEntitlement = (
    planId
) => {
    const plan =
        getPlan(
            planId
        );

    if (!plan) {
        return null;
    }

    return plan.ai;
};

// ============================================================
// Export
// ============================================================

const plans = Object.freeze({
    currency:
        CURRENCY,

    planIds:
        PLAN_IDS,

    billingPeriods:
        BILLING_PERIODS,

    plans:
        PLANS,

    isValidPlanId,

    isValidBillingPeriod,

    getPlan,

    getBillingOption,

    getResumeLimit,

    getAIEntitlement,
});

export { PLAN_IDS, BILLING_PERIODS, PLANS };
export default plans;