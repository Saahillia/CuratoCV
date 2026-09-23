// ============================================================
// CuratoCV Subscription Controller
// ============================================================
//
// HTTP/controller layer for subscription operations.
//
// Responsibilities:
// - Handle HTTP requests
// - Read authenticated user identity
// - Validate route/query parameters
// - Delegate business logic to billingService
// - Return consistent API responses
//
// NOT responsible for:
// - MongoDB access
// - Razorpay API calls
// - Payment verification
// - Pricing calculations
// - Entitlement calculations
// - AI credit accounting
// - Subscription state transitions
//
// Architecture:
//
// Frontend
//     ↓
// subscriptionRoutes
//     ↓
// authMiddleware
//     ↓
// subscriptionController
//     ↓
// billingService
//     ↓
// subscriptionRepository
//     ↓
// MongoDB
//
// ============================================================

import billingService from "../services/billingService.js";

import subscriptionRepository from "../repositories/subscriptionRepository.js";

// ============================================================
// Authentication Helper
// ============================================================

const getAuthenticatedUserId = (
    req,
) => {
    const userId =
        req.user?._id ??
        req.user?.id ??
        req.user?.userId ??
        req.auth?.userId;

    if (
        userId === undefined ||
        userId === null ||
        String(userId).trim() === ""
    ) {
        return null;
    }

    return String(
        userId,
    ).trim();
};

// ============================================================
// Error Helpers
// ============================================================

const resolveStatusCode = (
    error,
) => {
    if (
        Number.isInteger(
            error?.statusCode,
        )
    ) {
        return error.statusCode;
    }

    switch (
        error?.code
    ) {
        case "AUTHENTICATION_REQUIRED":
        case "UNAUTHORIZED":
            return 401;

        case "FORBIDDEN":
            return 403;

        case "INVALID_PLAN":
        case "INVALID_BILLING_OPTION":
        case "INVALID_BILLING_PERIOD":
        case "INVALID_SUBSCRIPTION":
        case "INVALID_CANCELLATION_STATE":
        case "SUBSCRIPTION_NOT_EXPIRED":
            return 400;

        case "SUBSCRIPTION_NOT_FOUND":
            return 404;

        case "CURRENT_SUBSCRIPTION_EXISTS":
        case "SUBSCRIPTION_ALREADY_ACTIVE":
            return 409;

        default:
            return 500;
    }
};

// ------------------------------------------------------------

const getPublicErrorMessage = (
    error,
) => {
    const safeMessages =
        new Map([
            [
                "AUTHENTICATION_REQUIRED",
                "Authentication is required.",
            ],

            [
                "UNAUTHORIZED",
                "Authentication is required.",
            ],

            [
                "FORBIDDEN",
                "You are not allowed to perform this action.",
            ],

            [
                "INVALID_PLAN",
                "The selected plan is invalid.",
            ],

            [
                "INVALID_BILLING_OPTION",
                "The selected billing option is invalid.",
            ],

            [
                "INVALID_BILLING_PERIOD",
                "The selected billing period is invalid.",
            ],

            [
                "SUBSCRIPTION_NOT_FOUND",
                "Subscription not found.",
            ],

            [
                "CURRENT_SUBSCRIPTION_EXISTS",
                "You already have a current subscription.",
            ],

            [
                "SUBSCRIPTION_ALREADY_ACTIVE",
                "You already have an active subscription.",
            ],

            [
                "INVALID_CANCELLATION_STATE",
                "This subscription cannot be cancelled in its current state.",
            ],

            [
                "SUBSCRIPTION_NOT_EXPIRED",
                "This subscription has not expired yet.",
            ],
        ]);

    const message =
        safeMessages.get(
            error?.code,
        );

    if (
        message
    ) {
        return message;
    }

    // In development, exposing the service error is useful.
    // In production, never expose internal implementation
    // details.
    if (
        process.env.NODE_ENV !==
        "production" &&
        typeof error?.message ===
            "string" &&
        error.message.trim()
    ) {
        return error.message;
    }

    return "An unexpected error occurred.";
};

// ------------------------------------------------------------

