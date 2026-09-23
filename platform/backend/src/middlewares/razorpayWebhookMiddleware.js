// ============================================================
// CuratoCV Razorpay Webhook Middleware
// ============================================================
//
// Responsibilities:
// - Validate Razorpay webhook signatures
// - Reject unauthenticated webhook requests
// - Confirm that the raw request body is available
// - Mark successfully verified webhook requests
//
// NOT responsible for:
// - Processing webhook events
// - Updating payments
// - Updating subscriptions
// - Activating plans
// - Sending emails
// - Database access
//
// Flow:
//
// Razorpay
//     ↓
// express.raw()
//     ↓
// razorpayWebhookMiddleware
//     ↓
// HMAC-SHA256 verification
//     ↓
// paymentController.handleWebhook()
//     ↓
// paymentService.processWebhook()
// ============================================================

import crypto from "crypto";

// ============================================================
// Environment
// ============================================================
//
// The webhook secret is intentionally optional during local
// development.
//
// This allows the rest of CuratoCV to run before a public
// Razorpay webhook endpoint has been configured.
//
// IMPORTANT:
// An actual webhook request is NEVER accepted without the
// secret.
//
// ============================================================

const webhookSecret =
    typeof process.env.RAZORPAY_WEBHOOK_SECRET ===
    "string"
        ? process.env.RAZORPAY_WEBHOOK_SECRET.trim()
        : "";

// ============================================================
// Constants
// ============================================================

const SIGNATURE_HEADER =
    "x-razorpay-signature";

// ============================================================
// Signature Verification
// ============================================================

/**
 * Verify a Razorpay webhook signature.
 *
 * Razorpay calculates the webhook signature using:
 *
 *     HMAC-SHA256(
 *         rawBody,
 *         RAZORPAY_WEBHOOK_SECRET
 *     )
 *
 * The raw request body MUST be used.
 *
 * @param {Buffer|string} rawBody
 * @param {string} signature
 * @returns {boolean}
 */
const verifySignature = (
    rawBody,
    signature
) => {
    // --------------------------------------------------------
    // Configuration check
    // --------------------------------------------------------

    if (!webhookSecret) {
        return false;
    }

    // --------------------------------------------------------
    // Input validation
    // --------------------------------------------------------

    if (
        !rawBody ||
        !signature
    ) {
        return false;
    }

    // --------------------------------------------------------
    // Calculate expected signature
    // --------------------------------------------------------

    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                webhookSecret
            )
            .update(
                rawBody
            )
            .digest(
                "hex"
            );

    // --------------------------------------------------------
    // Constant-time comparison
    // --------------------------------------------------------
    //
    // timingSafeEqual prevents ordinary string comparison from
    // becoming a timing side-channel.
    //
    // Both buffers must have identical lengths.
    // --------------------------------------------------------

    const received =
        Buffer.from(
            String(
                signature
            ),
            "utf8"
        );

    const expected =
        Buffer.from(
            expectedSignature,
            "utf8"
        );

    if (
        received.length !==
        expected.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        received,
        expected
    );
};

// ============================================================
// Middleware
// ============================================================

/**
 * Verify an incoming Razorpay webhook.
 *
 * `paymentRoutes.js` must use `express.raw()` before this
 * middleware so that `req.body` contains the original Buffer.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const razorpayWebhookMiddleware = (
    req,
    res,
    next
) => {
    // --------------------------------------------------------
    // Webhook configuration
    // --------------------------------------------------------

    if (!webhookSecret) {
        return res.status(
            503
        ).json({
            success:
                false,

            error: {
                code:
                    "WEBHOOK_NOT_CONFIGURED",

                message:
                    "Razorpay webhook verification is not configured.",
            },
        });
    }

    // --------------------------------------------------------
    // Raw body validation
    // --------------------------------------------------------

    if (
        !Buffer.isBuffer(
            req.body
        )
    ) {
        return res.status(
            400
        ).json({
            success:
                false,

            error: {
                code:
                    "RAW_WEBHOOK_BODY_REQUIRED",

                message:
                    "Raw webhook payload is required.",
            },
        });
    }

    // --------------------------------------------------------
    // Signature header
    // --------------------------------------------------------

    const signature =
        req.get(
            SIGNATURE_HEADER
        );

    if (!signature) {
        return res.status(
            401
        ).json({
            success:
                false,

            error: {
                code:
                    "WEBHOOK_SIGNATURE_MISSING",

                message:
                    "Webhook signature is required.",
            },
        });
    }

    // --------------------------------------------------------
    // Signature verification
    // --------------------------------------------------------

    const valid =
        verifySignature(
            req.body,
            signature
        );

    if (!valid) {
        return res.status(
            401
        ).json({
            success:
                false,

            error: {
                code:
                    "WEBHOOK_SIGNATURE_INVALID",

                message:
                    "Webhook signature verification failed.",
            },
        });
    }

    // --------------------------------------------------------
    // Preserve verified raw body
    // --------------------------------------------------------

    req.rawBody =
        req.body;

    req.webhookVerified =
        true;

    return next();
};

// ============================================================
// Export
// ============================================================

export {
    verifySignature,
};

export default razorpayWebhookMiddleware;