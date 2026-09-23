import mongoose from "mongoose";

import plans from "../../../../backend/Constants/plans.js";

// ============================================================
// CuratoCV Subscription Model
// ============================================================
//
// Represents a user's paid subscription and entitlement period.
//
// Responsibilities:
// - Persist subscription state
// - Persist CuratoCV plan information
// - Persist purchased billing option
// - Persist payment-provider references
// - Track entitlement periods
// - Track cancellation state
// - Track AI-credit allocation for the current period
//
// NOT responsible for:
// - Creating Razorpay orders/subscriptions
// - Processing payments
// - Verifying payment signatures
// - Processing webhooks
// - Authorization
// - Resume-limit enforcement
// - AI-credit authorization
// - Sending emails
// - HTTP request/response handling
//
// Those responsibilities belong to the appropriate service,
// repository, controller, and middleware layers.
//
// ============================================================

// ============================================================
// Plan / Billing Constants
// ============================================================

const PLAN_ID_VALUES = Object.freeze(
    Object.values(
        plans.planIds,
    ),
);

const BILLING_PERIOD_VALUES = Object.freeze(
    Object.values(
        plans.billingPeriods,
    ),
);

// ============================================================
// Subscription Status
// ============================================================

const SUBSCRIPTION_STATUS =
    Object.freeze({
        ACTIVE: "active",
        PENDING: "pending",
        PAUSED: "paused",
        CANCELLED: "cancelled",
        EXPIRED: "expired",
        FAILED: "failed",
    });

const SUBSCRIPTION_STATUS_VALUES =
    Object.freeze(
        Object.values(
            SUBSCRIPTION_STATUS,
        ),
    );

// ============================================================
// Billing Provider
// ============================================================

const BILLING_PROVIDER =
    Object.freeze({
        RAZORPAY: "razorpay",
    });

const BILLING_PROVIDER_VALUES =
    Object.freeze(
        Object.values(
            BILLING_PROVIDER,
        ),
    );

// ============================================================
// Subscription Schema
// ============================================================

const subscriptionSchema =
    new mongoose.Schema(
        {
            // ==================================================
            // Ownership
            // ==================================================

            userId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: [
                    true,
                    "Subscription user is required.",
                ],

                index: true,
            },

            // ==================================================
            // CuratoCV Plan
            // ==================================================

            planId: {
                type: String,

                required: [
                    true,
                    "Subscription plan is required.",
                ],

                enum: {
                    values:
                        PLAN_ID_VALUES,

                    message:
                        "Invalid subscription plan.",
                },

                index: true,
            },

            // ==================================================
            // Billing Option
            // ==================================================
            //
            // Example:
            //
            // pro_monthly
            // pro_three_month
            // pro_six_month
            // pro_yearly
            //
            // Free users do not have a paid billing option.
            // ==================================================

            billingOptionId: {
                type: String,

                default: null,

                trim: true,

                maxlength: 100,

                index: true,
            },

            billingPeriod: {
                type: String,

                default: null,

                enum: {
                    values:
                        BILLING_PERIOD_VALUES,

                    message:
                        "Invalid billing period.",
                },

                index: true,
            },

            // ==================================================
            // Payment Provider
            // ==================================================

            provider: {
                type: String,

                default: null,

                enum: {
                    values: [
                        null,
                        ...BILLING_PROVIDER_VALUES,
                    ],

                    message:
                        "Invalid billing provider.",
                },

                index: true,
            },

            // ==================================================
            // Provider Subscription Reference
            // ==================================================
            //
            // Used for recurring provider subscriptions.
            //
            // Prepaid plans can legitimately have no provider
            // subscription ID.
            // ==================================================

            providerSubscriptionId: {
                type: String,

                default: null,

                trim: true,

                maxlength: 255,

                index: true,
            },

            // ==================================================
            // Provider Customer Reference
            // ==================================================

            providerCustomerId: {
                type: String,

                default: null,

                trim: true,

                maxlength: 255,

                index: true,
            },

            // ==================================================
            // Subscription Status
            // ==================================================

            status: {
                type: String,

                required: [
                    true,
                    "Subscription status is required.",
                ],

                enum: {
                    values:
                        SUBSCRIPTION_STATUS_VALUES,

                    message:
                        "Invalid subscription status.",
                },

                default:
                    SUBSCRIPTION_STATUS.PENDING,

                index: true,
            },

            // ==================================================
            // Current Entitlement Period
            // ==================================================

            currentPeriodStart: {
                type: Date,

                default: null,

                index: true,
            },

            currentPeriodEnd: {
                type: Date,

                default: null,

                index: true,
            },

            // ==================================================
            // Subscription Lifecycle
            // ==================================================

            startedAt: {
                type: Date,

                default: null,

                index: true,
            },

            expiresAt: {
                type: Date,

                default: null,

                index: true,
            },

            // ==================================================
            // Cancellation
            // ==================================================

            cancelAtPeriodEnd: {
                type: Boolean,

                default: false,
            },

            cancelledAt: {
                type: Date,

                default: null,
            },

            // ==================================================
            // AI Credit Period
            // ==================================================
            //
            // These values represent the AI allowance granted
            // for the current billing/entitlement period.
            //
            // Credit consumption MUST be performed atomically
            // by the service/repository layer.
            // ==================================================

            aiCreditsPeriodStart: {
                type: Date,

                default: null,
            },

            aiCreditsPeriodEnd: {
                type: Date,

                default: null,
            },

            aiCreditsGranted: {
                type: Number,

                default: 0,

                min: [
                    0,
                    "AI credits granted cannot be negative.",
                ],

                max: [
                    1000000,
                    "AI credits granted exceed the allowed limit.",
                ],
            },

            aiCreditsUsed: {
                type: Number,

                default: 0,

                min: [
                    0,
                    "AI credits used cannot be negative.",
                ],

                max: [
                    1000000,
                    "AI credits used exceed the allowed limit.",
                ],
            },

            // ==================================================
            // Latest Payment
            // ==================================================

            latestPaymentId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Payment",

                default: null,

                index: true,
            },

            // ==================================================
            // Provider Metadata
            // ==================================================
            //
            // Small reconciliation-safe metadata only.
            //
            // NEVER store:
            // - API secrets
            // - webhook secrets
            // - card numbers
            // - CVV
            // - authentication credentials
            //
            // ==================================================

            providerMetadata: {
                type: Map,

                of: String,

                default: undefined,
            },
        },
        {
            timestamps: true,

            minimize: false,

            strict: true,

            versionKey: "__v",
        },
    );

