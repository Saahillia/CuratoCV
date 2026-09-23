import mongoose from "mongoose";
import plans from "../Constants/plans.js";

// ============================================================
// CuratoCV Payment Model
// ============================================================
//
// Represents an individual payment transaction.
//
// Responsibilities:
// - Persist payment transaction records
// - Persist historical plan/billing information
// - Persist provider transaction identifiers
// - Persist amount/currency
// - Track payment lifecycle
// - Track refunds
// - Support provider reconciliation
// - Support webhook idempotency
//
// NOT responsible for:
// - Creating Razorpay orders
// - Creating Razorpay subscriptions
// - Signature verification
// - Webhook processing
// - Subscription activation
// - Authorization
// - Email delivery
// - HTTP handling
//
// IMPORTANT
// ------------------------------------------------------------
// Payment records are historical financial records.
//
// The amount, currency, plan and billing option stored here are
// snapshots of what the customer purchased at that time.
//
// Do NOT make historical payment validity depend on the current
// pricing configuration in plans.js.
// ============================================================

// ============================================================
// Constants
// ============================================================

const PLAN_ID_VALUES =
    Object.values(
        plans.planIds,
    );

const BILLING_PERIOD_VALUES =
    Object.values(
        plans.billingPeriods,
    );

// ============================================================
// Payment Status
// ============================================================

const PAYMENT_STATUS =
    Object.freeze({
        CREATED: "created",
        PENDING: "pending",
        AUTHORIZED: "authorized",
        CAPTURED: "captured",
        FAILED: "failed",
        REFUNDED: "refunded",
        PARTIALLY_REFUNDED: "partially_refunded",
        CANCELLED: "cancelled",
    });

const PAYMENT_STATUS_VALUES =
    Object.values(
        PAYMENT_STATUS,
    );

// ============================================================
// Payment Provider
// ============================================================

const PAYMENT_PROVIDER =
    Object.freeze({
        RAZORPAY: "razorpay",
    });

const PAYMENT_PROVIDER_VALUES =
    Object.values(
        PAYMENT_PROVIDER,
    );

// ============================================================
// Payment Method
// ============================================================

const PAYMENT_METHOD =
    Object.freeze({
        CARD: "card",
        UPI: "upi",
        NETBANKING: "netbanking",
        WALLET: "wallet",
        EMI: "emi",
        OTHER: "other",
    });

const PAYMENT_METHOD_VALUES =
    Object.values(
        PAYMENT_METHOD,
    );

// ============================================================
// Payment Schema
// ============================================================

