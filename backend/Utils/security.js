// ============================================================
// CuratoCV Security Utilities
// ============================================================
//
// Centralized low-level security helpers.
//
// Responsibilities:
// - Security-related constants
// - Safe security-header configuration
// - Constant-time string comparison
// - Secret/configuration checks
// - Sensitive-value redaction for logging
//
// NOT responsible for:
// - JWT creation/verification
// - Authentication
// - Authorization
// - Rate limiting
// - Password hashing
// - HTTP middleware
// - Request validation
//
// Those responsibilities belong to:
// - auth middleware/service
// - rateLimitMiddleware
// - User model
// - Validators
// - security configuration
// ============================================================

import crypto from "crypto";

// ============================================================
// Security Constants
// ============================================================

const SECURITY_CONSTANTS =
    Object.freeze({
        // ----------------------------------------------------
        // Password policy
        // ----------------------------------------------------
        //
        // These are application-level password requirements.
        //
        // bcrypt hashing itself is handled by User.js.
        // ----------------------------------------------------

        password: Object.freeze({
            minLength: 8,
            maxLength: 128,
        }),

        // ----------------------------------------------------
        // Token policy
        // ----------------------------------------------------

        token: Object.freeze({
            minSecretLength: 32,
        }),

        // ----------------------------------------------------
        // General security limits
        // ----------------------------------------------------

        requestId: Object.freeze({
            maxLength: 100,
        }),
    });

// ============================================================
// isProduction
// ============================================================

const isProduction =
    () => {
        return (
            process.env.NODE_ENV ===
            "production"
        );
    };

// ============================================================
// isDevelopment
// ============================================================

const isDevelopment =
    () => {
        return (
            process.env.NODE_ENV ===
                "development" ||
            !process.env.NODE_ENV
        );
    };

// ============================================================
// isValidSecret
// ============================================================
//
// Checks whether a secret is sufficiently long.
//
// This does NOT determine whether a secret is cryptographically
// strong enough for every use case. It simply provides a
// centralized minimum-length boundary.
//
// ============================================================

const isValidSecret = (
    secret,
    minimumLength =
        SECURITY_CONSTANTS
            .token
            .minSecretLength
) => {
    return (
        typeof secret ===
            "string" &&
        secret.length >=
            minimumLength
    );
};

// ============================================================
// assertRequiredSecret
// ============================================================
//
// Used during application startup for required secrets.
//
// Example:
//
// assertRequiredSecret(
//     process.env.JWT_SECRET,
//     "JWT_SECRET"
// );
//
// ============================================================

const assertRequiredSecret = (
    secret,
    name,
    options = {}
) => {
    const minimumLength =
        Number.isInteger(
            options.minimumLength
        )
            ? options.minimumLength
            : SECURITY_CONSTANTS
                  .token
                  .minSecretLength;

    if (
        typeof secret !==
            "string" ||
        secret.trim().length === 0
    ) {
        throw new Error(
            `${name} is not configured.`
        );
    }

    if (
        secret.length <
        minimumLength
    ) {
        throw new Error(
            `${name} must contain at least ${minimumLength} characters.`
        );
    }

    return true;
};

// ============================================================
// timingSafeEqual
// ============================================================
//
// Compares two strings using Node's constant-time comparison.
//
// This is useful for secrets/tokens where a normal `===`
// comparison could theoretically expose timing information.
//
// IMPORTANT:
//
// Both values must have the same byte length for
// crypto.timingSafeEqual(). We normalize them into Buffers and
// return false when their lengths differ.
// ============================================================

const timingSafeEqual = (
    first,
    second
) => {
    if (
        typeof first !==
            "string" ||
        typeof second !==
            "string"
    ) {
        return false;
    }

    const firstBuffer =
        Buffer.from(
            first,
            "utf8"
        );

    const secondBuffer =
        Buffer.from(
            second,
            "utf8"
        );

    if (
        firstBuffer.length !==
        secondBuffer.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        firstBuffer,
        secondBuffer
    );
};

// ============================================================
// generateRandomToken
// ============================================================
//
// Generates a cryptographically secure random token.
//
// This can later be used for things such as:
// - password-reset tokens
// - email-verification tokens
// - public resume identifiers
//
// The token should be stored/used according to the specific
// feature's security requirements.
//
// ============================================================

const generateRandomToken = (
    byteLength = 32
) => {
    if (
        !Number.isInteger(
            byteLength
        ) ||
        byteLength < 16 ||
        byteLength > 128
    ) {
        throw new RangeError(
            "Token byte length must be between 16 and 128."
        );
    }

    return crypto
        .randomBytes(
            byteLength
        )
        .toString("hex");
};

// ============================================================
// hashToken
// ============================================================
//
// Hashes a token before storing it.
//
// This is useful when implementing password-reset or
// verification tokens:
//
//     raw token
//          ↓
//     send to user
//
//     SHA-256(raw token)
//          ↓
//     store hash in database
//
// If the database is compromised, the raw token is not directly
// exposed.
//
// ============================================================

const hashToken = (
    token
) => {
    if (
        typeof token !==
        "string"
    ) {
        throw new TypeError(
            "Token must be a string."
        );
    }

    return crypto
        .createHash("sha256")
        .update(
            token,
            "utf8"
        )
        .digest("hex");
};

// ============================================================
// sanitizeForLog
// ============================================================
//
// Prevent sensitive values from accidentally appearing in
// application logs.
//
// This is intentionally conservative.
//
// Never log:
// - passwords
// - API keys
// - JWTs
// - ImageKit private keys
// - Gemini API keys
// - MongoDB credentials
//
// ============================================================

const SENSITIVE_KEY_PATTERN =
    /password|passwd|secret|token|api[_-]?key|private[_-]?key|authorization|cookie/i;

/**
 * Recursively redact sensitive object properties.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeForLog = (
    value
) => {
    if (
        Array.isArray(value)
    ) {
        return value.map(
            sanitizeForLog
        );
    }

    if (
        value &&
        typeof value ===
            "object" &&
        !Buffer.isBuffer(value) &&
        !(value instanceof Date)
    ) {
        const output = {};

        for (
            const [
                key,
                childValue,
            ] of Object.entries(
                value
            )
        ) {
            if (
                SENSITIVE_KEY_PATTERN.test(
                    key
                )
            ) {
                output[key] =
                    "[REDACTED]";

                continue;
            }

            output[key] =
                sanitizeForLog(
                    childValue
                );
        }

        return output;
    }

    return value;
};

// ============================================================
// getClientIp
// ============================================================
//
// Extracts the client IP from an Express request.
//
// IMPORTANT:
//
// `req.ip` should be trusted only when Express `trust proxy`
// is configured correctly for the deployment environment.
//
// We therefore use req.ip rather than manually trusting
// arbitrary X-Forwarded-For headers.
// ============================================================

const getClientIp = (
    req
) => {
    if (
        !req ||
        typeof req.ip !==
            "string"
    ) {
        return null;
    }

    return req.ip;
};

// ============================================================
// Export
// ============================================================

const security =
    Object.freeze({
        constants:
            SECURITY_CONSTANTS,
        isProduction,
        isDevelopment,
        isValidSecret,
        assertRequiredSecret,
        timingSafeEqual,
        generateRandomToken,
        hashToken,
        sanitizeForLog,
        getClientIp,
    });

export {
    SECURITY_CONSTANTS,
    isProduction,
    isDevelopment,
    isValidSecret,
    assertRequiredSecret,
    timingSafeEqual,
    generateRandomToken,
    hashToken,
    sanitizeForLog,
    getClientIp,
};

export default security;