// ============================================================
// Indexes
// ============================================================
//
// These indexes support:
//
// - User subscription lookup
// - Provider webhook reconciliation
// - Expiration processing
// - Current subscription lookup
// - Lifecycle processing
//
// ============================================================

// ------------------------------------------------------------
// User + Status
// ------------------------------------------------------------

subscriptionSchema.index(
    {
        userId: 1,
        status: 1,
    },
    {
        name:
            "subscription_user_status",
    },
);

// ------------------------------------------------------------
// Provider Subscription Reference
// ------------------------------------------------------------
//
// Sparse because prepaid purchases may not have a provider
// subscription ID.
//
// ============================================================

subscriptionSchema.index(
    {
        provider: 1,
        providerSubscriptionId: 1,
    },
    {
        name:
            "subscription_provider_reference",

        sparse: true,
    },
);

// ------------------------------------------------------------
// Status + Current Period End
// ------------------------------------------------------------

subscriptionSchema.index(
    {
        status: 1,
        currentPeriodEnd: 1,
    },
    {
        name:
            "subscription_status_period_end",
    },
);

// ------------------------------------------------------------
// Status + Expiration
// ------------------------------------------------------------

subscriptionSchema.index(
    {
        status: 1,
        expiresAt: 1,
    },
    {
        name:
            "subscription_status_expiry",
    },
);

// ============================================================
// Current Subscription Uniqueness
// ============================================================
//
// A user should have at most one current paid subscription.
//
// IMPORTANT:
// `pending` is deliberately NOT included.
//
// A pending checkout can become abandoned. If pending were
// included in this unique index, an abandoned checkout could
// prevent the user from starting a new checkout.
//
// The service layer is responsible for cleaning up stale
// pending subscriptions.
//
// ============================================================

subscriptionSchema.index(
    {
        userId: 1,
    },
    {
        unique: true,

        name:
            "subscription_one_current_user_subscription",

        partialFilterExpression: {
            status: {
                $in: [
                    SUBSCRIPTION_STATUS.ACTIVE,
                    SUBSCRIPTION_STATUS.PAUSED,
                ],
            },
        },
    },
);

// ============================================================
// Validation
// ============================================================

