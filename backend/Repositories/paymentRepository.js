import Payment from "../Models/Payment.js";

// ============================================================
// CuratoCV Payment Repository
// ============================================================
//
// Database-access layer for Payment documents.
//
// Responsibilities:
// - Persist payment records
// - Query payment records
// - Query provider references
// - Persist verified provider results
// - Persist refunds
// - Support webhook idempotency
// - Support payment reconciliation
//
// NOT responsible for:
// - Razorpay API calls
// - Signature verification
// - Pricing decisions
// - Subscription activation
// - Entitlement decisions
// - Authorization
// - HTTP handling
// - Email delivery
//
// Services decide WHAT should happen.
// Repositories decide HOW MongoDB is accessed.
//
// ============================================================

// ============================================================
// Constants
// ============================================================

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const normalizeLimit = (limit) => {
    const numericLimit = Number(limit);

    if (!Number.isInteger(numericLimit) || numericLimit <= 0) {
        return DEFAULT_LIMIT;
    }

    return Math.min(
        numericLimit,
        MAX_LIMIT,
    );
};

const normalizeSkip = (skip) => {
    const numericSkip = Number(skip);

    if (!Number.isInteger(numericSkip) || numericSkip < 0) {
        return 0;
    }

    return numericSkip;
};

const requireNonEmptyString = (
    value,
    fieldName,
) => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new TypeError(
            `${fieldName} must be a non-empty string.`,
        );
    }

    return value.trim();
};

// ============================================================
// Create
// ============================================================

const create = async (
    paymentData,
) => {
    if (
        !paymentData ||
        typeof paymentData !== "object"
    ) {
        throw new TypeError(
            "Payment data must be an object.",
        );
    }

    return Payment.create(
        paymentData,
    );
};

// ============================================================
// Find by ID
// ============================================================

const findById = async (
    paymentId,
) => {
    return Payment.findById(
        paymentId,
    );
};

// ============================================================
// Find by ID + User
// ============================================================

const findByIdAndUserId = async (
    paymentId,
    userId,
) => {
    return Payment.findOne({
        _id: paymentId,

        userId,
    });
};

// ============================================================
// Find User Payments
// ============================================================

const findAllByUserId = async (
    userId,
    limit = DEFAULT_LIMIT,
    skip = 0,
) => {
    return Payment.find({
        userId,
    })
        .sort({
            createdAt: -1,
            _id: -1,
        })
        .skip(
            normalizeSkip(skip),
        )
        .limit(
            normalizeLimit(limit),
        )
        .lean();
};

// ============================================================
// Find by Provider Order ID
// ============================================================

const findByProviderOrderId =
    async (
        providerOrderId,
    ) => {
        if (
            typeof providerOrderId !==
                "string" ||
            !providerOrderId.trim()
        ) {
            return null;
        }

        return Payment.findOne({
            providerOrderId:
                providerOrderId.trim(),
        });
    };

// ============================================================
// Find by Provider Payment ID
// ============================================================

const findByProviderPaymentId =
    async (
        providerPaymentId,
    ) => {
        if (
            typeof providerPaymentId !==
                "string" ||
            !providerPaymentId.trim()
        ) {
            return null;
        }

        return Payment.findOne({
            providerPaymentId:
                providerPaymentId.trim(),
        });
    };

// ============================================================
// Find by Provider + Payment ID
// ============================================================

const findByProviderPaymentReference =
    async (
        provider,
        providerPaymentId,
    ) => {
        if (
            typeof provider !==
                "string" ||
            typeof providerPaymentId !==
                "string" ||
            !provider.trim() ||
            !providerPaymentId.trim()
        ) {
            return null;
        }

        return Payment.findOne({
            provider:
                provider.trim(),

            providerPaymentId:
                providerPaymentId.trim(),
        });
    };

// ============================================================
// Find by Provider + Order ID
// ============================================================

