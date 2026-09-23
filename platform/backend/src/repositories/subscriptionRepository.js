import Subscription from "../models/Subscription.js";

// ============================================================
// CuratoCV Subscription Repository
// ============================================================
//
// Database-access layer for Subscription documents.
//
// Responsibilities:
// - Create subscriptions
// - Find subscriptions
// - Update subscriptions
// - Find current/active subscriptions
// - Find provider references
// - Perform atomic AI-credit operations
// - Support billing reconciliation
//
// NOT responsible for:
// - Authentication
// - Authorization decisions
// - HTTP req/res
// - Razorpay API calls
// - Webhook verification
// - Payment verification
// - Plan pricing decisions
// - Business workflows
// - Email delivery
//
// Services decide WHAT should happen.
// Repositories decide HOW MongoDB is accessed.
//
// ============================================================

// ============================================================
// Create
// ============================================================

const create = async (
    subscriptionData,
) => {
    return Subscription.create(
        subscriptionData,
    );
};

// ============================================================
// Find by ID
// ============================================================

const findById = async (
    subscriptionId,
) => {
    return Subscription.findById(
        subscriptionId,
    );
};

// ============================================================
// Find by ID + User
// ============================================================

const findByIdAndUserId = async (
    subscriptionId,
    userId,
) => {
    return Subscription.findOne({
        _id: subscriptionId,

        userId,
    });
};

// ============================================================
// Find Current Subscription
// ============================================================
//
// A current subscription means a subscription currently capable
// of providing paid entitlements.
//
// Pending is intentionally excluded.
//
// A pending subscription represents an unfinished checkout and
// MUST NOT grant:
// - premium resume limits
// - AI credits
// - premium features
//
// ============================================================

const findCurrentByUserId = async (
    userId,
) => {
    return Subscription.findOne({
        userId,

        status: {
            $in: [
                Subscription.statuses.ACTIVE,

                Subscription.statuses.PAUSED,
            ],
        },
    }).sort({
        createdAt: -1,
    });
};

// ============================================================
// Find Active Subscription
// ============================================================

const findActiveByUserId = async (
    userId,
) => {
    return Subscription.findOne({
        userId,

        status:
            Subscription.statuses.ACTIVE,
    }).sort({
        createdAt: -1,
    });
};

// ============================================================
// Find by Provider Subscription ID
// ============================================================

const findByProviderSubscriptionId =
    async (
        providerSubscriptionId,
    ) => {
        if (
            typeof providerSubscriptionId !==
                "string" ||
            !providerSubscriptionId.trim()
        ) {
            return null;
        }

        return Subscription.findOne({
            providerSubscriptionId:
                providerSubscriptionId.trim(),
        });
    };

// ============================================================
// Find by Provider Reference
// ============================================================

const findByProviderReference =
    async (
        provider,
        providerSubscriptionId,
    ) => {
        if (
            typeof provider !==
                "string" ||
            typeof providerSubscriptionId !==
                "string" ||
            !provider.trim() ||
            !providerSubscriptionId.trim()
        ) {
            return null;
        }

        return Subscription.findOne({
            provider:
                provider.trim(),

            providerSubscriptionId:
                providerSubscriptionId.trim(),
        });
    };

// ============================================================
// Find by User + Provider Reference
// ============================================================

const findByUserAndProviderReference =
    async (
        userId,
        provider,
        providerSubscriptionId,
    ) => {
        if (
            typeof provider !==
                "string" ||
            typeof providerSubscriptionId !==
                "string" ||
            !provider.trim() ||
            !providerSubscriptionId.trim()
        ) {
            return null;
        }

        return Subscription.findOne({
            userId,

            provider:
                provider.trim(),

            providerSubscriptionId:
                providerSubscriptionId.trim(),
        });
    };

// ============================================================
// Find by Latest Payment
// ============================================================

