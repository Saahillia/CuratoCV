// ============================================================
// CuratoCV Razorpay Configuration
// ============================================================
//
// Central Razorpay API client configuration.
//
// Responsibilities:
// - Read Razorpay API credentials from backend environment
// - Validate required Razorpay API configuration
// - Create the Razorpay SDK client
// - Export the configured client
//
// NOT responsible for:
// - Webhook signature verification
// - Payment business logic
// - Subscription management
// - Database access
// - HTTP request handling
//
// SECURITY
// ------------------------------------------------------------
// - RAZORPAY_KEY_ID is backend configuration.
// - RAZORPAY_KEY_SECRET is backend-only.
// - NEVER expose RAZORPAY_KEY_SECRET to Vite.
// - NEVER hard-code Razorpay credentials.
// - NEVER log credentials.
// - Webhook secrets are handled separately by the webhook
//   middleware.
// ============================================================

import Razorpay from "razorpay";

// ============================================================
// Environment Configuration
// ============================================================

const keyId =
    typeof process.env.RAZORPAY_KEY_ID ===
    "string"
        ? process.env.RAZORPAY_KEY_ID.trim()
        : "";

const keySecret =
    typeof process.env.RAZORPAY_KEY_SECRET ===
    "string"
        ? process.env.RAZORPAY_KEY_SECRET.trim()
        : "";

// ============================================================
// Required Configuration Validation
// ============================================================

if (!keyId) {
    throw new Error(
        "RAZORPAY_KEY_ID is not configured.",
    );
}

if (!keySecret) {
    throw new Error(
        "RAZORPAY_KEY_SECRET is not configured.",
    );
}

// ============================================================
// Razorpay Client
// ============================================================
//
// The Razorpay client is created once and reused throughout
// the backend application.
//
// This avoids repeatedly constructing SDK clients for every
// payment operation.
// ============================================================

const razorpay =
    new Razorpay({
        key_id: keyId,

        key_secret: keySecret,
    });

// ============================================================
// Export
// ============================================================

export default razorpay;