subscriptionSchema.pre(
    "validate",
    function (next) {
        next = typeof next === "function" ? next : (err) => { if (err) throw err; };
        // ====================================================
        // Free Plan
        // ====================================================

        if (
            this.planId ===
            plans.planIds.FREE
        ) {
            if (
                this.billingOptionId !== null ||
                this.billingPeriod !== null
            ) {
                return next(
                    new Error(
                        "Free subscriptions cannot have a paid billing option.",
                    ),
                );
            }

            if (
                this.provider !== null ||
                this.providerSubscriptionId !== null ||
                this.providerCustomerId !== null
            ) {
                return next(
                    new Error(
                        "Free subscriptions cannot have payment-provider references.",
                    ),
                );
            }

            if (
                this.aiCreditsGranted !== 0 ||
                this.aiCreditsUsed !== 0
            ) {
                return next(
                    new Error(
                        "Free subscriptions cannot contain AI credits.",
                    ),
                );
            }
        }

        // ====================================================
        // Paid Plans
        // ====================================================

        if (
            this.planId !==
            plans.planIds.FREE
        ) {
            if (
                !this.billingOptionId ||
                !this.billingPeriod
            ) {
                return next(
                    new Error(
                        "Paid subscriptions require a billing option and billing period.",
                    ),
                );
            }

            const billingOption =
                plans.getBillingOption(
                    this.planId,
                    this.billingPeriod,
                );

            if (
                !billingOption
            ) {
                return next(
                    new Error(
                        "Billing option does not belong to the selected plan.",
                    ),
                );
            }

            if (
                billingOption.id !==
                this.billingOptionId
            ) {
                return next(
                    new Error(
                        "Billing option ID does not match the selected plan and billing period.",
                    ),
                );
            }

            if (
                !this.provider
            ) {
                return next(
                    new Error(
                        "Paid subscriptions require a billing provider.",
                    ),
                );
            }
        }

        // ====================================================
        // Provider Reference Consistency
        // ====================================================

        if (
            this.providerSubscriptionId &&
            !this.provider
        ) {
            return next(
                new Error(
                    "Provider subscription reference requires a billing provider.",
                ),
            );
        }

        if (
            this.providerCustomerId &&
            !this.provider
        ) {
            return next(
                new Error(
                    "Provider customer reference requires a billing provider.",
                ),
            );
        }

        // ====================================================
        // Period Consistency
        // ====================================================

        if (
            this.currentPeriodStart &&
            this.currentPeriodEnd &&
            this.currentPeriodEnd <=
                this.currentPeriodStart
        ) {
            return next(
                new Error(
                    "Subscription period end must be after period start.",
                ),
            );
        }

        // ====================================================
        // Start / Expiry Consistency
        // ====================================================

        if (
            this.startedAt &&
            this.expiresAt &&
            this.expiresAt <
                this.startedAt
        ) {
            return next(
                new Error(
                    "Subscription expiry cannot occur before subscription start.",
                ),
            );
        }

        // ====================================================
        // Cancellation Consistency
        // ====================================================

        if (
            this.cancelAtPeriodEnd &&
            !this.cancelledAt
        ) {
            // Cancellation has been requested but the actual
            // cancellation timestamp has not necessarily been
            // recorded yet.
            //
            // Therefore this is intentionally allowed.
        }

        if (
            this.cancelledAt &&
            !this.cancelAtPeriodEnd &&
            this.status ===
                SUBSCRIPTION_STATUS.ACTIVE
        ) {
            return next(
                new Error(
                    "An active subscription with a cancellation timestamp must be marked for cancellation.",
                ),
            );
        }

        // ====================================================
        // AI Credit Consistency
        // ====================================================

        if (
            this.aiCreditsUsed >
            this.aiCreditsGranted
        ) {
            return next(
                new Error(
                    "AI credits used cannot exceed granted credits.",
                ),
            );
        }

        if (
            this.aiCreditsPeriodStart &&
            this.aiCreditsPeriodEnd &&
            this.aiCreditsPeriodEnd <=
                this.aiCreditsPeriodStart
        ) {
            return next(
                new Error(
                    "AI credit period end must be after AI credit period start.",
                ),
            );
        }

        // ====================================================
        // AI Credit Period Requirement
        // ====================================================
        //
        // If credits exist, their period must also exist.
        // ====================================================

        if (
            this.aiCreditsGranted > 0 &&
            (
                !this.aiCreditsPeriodStart ||
                !this.aiCreditsPeriodEnd
            )
        ) {
            return next(
                new Error(
                    "AI credit period is required when AI credits are granted.",
                ),
            );
        }

        return next();
    },
);

// ============================================================
// JSON Serialization
// ============================================================
//
// Provider metadata is internal reconciliation data and should
// not accidentally become part of the public API response.
//
// Controllers/services should still prefer explicit DTOs for
// public responses.
// ============================================================

subscriptionSchema.virtual("aiCredits").get(function () {
    const granted = this.aiCreditsGranted || 0;
    const used = this.aiCreditsUsed || 0;
    return {
        available: Math.max(0, granted - used),
        consumed: used,
        granted,
        resetAt: this.aiCreditsPeriodEnd,
    };
});

subscriptionSchema.virtual("startDate").get(function () {
    return this.startedAt || this.currentPeriodStart;
});

subscriptionSchema.virtual("endDate").get(function () {
    return this.expiresAt || this.currentPeriodEnd;
});

subscriptionSchema.set("toObject", { virtuals: true });
subscriptionSchema.set("toJSON", { virtuals: true });

subscriptionSchema.methods.toJSON =
    function () {
        const subscription =
            this.toObject();

        delete subscription.providerMetadata;

        return subscription;
    };

// ============================================================
// Static Constants
// ============================================================

subscriptionSchema.statics.statuses =
    SUBSCRIPTION_STATUS;

subscriptionSchema.statics.providers =
    BILLING_PROVIDER;

// ============================================================
// Model
// ============================================================
//
// Reuse an already compiled model during development/testing.
// ============================================================

const Subscription =
    mongoose.models.Subscription ||
    mongoose.model(
        "Subscription",
        subscriptionSchema,
    );

// ============================================================
// Export
// ============================================================

export default Subscription;