const paymentSchema =
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
                    "Payment user is required.",
                ],

                index: true,
            },

            // ==================================================
            // Subscription
            // ==================================================

            subscriptionId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Subscription",

                default: null,

                index: true,
            },

            // ==================================================
            // Historical Product Snapshot
            // ==================================================

            planId: {
                type: String,

                required: [
                    true,
                    "Payment plan is required.",
                ],

                enum: {
                    values:
                        PLAN_ID_VALUES,

                    message:
                        "Invalid payment plan.",
                },

                index: true,
            },

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
            // Provider
            // ==================================================

            provider: {
                type: String,

                required: [
                    true,
                    "Payment provider is required.",
                ],

                enum: {
                    values:
                        PAYMENT_PROVIDER_VALUES,

                    message:
                        "Invalid payment provider.",
                },

                index: true,
            },

            // ==================================================
            // Provider References
            // ==================================================

            providerOrderId: {
                type: String,

                default: null,

                trim: true,

                maxlength: 255,

                index: true,
            },

            providerPaymentId: {
                type: String,

                default: null,

                trim: true,

                maxlength: 255,

                index: true,
            },

            providerSubscriptionId: {
                type: String,

                default: null,

                trim: true,

                maxlength: 255,

                index: true,
            },

            // ==================================================
            // Monetary Snapshot
            // ==================================================
            //
            // INR is represented in paise.
            //
            // Example:
            //
            // ₹199 = 19900
            //
            // These values are snapshots and must never be
            // recalculated from today's pricing configuration.
            // ==================================================

            amountMinor: {
                type: Number,

                required: [
                    true,
                    "Payment amount is required.",
                ],

                min: [
                    1,
                    "Payment amount must be greater than zero.",
                ],

                max: [
                    1000000000,
                    "Payment amount exceeds the allowed limit.",
                ],
            },

            refundedAmountMinor: {
                type: Number,

                default: 0,

                min: [
                    0,
                    "Refunded amount cannot be negative.",
                ],

                max: [
                    1000000000,
                    "Refunded amount exceeds the allowed limit.",
                ],
            },

            currency: {
                type: String,

                required: [
                    true,
                    "Payment currency is required.",
                ],

                enum: [
                    "INR",
                ],

                uppercase: true,

                minlength: 3,

                maxlength: 3,
            },

            // ==================================================
            // Payment Status
            // ==================================================

            status: {
                type: String,

                required: [
                    true,
                    "Payment status is required.",
                ],

                enum: {
                    values:
                        PAYMENT_STATUS_VALUES,

                    message:
                        "Invalid payment status.",
                },

                default:
                    PAYMENT_STATUS.CREATED,

                index: true,
            },

            // ==================================================
            // Payment Method
            // ==================================================

            method: {
                type: String,

                default: null,

                enum: {
                    values: [
                        null,
                        ...PAYMENT_METHOD_VALUES,
                    ],

                    message:
                        "Invalid payment method.",
                },

                index: true,
            },

            // ==================================================
            // Provider Payment Timestamp
            // ==================================================

            paidAt: {
                type: Date,

                default: null,

                index: true,
            },

            // ==================================================
            // Failure Information
            // ==================================================

            failure: {
                code: {
                    type: String,

                    default: null,

                    trim: true,

                    maxlength: 120,
                },

                reason: {
                    type: String,

                    default: null,

                    trim: true,

                    maxlength: 500,
                },

                description: {
                    type: String,

                    default: null,

                    trim: true,

                    maxlength: 1000,
                },
            },

            // ==================================================
            // Refund Information
            // ==================================================

            refund: {
                providerRefundId: {
                    type: String,

                    default: null,

                    trim: true,

                    maxlength: 255,

                    index: true,
                },

                processedAt: {
                    type: Date,

                    default: null,
                },

                reason: {
                    type: String,

                    default: null,

                    trim: true,

                    maxlength: 500,
                },
            },

            // ==================================================
            // Webhook Idempotency
            // ==================================================

            lastWebhookEventId: {
                type: String,

                default: null,

                trim: true,

                maxlength: 255,
            },

            // ==================================================
            // Provider Metadata
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

// User payment history

paymentSchema.index(
    {
        userId: 1,
        createdAt: -1,
    },
    {
        name:
            "payment_user_created_at",
    },
);

// Subscription payment history

paymentSchema.index(
    {
        subscriptionId: 1,
        createdAt: -1,
    },
    {
        name:
            "payment_subscription_created_at",
    },
);

// Provider order lookup

paymentSchema.index(
    {
        provider: 1,
        providerOrderId: 1,
    },
    {
        unique: true,

        sparse: true,

        name:
            "payment_provider_order_unique",
    },
);

// Provider payment lookup

paymentSchema.index(
    {
        provider: 1,
        providerPaymentId: 1,
    },
    {
        unique: true,

        sparse: true,

        name:
            "payment_provider_payment_unique",
    },
);

// Webhook event idempotency

paymentSchema.index(
    {
        provider: 1,
        lastWebhookEventId: 1,
    },
    {
        unique: true,

        sparse: true,

        name:
            "payment_provider_webhook_event_unique",
    },
);

// Payment reconciliation