const findByProviderOrderReference =
    async (
        provider,
        providerOrderId,
    ) => {
        if (
            typeof provider !==
                "string" ||
            typeof providerOrderId !==
                "string" ||
            !provider.trim() ||
            !providerOrderId.trim()
        ) {
            return null;
        }

        return Payment.findOne({
            provider:
                provider.trim(),

            providerOrderId:
                providerOrderId.trim(),
        });
    };

// ============================================================
// Find Subscription Payments
// ============================================================

const findAllBySubscriptionId =
    async (
        subscriptionId,
        limit = DEFAULT_LIMIT,
        skip = 0,
    ) => {
        return Payment.find({
            subscriptionId,
        })
            .sort({
                createdAt: -1,
                _id: -1,
            })
            .skip(
                normalizeSkip(skip),
            )
            .limit(
                normalizeLimit(limit),
            )
            .lean();
    };

// ============================================================
// Find Latest Subscription Payment
// ============================================================

const findLatestBySubscriptionId =
    async (
        subscriptionId,
    ) => {
        return Payment.findOne({
            subscriptionId,
        }).sort({
            createdAt: -1,
            _id: -1,
        });
    };

// ============================================================
// Find by Webhook Event ID
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
// This is a lookup helper.
//
// Cryptographic verification MUST happen before the event is
// trusted.
//
// The unique database index on:
//     provider + lastWebhookEventId
//
// provides an additional idempotency boundary.
// ============================================================

const findByWebhookEventId =
    async (
        provider,
        webhookEventId,
    ) => {
        if (
            typeof provider !==
                "string" ||
            typeof webhookEventId !==
                "string" ||
            !provider.trim() ||
            !webhookEventId.trim()
        ) {
            return null;
        }

        return Payment.findOne({
            provider:
                provider.trim(),

            lastWebhookEventId:
                webhookEventId.trim(),
        });
    };

// ============================================================
// Update by ID
// ============================================================
//
// WARNING:
// Generic update operations should only be called by trusted
// service-layer code.
//
// Financial identity fields such as:
// - userId
// - planId
// - billingPeriod
// - amountMinor
// - currency
// - provider
//
// should NOT be modified after payment creation.
//
// Prefer the focused update methods below.
// ============================================================

const updateById = async (
    paymentId,
    updateData,
) => {
    if (
        !updateData ||
        typeof updateData !== "object"
    ) {
        throw new TypeError(
            "Payment update data must be an object.",
        );
    }

    return Payment.findByIdAndUpdate(
        paymentId,

        {
            $set: updateData,
        },

        {
            new: true,

            runValidators: true,

            context: "query",
        },
    );
};

// ============================================================
// Update by ID + User
// ============================================================

const updateByIdAndUserId =
    async (
        paymentId,
        userId,
        updateData,
    ) => {
        if (
            !updateData ||
            typeof updateData !== "object"
        ) {
            throw new TypeError(
                "Payment update data must be an object.",
            );
        }

        return Payment.findOneAndUpdate(
            {
                _id:
                    paymentId,

                userId,
            },

            {
                $set: updateData,
            },

            {
                new: true,

                runValidators: true,

                context: "query",
            },
        );
    };

// ============================================================
// Update Payment Status
// ============================================================

const updateStatus = async (
    paymentId,
    status,
) => {
    return Payment.findByIdAndUpdate(
        paymentId,

        {
            $set: {
                status,
            },
        },

        {
            new: true,

            runValidators: true,

            context: "query",
        },
    );
};

// ============================================================
// Update Verified Provider Payment
// ============================================================

