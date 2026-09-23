// ============================================================
// CuratoCV Security Configuration
// ============================================================
//
// Centralized security-related configuration.
//
// This file contains CONFIGURATION only.
//
// Security enforcement belongs in:
//   - Middlewares/
//   - Utils/
//   - Validators/
//
// This prevents security logic from being scattered throughout
// controllers and routes.
// ============================================================

// ============================================================
// Environment
// ============================================================

const NODE_ENV =
    process.env.NODE_ENV?.trim() ||
    "development";

const isProduction =
    NODE_ENV === "production";

// ============================================================
// Trusted Frontend Origins
// ============================================================
//
// Configure allowed browser origins through:
//
//   CORS_ORIGINS=http://localhost:5173,https://app.example.com
//
// Do not use "*" when credentials are enabled.
//
// Multiple origins are supported.
// ============================================================

const parseOrigins = () => {
    const configuredOrigins =
        process.env.CORS_ORIGINS?.trim();

    if (!configuredOrigins) {
        /*
         * Development fallback.
         *
         * Production should explicitly configure CORS_ORIGINS.
         */
        if (isProduction) {
            throw new Error(
                "CORS_ORIGINS must be configured in production."
            );
        }

        return Object.freeze([
            "http://localhost:5173",
        ]);
    }

    const origins =
        configuredOrigins
            .split(",")
            .map((origin) =>
                origin.trim()
            )
            .filter(Boolean);

    if (origins.length === 0) {
        throw new Error(
            "CORS_ORIGINS does not contain a valid origin."
        );
    }

    /*
     * Validate every configured origin.
     *
     * We deliberately reject wildcard origins here because
     * CuratoCV should use an explicit allowlist.
     */
    for (const origin of origins) {
        if (origin === "*") {
            throw new Error(
                "Wildcard CORS origins are not permitted."
            );
        }

        let parsedOrigin;

        try {
            parsedOrigin =
                new URL(origin);
        } catch {
            throw new Error(
                `Invalid CORS origin configured: ${origin}`
            );
        }

        /*
         * Browser origins should use HTTP(S).
         */
        if (
            parsedOrigin.protocol !==
                "http:" &&
            parsedOrigin.protocol !==
                "https:"
        ) {
            throw new Error(
                `CORS origin must use HTTP or HTTPS: ${origin}`
            );
        }

        /*
         * Origins must not contain credentials.
         */
        if (
            parsedOrigin.username ||
            parsedOrigin.password
        ) {
            throw new Error(
                "CORS origins must not contain embedded credentials."
            );
        }

        /*
         * An origin should not contain a path, query string,
         * or fragment.
         */
        if (
            parsedOrigin.pathname !== "/" ||
            parsedOrigin.search ||
            parsedOrigin.hash
        ) {
            throw new Error(
                `CORS origin must contain only scheme, host, and optional port: ${origin}`
            );
        }
    }

    return Object.freeze(
        [...new Set(origins)]
    );
};

const allowedOrigins =
    parseOrigins();

// ============================================================
// Trusted Proxy Configuration
// ============================================================
//
// Only enable this when the deployment actually runs behind
// a trusted reverse proxy/load balancer.
//
// Example:
//
//   TRUST_PROXY=1
//
// Never blindly enable proxy trust because IP-based controls
// such as rate limiting depend on correct client IP handling.
// ============================================================

const parseTrustProxy = () => {
    const configured =
        process.env.TRUST_PROXY?.trim();

    if (!configured) {
        return false;
    }

    if (
        configured === "true"
    ) {
        return true;
    }

    if (
        configured === "false"
    ) {
        return false;
    }

    if (
        /^\d+$/.test(configured)
    ) {
        return Number(
            configured
        );
    }

    /*
     * Express supports additional trust-proxy forms, but
     * arbitrary values from environment variables should not
     * silently become trusted proxy configuration.
     */
    throw new Error(
        "TRUST_PROXY must be true, false, or a non-negative integer."
    );
};

const trustProxy =
    parseTrustProxy();

// ============================================================
// Cookie Security Configuration
// ============================================================
//
// These settings are centralized here so authentication/session
// code does not independently invent cookie security settings.
//
// They become relevant when we implement cookie-based sessions
// or refresh tokens.
// ============================================================

const cookieSecurity = Object.freeze({
    httpOnly: true,

    /*
     * Secure cookies are required in production.
     */
    secure: isProduction,

    /*
     * Lax provides a reasonable default for same-site
     * application authentication.
     *
     * If our eventual authentication architecture requires
     * cross-site cookies, this must be deliberately changed
     * together with CSRF protection.
     */
    sameSite: "lax",
});

// ============================================================
// Security Header Configuration
// ============================================================
//
// These are POLICY values used by the server security layer.
//
// The actual headers will be applied by server.js/security
// middleware rather than here.
// ============================================================

const securityHeaders = Object.freeze({
    contentSecurityPolicy:
        isProduction,

    crossOriginEmbedderPolicy:
        false,

    crossOriginOpenerPolicy:
        "same-origin",

    crossOriginResourcePolicy:
        "same-site",

    referrerPolicy:
        "strict-origin-when-cross-origin",

    strictTransportSecurity:
        isProduction,

    xContentTypeOptions:
        "nosniff",

    xFrameOptions:
        "DENY",
});

// ============================================================
// Request Security Configuration
// ============================================================

const requestSecurity = Object.freeze({
    /*
     * Do not expose detailed server errors to clients.
     */
    exposeInternalErrors:
        !isProduction,

    /*
     * Production should never run with development debugging
     * behavior enabled.
     */
    debug:
        !isProduction,
});

// ============================================================
// Export
// ============================================================

const securityConfig = Object.freeze({
    environment: NODE_ENV,

    isProduction,

    allowedOrigins,

    trustProxy,

    cookieSecurity,

    securityHeaders,

    requestSecurity,
});

export default securityConfig;