const handleControllerError = (
    error,
    res,
) => {
    console.error(
        "[SubscriptionController]",
        {
            code:
                error?.code,

            statusCode:
                error?.statusCode,

            message:
                error?.message,
        },
    );

    return res
        .status(
            resolveStatusCode(
                error,
            ),
        )
        .json({
            success:
                false,

            error: {
                code:
                    error?.code ||
                    "INTERNAL_SERVER_ERROR",

                message:
                    getPublicErrorMessage(
                        error,
                    ),
            },
        });
};

// ============================================================
// Public Plans
// ============================================================
//
// GET /api/subscriptions/plans
//
// No authentication required.
//
// The backend remains the authoritative source for pricing
// and feature definitions.
// ============================================================

const getPlans = (
    req,
    res,
) => {
    try {
        const publicPlans =
            billingService.getPublicPlans();

        return res
            .status(200)
            .json({
                success:
                    true,

                data:
                    publicPlans,
            });
    } catch (
        error
    ) {
        return handleControllerError(
            error,
            res,
        );
    }
};

// ============================================================
// Public Billing Option
// ============================================================
//
// GET /api/subscriptions/plans/:planId/:billingPeriod
//
// Example:
//
// /api/subscriptions/plans/pro/monthly
//
// No authentication required.
// ============================================================

const getBillingOption = (
    req,
    res,
) => {
    try {
        const {
            planId,
            billingPeriod,
        } =
            req.params;

        if (
            typeof planId !==
                "string" ||
            !planId.trim() ||
            typeof billingPeriod !==
                "string" ||
            !billingPeriod.trim()
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    error: {
                        code:
                            "INVALID_BILLING_OPTION",

                        message:
                            "Plan and billing period are required.",
                    },
                });
        }

        const billingOption =
            billingService.getBillingOption(
                planId.trim(),
                billingPeriod.trim(),
            );

        return res
            .status(200)
            .json({
                success:
                    true,

                data:
                    billingOption,
            });
    } catch (
        error
    ) {
        return handleControllerError(
            error,
            res,
        );
    }
};

// ============================================================
// Current Subscription
// ============================================================
//
// GET /api/subscriptions/current
//
// Authentication required.
// ============================================================

const getCurrentSubscription =
    async (
        req,
        res,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    req,
                );

            if (
                !userId
            ) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        error: {
                            code:
                                "AUTHENTICATION_REQUIRED",

                            message:
                                "Authentication is required.",
                        },
                    });
            }

            const subscription =
                await billingService
                    .getCurrentSubscription(
                        userId,
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    data:
                        subscription,
                });
        } catch (
            error
        ) {
            return handleControllerError(
                error,
                res,
            );
        }
    };

// ============================================================
// Active Subscription
// ============================================================
//
// GET /api/subscriptions/active
//
// Authentication required.
// ============================================================

const getActiveSubscription =
    async (
        req,
        res,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    req,
                );

            if (
                !userId
            ) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        error: {
                            code:
                                "AUTHENTICATION_REQUIRED",

                            message:
                                "Authentication is required.",
                        },
                    });
            }

            const subscription =
                await billingService
                    .getActiveSubscription(
                        userId,
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    data:
                        subscription,
                });
        } catch (
            error
        ) {
            return handleControllerError(
                error,
                res,
            );
        }
    };

// ============================================================
// User Entitlements
// ============================================================
//
// GET /api/subscriptions/entitlements
//
// Authentication required.
//
// This endpoint is intended for frontend UI decisions.
//
// The backend must still enforce these entitlements when the
// user actually performs an operation.
// ============================================================

const getEntitlements =
    async (
        req,
        res,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    req,
                );

            if (
                !userId
            ) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        error: {
                            code:
                                "AUTHENTICATION_REQUIRED",

                            message:
                                "Authentication is required.",
                        },
                    });
            }

            const entitlements =
                await billingService
                    .getUserEntitlements(
                        userId,
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    data:
                        entitlements,
                });
        } catch (
            error
        ) {
            return handleControllerError(
                error,
                res,
            );
        }
    };

// ============================================================
// Resume Entitlement
// ============================================================
//
// GET /api/subscriptions/entitlements/resumes
//
// Authentication required.
// ============================================================

const getResumeEntitlement =
    async (
        req,
        res,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    req,
                );

            if (
                !userId
            ) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        error: {
                            code:
                                "AUTHENTICATION_REQUIRED",

                            message:
                                "Authentication is required.",
                        },
                    });
            }

            const resumeLimit =
                await billingService
                    .getResumeLimit(
                        userId,
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    data: {
                        resumeLimit,
                    },
                });
        } catch (
            error
        ) {
            return handleControllerError(
                error,
                res,
            );
        }
    };