const findByLatestPaymentId =
    async (
        paymentId,
    ) => {
        return Subscription.findOne({
            latestPaymentId:
                paymentId,
        });
    };

// ============================================================
// Update by ID
// ============================================================

const updateById = async (
    subscriptionId,
    updateData,
) => {
    return Subscription.findByIdAndUpdate(
        subscriptionId,

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
        subscriptionId,
        userId,
        updateData,
    ) => {
        return Subscription.findOneAndUpdate(
            {
                _id:
                    subscriptionId,

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
// Update Status
// ============================================================

const updateStatus = async (
    subscriptionId,
    status,
) => {
    return Subscription.findByIdAndUpdate(
        subscriptionId,

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
// Update Status + User
// ============================================================

const updateStatusByUserId =
    async (
        subscriptionId,
        userId,
        status,
    ) => {
        return Subscription.findOneAndUpdate(
            {
                _id:
                    subscriptionId,

                userId,
            },

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
// Update Current Billing Period
// ============================================================

const updateCurrentPeriod =
    async (
        subscriptionId,
        periodData,
    ) => {
        if (
            !periodData ||
            !periodData.currentPeriodStart ||
            !periodData.currentPeriodEnd
        ) {
            throw new TypeError(
                "Subscription period start and end are required.",
            );
        }

        const update = {
            currentPeriodStart:
                periodData.currentPeriodStart,

            currentPeriodEnd:
                periodData.currentPeriodEnd,
        };

        if (
            Object.prototype.hasOwnProperty.call(
                periodData,
                "expiresAt",
            )
        ) {
            update.expiresAt =
                periodData.expiresAt;
        }

        return Subscription.findByIdAndUpdate(
            subscriptionId,

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
// Update Cancellation
// ============================================================

const updateCancellation =
    async (
        subscriptionId,
        cancellationData,
    ) => {
        if (
            !cancellationData ||
            typeof cancellationData.cancelAtPeriodEnd !==
                "boolean"
        ) {
            throw new TypeError(
                "cancelAtPeriodEnd must be a boolean.",
            );
        }

        return Subscription.findByIdAndUpdate(
            subscriptionId,

            {
                $set: {
                    cancelAtPeriodEnd:
                        cancellationData.cancelAtPeriodEnd,

                    cancelledAt:
                        cancellationData.cancelledAt ??
                        null,
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
// Update AI Credits
// ============================================================
//
// Used when starting/resetting a new AI-credit period.
//
// Credit consumption itself uses the atomic method below.
// ============================================================

const updateAICredits =
    async (
        subscriptionId,
        creditData,
    ) => {
        if (
            !creditData ||
            !creditData.aiCreditsPeriodStart ||
            !creditData.aiCreditsPeriodEnd
        ) {
            throw new TypeError(
                "AI credit period start and end are required.",
            );
        }

        if (
            !Number.isInteger(
                creditData.aiCreditsGranted,
            ) ||
            creditData.aiCreditsGranted < 0
        ) {
            throw new TypeError(
                "AI credits granted must be a non-negative integer.",
            );
        }

        if (
            !Number.isInteger(
                creditData.aiCreditsUsed,
            ) ||
            creditData.aiCreditsUsed < 0
        ) {
            throw new TypeError(
                "AI credits used must be a non-negative integer.",
            );
        }

        if (
            creditData.aiCreditsUsed >
            creditData.aiCreditsGranted
        ) {
            throw new RangeError(
                "AI credits used cannot exceed granted credits.",
            );
        }

        return Subscription.findByIdAndUpdate(
            subscriptionId,

            {
                $set: {
                    aiCreditsPeriodStart:
                        creditData.aiCreditsPeriodStart,

                    aiCreditsPeriodEnd:
                        creditData.aiCreditsPeriodEnd,

                    aiCreditsGranted:
                        creditData.aiCreditsGranted,

                    aiCreditsUsed:
                        creditData.aiCreditsUsed,
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
// Atomic AI Credit Consumption
// ============================================================
//
// This is one of the most important methods in the billing
// architecture.
//
// The condition:
//
//     aiCreditsUsed + requestedCredits
//         <= aiCreditsGranted
//
// is evaluated INSIDE MongoDB.
//
// This prevents concurrent AI requests from both spending the
// same remaining credits.
//
// Returns:
//     Subscription document → success
//     null                 → insufficient credits/not found
//
// ============================================================

const consumeAICredits =
    async (
        subscriptionId,
        credits,
    ) => {
        if (
            !Number.isInteger(
                credits,
            ) ||
            credits <= 0
        ) {
            throw new TypeError(
                "AI credits must be a positive integer.",
            );
        }

        return Subscription.findOneAndUpdate(
            {
                _id:
                    subscriptionId,

                status:
                    Subscription.statuses.ACTIVE,

                $expr: {
                    $lte: [
                        {
                            $add: [
                                "$aiCreditsUsed",

                                credits,
                            ],
                        },

                        "$aiCreditsGranted",
                    ],
                },
            },

            {
                $inc: {
                    aiCreditsUsed:
                        credits,
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
// Set Latest Payment
// ============================================================

const setLatestPayment =
    async (
        subscriptionId,
        paymentId,
    ) => {
        return Subscription.findByIdAndUpdate(
            subscriptionId,

            {
                $set: {
                    latestPaymentId:
                        paymentId,
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
// Find Expiring Subscriptions
// ============================================================
//
// Used by scheduled notification/reconciliation jobs.
//
// ============================================================

const findExpiringBetween =
    async (
        startDate,
        endDate,
        limit = 100,
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

        return Subscription.find({
            status:
                Subscription.statuses.ACTIVE,

            currentPeriodEnd: {
                $gte:
                    startDate,

                $lte:
                    endDate,
            },
        })
            .sort({
                currentPeriodEnd: 1,
            })
            .limit(limit)
            .lean();
    };

// ============================================================
// Find Active Subscriptions Past Expiry
// ============================================================

const findActivePastExpiry =
    async (
        now = new Date(),
        limit = 100,
    ) => {
        if (
            !(now instanceof Date) ||
            Number.isNaN(
                now.getTime(),
            )
        ) {
            throw new TypeError(
                "now must be a valid Date.",
            );
        }

        return Subscription.find({
            status:
                Subscription.statuses.ACTIVE,

            $or: [
                {
                    expiresAt: {
                        $lte:
                            now,
                    },
                },

                {
                    currentPeriodEnd: {
                        $lte:
                            now,
                    },
                },
            ],
        })
            .sort({
                currentPeriodEnd: 1,
            })
            .limit(limit)
            .lean();
    };

// ============================================================
// Count User Subscriptions
// ============================================================

const countByUserId =
    async (
        userId,
    ) => {
        return Subscription.countDocuments({
            userId,
        });
    };

// ============================================================
// Delete by ID
// ============================================================
//
// Normally subscriptions should NOT be hard-deleted.
//
// This exists for controlled administrative/data-retention
// operations only.
// ============================================================

const deleteById =
    async (
        subscriptionId,
    ) => {
        return Subscription.findByIdAndDelete(
            subscriptionId,
        );
    };

// ============================================================
// Export
// ============================================================

const subscriptionRepository =
    Object.freeze({
        create,

        findById,

        findByIdAndUserId,

        findCurrentByUserId,

        findActiveByUserId,

        findByProviderSubscriptionId,

        findByProviderReference,

        findByUserAndProviderReference,

        findByLatestPaymentId,

        updateById,

        updateByIdAndUserId,

        updateStatus,

        updateStatusByUserId,

        updateCurrentPeriod,

        updateCancellation,

        updateAICredits,

        consumeAICredits,

        setLatestPayment,

        findExpiringBetween,

        findActivePastExpiry,

        countByUserId,

        deleteById,
    });

export default subscriptionRepository;