const updateProviderPayment =
    async (
        paymentId,
        paymentData,
    ) => {
        if (
            !paymentData ||
            typeof paymentData !== "object"
        ) {
            throw new TypeError(
                "Provider payment data must be an object.",
            );
        }

        const update = {};

        if (
            Object.prototype.hasOwnProperty.call(
                paymentData,
                "status",
            )
        ) {
            update.status =
                paymentData.status;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                paymentData,
                "providerPaymentId",
            )
        ) {
            update.providerPaymentId =
                paymentData.providerPaymentId;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                paymentData,
                "method",
            )
        ) {
            update.method =
                paymentData.method;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                paymentData,
                "paidAt",
            )
        ) {
            update.paidAt =
                paymentData.paidAt;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                paymentData,
                "failure",
            )
        ) {
            update.failure =
                paymentData.failure;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                paymentData,
                "lastWebhookEventId",
            )
        ) {
            update.lastWebhookEventId =
                paymentData.lastWebhookEventId;
        }

        if (
            Object.keys(update).length === 0
        ) {
            return Payment.findById(
                paymentId,
            );
        }

        return Payment.findByIdAndUpdate(
            paymentId,

            {
                $set: update,
            },

            {
                new: true,

                runValidators: true,

                context: "query",
            },
        );
    };

// ============================================================
// Record Refund
// ============================================================
//
// Refund amount is updated atomically.
//
// The query prevents:
//     refundedAmountMinor > amountMinor
//
// and prevents a concurrent refund from pushing the total
// refunded amount beyond the original payment amount.
//
// ============================================================

const recordRefund = async (
    paymentId,
    refundData,
) => {
    if (
        !refundData ||
        typeof refundData !== "object"
    ) {
        throw new TypeError(
            "Refund data must be an object.",
        );
    }

    if (
        !Number.isInteger(
            refundData.refundedAmountMinor,
        ) ||
        refundData.refundedAmountMinor <= 0
    ) {
        throw new TypeError(
            "Refunded amount must be a positive integer.",
        );
    }

    const refundAmount =
        refundData.refundedAmountMinor;

    const update = {
        $inc: {
            refundedAmountMinor:
                refundAmount,
        },

        $set: {
            status:
                refundData.status,

            "refund.providerRefundId":
                refundData.providerRefundId ??
                null,

            "refund.processedAt":
                refundData.processedAt ??
                new Date(),

            "refund.reason":
                refundData.reason ??
                null,
        },
    };

    return Payment.findOneAndUpdate(
        {
            _id:
                paymentId,

            status: {
                $in: [
                    Payment.statuses.CAPTURED,

                    Payment.statuses.PARTIALLY_REFUNDED,
                ],
            },

            $expr: {
                $lte: [
                    {
                        $add: [
                            "$refundedAmountMinor",

                            refundAmount,
                        ],
                    },

                    "$amountMinor",
                ],
            },
        },

        update,

        {
            new: true,

            runValidators: true,

            context: "query",
        },
    );
};

// ============================================================
// Attach Subscription
// ============================================================

const attachSubscription =
    async (
        paymentId,
        subscriptionId,
    ) => {
        return Payment.findByIdAndUpdate(
            paymentId,

            {
                $set: {
                    subscriptionId,
                },
            },

            {
                new: true,

                runValidators: true,

                context: "query",
            },
        );
    };

// ============================================================
// Set Webhook Event ID
// ============================================================

const setWebhookEventId =
    async (
        paymentId,
        webhookEventId,
    ) => {
        const normalizedEventId =
            requireNonEmptyString(
                webhookEventId,
                "Webhook event ID",
            );

        return Payment.findOneAndUpdate(
            {
                _id:
                    paymentId,

                $or: [
                    {
                        lastWebhookEventId:
                            null,
                    },

                    {
                        lastWebhookEventId:
                            {
                                $exists:
                                    false,
                            },
                    },
                ],
            },

            {
                $set: {
                    lastWebhookEventId:
                        normalizedEventId,
                },
            },

            {
                new: true,

                runValidators: true,

                context: "query",
            },
        );
    };

// ============================================================
// Find Pending Payments
// ============================================================