paymentSchema.index(
    {
        status: 1,
        createdAt: -1,
    },
    {
        name:
            "payment_status_created_at",
    },
);

// ============================================================
// Validation
// ============================================================
//
// Only validate structural consistency here.
//
// Commercial pricing validation belongs to paymentService
// because historical payment records must remain valid even
// after plans.js pricing changes.
// ============================================================

paymentSchema.pre(
    "validate",
    function (next) {
        next = typeof next === "function" ? next : (err) => { if (err) throw err; };
        // ----------------------------------------------------
        // Free plan
        // ----------------------------------------------------

        if (
            this.planId ===
            plans.planIds.FREE
        ) {
            return next(
                new Error(
                    "Free plan cannot be represented as a paid payment.",
                ),
            );
        }

        // ----------------------------------------------------
        // Paid plan requirements
        // ----------------------------------------------------

        if (
            !this.billingOptionId ||
            !this.billingPeriod
        ) {
            return next(
                new Error(
                    "Paid payments require a billing option and billing period.",
                ),
            );
        }

        // ----------------------------------------------------
        // Billing period validity
        // ----------------------------------------------------

        if (
            !BILLING_PERIOD_VALUES.includes(
                this.billingPeriod,
            )
        ) {
            return next(
                new Error(
                    "Invalid payment billing period.",
                ),
            );
        }

        // ----------------------------------------------------
        // Provider consistency
        // ----------------------------------------------------

        if (
            this.providerPaymentId &&
            !this.provider
        ) {
            return next(
                new Error(
                    "Provider payment ID requires a payment provider.",
                ),
            );
        }

        if (
            this.providerOrderId &&
            !this.provider
        ) {
            return next(
                new Error(
                    "Provider order ID requires a payment provider.",
                ),
            );
        }

        if (
            this.providerSubscriptionId &&
            !this.provider
        ) {
            return next(
                new Error(
                    "Provider subscription ID requires a payment provider.",
                ),
            );
        }

        // ----------------------------------------------------
        // Refund consistency
        // ----------------------------------------------------

        if (
            this.refundedAmountMinor >
            this.amountMinor
        ) {
            return next(
                new Error(
                    "Refunded amount cannot exceed payment amount.",
                ),
            );
        }

        // ----------------------------------------------------
        // Payment timestamp
        // ----------------------------------------------------

        if (
            this.paidAt &&
            this.paidAt > new Date()
        ) {
            return next(
                new Error(
                    "Payment paidAt cannot be in the future.",
                ),
            );
        }

        // ----------------------------------------------------
        // Status/refund consistency
        // ----------------------------------------------------

        if (
            this.status ===
                PAYMENT_STATUS.REFUNDED &&
            this.refundedAmountMinor !==
                this.amountMinor
        ) {
            return next(
                new Error(
                    "A fully refunded payment must have the full amount refunded.",
                ),
            );
        }

        if (
            this.status ===
                PAYMENT_STATUS.PARTIALLY_REFUNDED &&
            (
                this.refundedAmountMinor <= 0 ||
                this.refundedAmountMinor >=
                    this.amountMinor
            )
        ) {
            return next(
                new Error(
                    "Partially refunded payments must have a partial refund amount.",
                ),
            );
        }

        return next();
    },
);

// ============================================================
// Serialization
// ============================================================

paymentSchema.methods.toJSON =
    function () {
        const payment =
            this.toObject();

        delete payment.providerMetadata;

        return payment;
    };

// ============================================================
// Static Constants
// ============================================================

paymentSchema.statics.statuses =
    PAYMENT_STATUS;

paymentSchema.statics.providers =
    PAYMENT_PROVIDER;

paymentSchema.statics.methods =
    PAYMENT_METHOD;

// ============================================================
// Model
// ============================================================

const Payment =
    mongoose.models.Payment ||
    mongoose.model(
        "Payment",
        paymentSchema,
    );

// ============================================================
// Export
// ============================================================

export default Payment;