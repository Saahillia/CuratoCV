// ============================================================
// CuratoCV Resend Email Configuration
// ============================================================
//
// Centralized email client configuration using Resend.
//
// Responsibilities:
// - Read Resend API credentials from backend environment
// - Validate required email configuration
// - Create the Resend client
// - Export the configured client and sender configuration
//
// NOT responsible for:
// - Email template rendering
// - Email sending business logic
// - Email queue management
// - Database access
// - HTTP request handling
//
// SECURITY
// ------------------------------------------------------------
// - RESEND_API_KEY is backend-only.
// - NEVER expose RESEND_API_KEY to Vite/frontend.
// - NEVER hard-code API credentials.
// - NEVER log the API key.
// - Validate sender email format.
// ============================================================

import { Resend } from "resend";

// ============================================================
// Environment Configuration
// ============================================================

const resendApiKey =
    typeof process.env.RESEND_API_KEY === "string"
        ? process.env.RESEND_API_KEY.trim()
        : "";

const resendFromEmail =
    typeof process.env.RESEND_FROM_EMAIL === "string"
        ? process.env.RESEND_FROM_EMAIL.trim()
        : "";

const appUrl =
    typeof process.env.APP_URL === "string"
        ? process.env.APP_URL.trim()
        : "";

// ============================================================
// Required Configuration Validation
// ============================================================

if (!resendApiKey) {
    throw new Error(
        "RESEND_API_KEY is not configured.",
    );
}

if (!resendFromEmail) {
    throw new Error(
        "RESEND_FROM_EMAIL is not configured.",
    );
}

// ============================================================
// Email Format Validation
// ============================================================
//
// Basic validation to prevent obvious configuration errors.
//
// This does not guarantee deliverability.
// ============================================================

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (
    !EMAIL_REGEX.test(
        resendFromEmail
    )
) {
    throw new Error(
        "RESEND_FROM_EMAIL is not a valid email address.",
    );
}

// ============================================================
// Application URL Validation
// ============================================================
//
// Optional during local development, but required for
// production where email links must resolve to the actual
// frontend URL.
// ============================================================

const isProduction =
    process.env.NODE_ENV ===
    "production";

if (
    isProduction &&
    !appUrl
) {
    throw new Error(
        "APP_URL is required in production for email links.",
    );
}

if (appUrl) {
    let parsedUrl;

    try {
        parsedUrl =
            new URL(appUrl);
    } catch {
        throw new Error(
            "APP_URL is not a valid URL.",
        );
    }

    if (
        parsedUrl.protocol !==
            "https:" &&
        parsedUrl.protocol !==
            "http:"
    ) {
        throw new Error(
            "APP_URL must use HTTP or HTTPS.",
        );
    }
}

// ============================================================
// Resend Client
// ============================================================

const resend = new Resend(
    resendApiKey
);

// ============================================================
// Export
// ============================================================

const emailConfig =
    Object.freeze({
        client: resend,

        fromEmail:
            resendFromEmail,

        appUrl: appUrl || null,
    });

export default emailConfig;