const findPendingBefore =
    async (
        cutoffDate,
        limit = DEFAULT_LIMIT,
    ) => {
        if (
            !(cutoffDate instanceof Date) ||
            Number.isNaN(
                cutoffDate.getTime(),
            )
        ) {
            throw new TypeError(
                "cutoffDate must be a valid Date.",
            );
        }

        return Payment.find({
            status:
                Payment.statuses.PENDING,

            createdAt: {
                $lte:
                    cutoffDate,
            },
        })
            .sort({
                createdAt: 1,
                _id: 1,
            })
            .limit(
                normalizeLimit(limit),
            )
            .lean();
    };

// ============================================================
// Find Failed Payments
// ============================================================

const findFailedBetween =
    async (
        startDate,
        endDate,
        limit = DEFAULT_LIMIT,
    ) => {
        if (
            !(startDate instanceof Date) ||
            Number.isNaN(
                startDate.getTime(),
            )
        ) {
            throw new TypeError(
                "startDate must be a valid Date.",
            );
        }

        if (
            !(endDate instanceof Date) ||
            Number.isNaN(
                endDate.getTime(),
            )
        ) {
            throw new TypeError(
                "endDate must be a valid Date.",
            );
        }

        if (
            endDate <
            startDate
        ) {
            throw new RangeError(
                "endDate cannot be before startDate.",
            );
        }

        return Payment.find({
            status:
                Payment.statuses.FAILED,

            createdAt: {
                $gte:
                    startDate,

                $lte:
                    endDate,
            },
        })
            .sort({
                createdAt: -1,
                _id: -1,
            })
            .limit(
                normalizeLimit(limit),
            )
            .lean();
    };

// ============================================================
// Count User Payments
// ============================================================

const countByUserId =
    async (
        userId,
    ) => {
        return Payment.countDocuments({
            userId,
        });
    };

// ============================================================
// Captured Amount
// ============================================================
//
// Returns both gross and net amounts.
//
// Net:
//
// captured - refunded
//
// ============================================================

const getCapturedAmountByUserId =
    async (
        userId,
    ) => {
        const result =
            await Payment.aggregate([
                {
                    $match: {
                        userId,

                        status: {
                            $in: [
                                Payment.statuses.CAPTURED,

                                Payment.statuses.PARTIALLY_REFUNDED,

                                Payment.statuses.REFUNDED,
                            ],
                        },
                    },
                },

                {
                    $group: {
                        _id: null,

                        totalAmountMinor: {
                            $sum:
                                "$amountMinor",
                        },

                        totalRefundedMinor: {
                            $sum:
                                "$refundedAmountMinor",
                        },
                    },
                },
            ]);

        if (
            !result.length
        ) {
            return {
                totalAmountMinor: 0,

                totalRefundedMinor: 0,

                netAmountMinor: 0,
            };
        }

        const totals =
            result[0];

        return {
            totalAmountMinor:
                totals.totalAmountMinor,

            totalRefundedMinor:
                totals.totalRefundedMinor,

            netAmountMinor:
                totals.totalAmountMinor -
                totals.totalRefundedMinor,
        };
    };

// ============================================================
// Delete by ID
// ============================================================
//
// Financial records should normally never be hard deleted.
//
// Keep this method only for controlled administrative or
// legally required data-retention workflows.
// ============================================================

const deleteById =
    async (
        paymentId,
    ) => {
        return Payment.findByIdAndDelete(
            paymentId,
        );
    };

// ============================================================
// Export
// ============================================================

const paymentRepository =
    Object.freeze({
        create,

        findById,

        findByIdAndUserId,

        findAllByUserId,

        findByProviderOrderId,

        findByProviderPaymentId,

        findByProviderPaymentReference,

        findByProviderOrderReference,

        findAllBySubscriptionId,

        findLatestBySubscriptionId,

        findByWebhookEventId,

        updateById,

        updateByIdAndUserId,

        updateStatus,

        updateProviderPayment,

        recordRefund,

        attachSubscription,

        setWebhookEventId,

        findPendingBefore,

        findFailedBetween,

        countByUserId,

        getCapturedAmountByUserId,

        deleteById,
    });

export default paymentRepository;