// ============================================================
// AI Entitlement
// ============================================================
//
// GET /api/subscriptions/entitlements/ai
//
// Authentication required.
// ============================================================

const getAIEntitlement =
    async (
        req,
        res,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    req,
                );

            if (
                !userId
            ) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        error: {
                            code:
                                "AUTHENTICATION_REQUIRED",

                            message:
                                "Authentication is required.",
                        },
                    });
            }

            const entitlement =
                await billingService
                    .getUserAIEntitlement(
                        userId,
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    data:
                        entitlement,
                });
        } catch (
            error
        ) {
            return handleControllerError(
                error,
                res,
            );
        }
    };

// ============================================================
// Cancel Current Subscription
// ============================================================
//
// POST /api/subscriptions/cancel
//
// Authentication required.
//
// The authenticated user's current subscription is resolved
// server-side.
//
// The client NEVER supplies a subscription ID for this route.
//
// Cancellation occurs at the end of the paid period.
// ============================================================

const cancelSubscription =
    async (
        req,
        res,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    req,
                );

            if (
                !userId
            ) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        error: {
                            code:
                                "AUTHENTICATION_REQUIRED",

                            message:
                                "Authentication is required.",
                        },
                    });
            }

            const subscription =
                await subscriptionRepository
                    .findCurrentByUserId(
                        userId,
                    );

            if (
                !subscription
            ) {
                const error =
                    new Error(
                        "Subscription not found.",
                    );

                error.code =
                    "SUBSCRIPTION_NOT_FOUND";

                error.statusCode =
                    404;

                throw error;
            }

            const updatedSubscription =
                await billingService
                    .cancelAtPeriodEnd({
                        subscriptionId:
                            subscription._id,

                        userId,
                    });

            return res
                .status(200)
                .json({
                    success:
                        true,

                    data:
                        updatedSubscription,
                });
        } catch (
            error
        ) {
            return handleControllerError(
                error,
                res,
            );
        }
    };

// ============================================================
// Cancel Specific Subscription
// ============================================================
//
// POST /api/subscriptions/:subscriptionId/cancel
//
// Authentication required.
//
// IMPORTANT:
//
// The subscription is explicitly looked up using BOTH:
//
//     subscriptionId
//     authenticated userId
//
// This prevents one user from cancelling another user's
// subscription by guessing/enumerating a subscription ID.
// ============================================================

const cancelSubscriptionById =
    async (
        req,
        res,
    ) => {
        try {
            const userId =
                getAuthenticatedUserId(
                    req,
                );

            if (
                !userId
            ) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        error: {
                            code:
                                "AUTHENTICATION_REQUIRED",

                            message:
                                "Authentication is required.",
                        },
                    });
            }

            const subscriptionId =
                req.params?.subscriptionId;

            if (
                typeof subscriptionId !==
                    "string" ||
                !subscriptionId.trim()
            ) {
                const error =
                    new Error(
                        "Subscription ID is required.",
                    );

                error.code =
                    "INVALID_SUBSCRIPTION";

                error.statusCode =
                    400;

                throw error;
            }

            const subscription =
                await subscriptionRepository
                    .findByIdAndUserId(
                        subscriptionId.trim(),
                        userId,
                    );

            if (
                !subscription
            ) {
                const error =
                    new Error(
                        "Subscription not found.",
                    );

                error.code =
                    "SUBSCRIPTION_NOT_FOUND";

                error.statusCode =
                    404;

                throw error;
            }

            const updatedSubscription =
                await billingService
                    .cancelAtPeriodEnd({
                        subscriptionId:
                            subscription._id,

                        userId,
                    });

            return res
                .status(200)
                .json({
                    success:
                        true,

                    data:
                        updatedSubscription,
                });
        } catch (
            error
        ) {
            return handleControllerError(
                error,
                res,
            );
        }
    };

// ============================================================
// Export
// ============================================================

const subscriptionController =
    Object.freeze({
        getPlans,

        getBillingOption,

        getCurrentSubscription,

        getActiveSubscription,

        getEntitlements,

        getResumeEntitlement,

        getAIEntitlement,

        cancelSubscription,

        cancelSubscriptionById,
    });

export default subscriptionController;