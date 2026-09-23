// ============================================================
// CuratoCV Error Middleware
// ============================================================
//
// Global Express error-handling middleware.
//
// Responsibilities:
// - Catch all errors passed to next(error)
// - Convert ApiError instances to proper HTTP responses
// - Hide internal error details in production
// - Log errors for debugging
// - Handle unexpected errors gracefully
//
// NOT responsible for:
// - Creating errors (use ApiError class)
// - Request validation
// - Authentication
// - Business logic
//
// IMPORTANT:
// This middleware must be registered AFTER all routes:
//
//     app.use(routes);
//     app.use(errorMiddleware);
//
// ============================================================

import ApiError from "../Utils/apiError.js";

// ============================================================
// Error Logger
// ============================================================

const logError = (error, req) => {
    const isProduction = process.env.NODE_ENV === "production";

    // Always log error details server-side
    console.error("[ErrorMiddleware]", {
        method: req.method,
        path: req.originalUrl,
        name: error?.name,
        code: error?.code,
        statusCode: error?.statusCode,
        message: error?.message,
        stack: isProduction ? undefined : error?.stack,
    });
};

// ============================================================
// Response Builder
// ============================================================

const buildErrorResponse = (error) => {
    const isProduction = process.env.NODE_ENV === "production";

    // ApiError instances have safe client-facing messages
    if (error instanceof ApiError) {
        return {
            success: false,
            error: {
                code: error.code || "APPLICATION_ERROR",
                message: error.message,
                details: error.details || undefined,
            },
        };
    }

    // Mongoose validation errors
    if (error?.name === "ValidationError") {
        const messages = Object.values(error.errors || {}).map(
            (e) => e.message
        );

        return {
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message:
                    messages.length > 0
                        ? messages.join(" ")
                        : "Validation failed.",
                details: isProduction ? undefined : error.errors,
            },
        };
    }

    // MongoDB duplicate key error
    if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "resource";

        return {
            success: false,
            error: {
                code: "DUPLICATE_ERROR",
                message: `This ${field} already exists.`,
            },
        };
    }

    // JWT errors
    if (error?.name === "JsonWebTokenError") {
        return {
            success: false,
            error: {
                code: "AUTHENTICATION_ERROR",
                message: "Invalid authentication token.",
            },
        };
    }

    if (error?.name === "TokenExpiredError") {
        return {
            success: false,
            error: {
                code: "AUTHENTICATION_ERROR",
                message: "Authentication token has expired.",
            },
        };
    }

    // Cast errors (invalid ObjectId, etc.)
    if (error?.name === "CastError") {
        return {
            success: false,
            error: {
                code: "INVALID_ID",
                message: "Invalid resource identifier.",
            },
        };
    }

    // Unknown errors - hide details in production
    return {
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: isProduction
                ? "An unexpected error occurred."
                : error?.message || "An unexpected error occurred.",
        },
    };
};

// ============================================================
// Status Code Resolver
// ============================================================

const resolveStatusCode = (error) => {
    // ApiError has explicit status code
    if (Number.isInteger(error?.statusCode)) {
        return error.statusCode;
    }

    // Mongoose validation
    if (error?.name === "ValidationError") {
        return 400;
    }

    // Duplicate key
    if (error?.code === 11000) {
        return 409;
    }

    // JWT errors
    if (
        error?.name === "JsonWebTokenError" ||
        error?.name === "TokenExpiredError"
    ) {
        return 401;
    }

    // Cast error
    if (error?.name === "CastError") {
        return 400;
    }

    // Default to 500
    return 500;
};

// ============================================================
// Error Middleware
// ============================================================
//
// Express error middleware requires 4 parameters:
// (error, req, res, next)
// ============================================================

const errorMiddleware = (error, req, res, next) => {
    // If headers already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(error);
    }

    // Log the error
    logError(error, req);

    // Resolve status code
    const statusCode = resolveStatusCode(error);

    // Build safe error response
    const response = buildErrorResponse(error);

    // Send response
    return res.status(statusCode).json(response);
};

// ============================================================
// Export
// ============================================================

export default errorMiddleware;
