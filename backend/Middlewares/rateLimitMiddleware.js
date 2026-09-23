// ============================================================
// CuratoCV Rate Limit Middleware
// ============================================================
//
// Protects API endpoints from abuse, brute force, and DoS.
//
// Responsibilities:
// - Limit request frequency per client
// - Return 429 Too Many Requests when limit exceeded
// - Provide reasonable defaults for different endpoint types
// - Support configurable windows and limits
//
// NOT responsible for:
// - Authentication
// - Request validation
// - Business logic
// - IP geolocation
//
// Implementation:
// In-memory store with sliding window.
// For production/distributed deployments, use Redis.
//
// ============================================================

import ApiError from "../Utils/apiError.js";

// ============================================================
// In-Memory Store
// ============================================================
//
// Simple Map-based store for rate limit counters.
//
// Key: clientId (IP or userId)
// Value: { count: number, resetAt: number }
//
// Cleaned periodically to prevent memory leaks.
// ============================================================

const store = new Map();

// TEST HELPERS
const _clearRateLimitStore = () => store.clear();

// Clean up expired entries every 5 minutes
const cleanup = () => {
    const now = Date.now();

    for (const [key, value] of store.entries()) {
        if (value.resetAt <= now) {
            store.delete(key);
        }
    }
};

setInterval(cleanup, 5 * 60 * 1000).unref();

// ============================================================
// Rate Limit Configuration
// ============================================================

const DEFAULT_CONFIG = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
};

// More restrictive limits for auth endpoints
const AUTH_CONFIG = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // login/register attempts
    message: "Too many authentication attempts. Please try again later.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
};

// OTP request cooldown policy (1 request / 60 seconds / email + purpose)
const OTP_COOLDOWN_CONFIG = {
    windowMs: 60 * 1000, // 60 seconds
    max: 1,
    message: "Please wait 60 seconds before requesting another verification code.",
    code: "OTP_COOLDOWN_EXCEEDED",
};

// OTP request hourly limit policy (5 requests / hour / email + purpose)
const OTP_HOURLY_EMAIL_CONFIG = {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: "Too many verification code requests for this email. Please try again in an hour.",
    code: "OTP_EMAIL_LIMIT_EXCEEDED",
};

// OTP request IP hourly limit policy (10 requests / hour / IP)
const OTP_HOURLY_IP_CONFIG = {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: "Too many verification code requests from this IP. Please try again later.",
    code: "OTP_IP_LIMIT_EXCEEDED",
};

// OTP verification attempt IP/account rate limiter (10 attempts per 15 minutes)
const OTP_VERIFY_CONFIG = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: "Too many verification attempts. Please try again later.",
    code: "OTP_VERIFY_LIMIT_EXCEEDED",
};

// ============================================================
// Rate Limit Factory
// ============================================================
//
// Creates a rate limit middleware with the given configuration.
//
// @param {Object} config - { windowMs, max, message, code }
// @returns {Function} Express middleware
// ============================================================

const createRateLimiter = (config = {}) => {
    const options = {
        ...DEFAULT_CONFIG,
        ...config,
    };

    return function rateLimitMiddleware(req, res, next) {
        // Skip in test mode if explicitly disabled
        if (process.env.DISABLE_RATE_LIMIT === "true") {
            return next();
        }

        // Client identifier: prefer userId if authenticated, else IP
        const clientId =
            req.userId ||
            req.ip ||
            req.connection.remoteAddress ||
            "unknown";

        const key = `${clientId}:${req.originalUrl || req.path}`;
        const now = Date.now();

        // Get or initialize counter
        let entry = store.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = {
                count: 0,
                resetAt: now + options.windowMs,
            };
            store.set(key, entry);
        }

        // Increment count
        entry.count += 1;

        // Set rate limit headers
        const remaining = Math.max(0, options.max - entry.count);
        const resetSeconds = Math.ceil(
            (entry.resetAt - now) / 1000
        );

        res.set({
            "X-RateLimit-Limit": String(options.max),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(resetSeconds),
        });

        // Check limit
        if (entry.count > options.max) {
            const retryAfter = Math.ceil(
                (entry.resetAt - now) / 1000
            );

            res.set("Retry-After", String(retryAfter));

            return next(
                new ApiError(429, options.message, {
                    code: options.code,
                })
            );
        }

        return next();
    };
};

// ============================================================
// Default Exports
// ============================================================

// General API rate limiter
const rateLimitMiddleware = createRateLimiter();

// Authentication endpoint rate limiter
const authRateLimitMiddleware = createRateLimiter(AUTH_CONFIG);

// OTP generation IP-based rate limiter
const otpIpLimitMiddleware = createRateLimiter(OTP_HOURLY_IP_CONFIG);

// OTP verification endpoint global rate limiter
const otpVerifyIpLimitMiddleware = createRateLimiter(OTP_VERIFY_CONFIG);

// ============================================================
// Export
// ============================================================

// Per-email + purpose rate limiter for OTP generation (layered)
const createEmailPurposeRateLimiter = (config = {}) => {
    return function rateLimitMiddleware(req, res, next) {
        if (process.env.DISABLE_RATE_LIMIT === "true") {
            return next();
        }
        // Use validated/request body email when present for finer-grained control
        const emailKey =
            req.validatedBody?.email || req.body?.email || req.userId || "unknown";
        const purposeKey = req.body?.purpose || "default";
        const normalizedEmail = String(emailKey).trim().toLowerCase();
        const normalizedPurpose = String(purposeKey).trim();
        const key = `email:purpose:${normalizedEmail}:${normalizedPurpose}:${config.windowMs}:${config.max}:${req.originalUrl || req.path}`;
        const now = Date.now();
        let entry = store.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + config.windowMs };
            store.set(key, entry);
        }
        entry.count += 1;
        res.set({
            "X-RateLimit-Limit": String(config.max || 5),
            "X-RateLimit-Remaining": String(Math.max(0, (config.max || 5) - entry.count)),
            "X-RateLimit-Reset": String(Math.ceil((entry.resetAt - now) / 1000)),
        });
        if (entry.count > (config.max || 5)) {
            res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
            return next(
                new ApiError(429, config.message || "Too many requests. Please try again later.", {
                    code: config.code || "RATE_LIMIT_EXCEEDED",
                })
            );
        }
        return next();
    };
};

const otpCooldownMiddleware = createEmailPurposeRateLimiter(OTP_COOLDOWN_CONFIG);
const otpEmailHourlyLimitMiddleware = createEmailPurposeRateLimiter(OTP_HOURLY_EMAIL_CONFIG);

export {
    createRateLimiter,
    createEmailPurposeRateLimiter,
    authRateLimitMiddleware,
    otpIpLimitMiddleware,
    otpVerifyIpLimitMiddleware,
    otpCooldownMiddleware,
    otpEmailHourlyLimitMiddleware,
    _clearRateLimitStore
};

export default rateLimitMiddleware;
