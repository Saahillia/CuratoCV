// ============================================================
// CuratoCV API Error
// ============================================================
//
// Standard application error class.
//
// Responsibilities:
// - Represent expected API/application errors
// - Carry an HTTP status code
// - Carry a safe client-facing message
// - Optionally carry additional error metadata
//
// NOT responsible for:
// - Sending HTTP responses
// - Logging
// - Express middleware
// - Database operations
//
// errorMiddleware.js is responsible for converting this error
// into the final HTTP response.
// ============================================================

class ApiError extends Error {
    /**
     * @param {number} statusCode
     * @param {string} message
     * @param {Object} options
     * @param {string} [options.code]
     * @param {Object} [options.details]
     * @param {boolean} [options.isOperational]
     */
    constructor(
        statusCode,
        message,
        options = {}
    ) {
        super(message);

        this.name =
            "ApiError";

        this.statusCode =
            Number.isInteger(
                statusCode
            )
                ? statusCode
                : 500;

        this.code =
            options.code ||
            null;

        this.details =
            options.details ||
            null;

        /*
         * Operational errors are expected application errors,
         * such as:
         *
         * 400 validation errors
         * 401 authentication errors
         * 403 authorization errors
         * 404 not found errors
         * 409 conflicts
         *
         * Unexpected programming/database errors should remain
         * non-operational.
         */
        this.isOperational =
            options.isOperational ??
            (
                this.statusCode >=
                    400 &&
                this.statusCode <
                    500
            );

        /*
         * Preserve the original stack trace.
         */
        if (
            Error.captureStackTrace
        ) {
            Error.captureStackTrace(
                this,
                ApiError
            );
        }
    }
}

// ============================================================
// Common Factory Helpers
// ============================================================
//
// These are optional convenience methods.
//
// Services can continue using:
//
//     new ApiError(404, "Resume not found.")
//
// or:
//
//     ApiError.notFound("Resume not found.")
//
// ============================================================

ApiError.badRequest = (
    message = "Bad request."
) =>
    new ApiError(
        400,
        message
    );

ApiError.unauthorized = (
    message = "Authentication required."
) =>
    new ApiError(
        401,
        message
    );

ApiError.forbidden = (
    message = "You do not have permission to perform this action."
) =>
    new ApiError(
        403,
        message
    );

ApiError.notFound = (
    message = "Resource not found."
) =>
    new ApiError(
        404,
        message
    );

ApiError.conflict = (
    message = "Resource already exists."
) =>
    new ApiError(
        409,
        message
    );

ApiError.tooManyRequests = (
    message = "Too many requests."
) =>
    new ApiError(
        429,
        message
    );

ApiError.internal = (
    message = "An unexpected server error occurred."
) =>
    new ApiError(
        500,
        message,
        {
            isOperational:
                false,
        }
    );

// ============================================================
// Export
// ============================================================

export default ApiError;