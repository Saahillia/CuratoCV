// ============================================================
// CuratoCV Email Service
// ============================================================
//
// Centralized email delivery using Resend.
//
// Responsibilities:
// - Send transactional emails (order confirmation, subscription
//   activation, payment failure)
// - Mask sensitive email addresses in logs
// - Track email delivery failures for support monitoring
// - Non-blocking email sending (fire-and-forget)
//
// NOT responsible for:
// - Email template rendering (see Emails/templates/)
// - HTTP req/res
// - Authentication
// - Payment processing
// - Database access
//
// IMPORTANT
// ------------------------------------------------------------
// Email sending MUST NOT block the main application flow.
// Payment/subscription operations must succeed even if email
// delivery fails.
//
// All email methods:
// - Log outgoing email attempts with masked recipient
// - Catch and log errors WITHOUT throwing
// - Return { success: boolean } so callers can track failures
// - Never expose Resend API errors to end users
// ============================================================

import emailConfig from "../configs/resend.js";
import logger from "../../../../backend/Configs/logger.js";
import { EMAIL_TYPES } from "../constants/email.js";

import {
    escapeHtml,
    renderEmail,
} from "../emails/emailRenderer.js";

import generateOrderConfirmationHTML from "../emails/templates/billing/OrderConfirmation.js";
import generateSubscriptionActiveHTML from "../emails/templates/billing/SubscriptionActive.js";
import generatePaymentFailedHTML from "../emails/templates/billing/PaymentFailed.js";

// ============================================================
// Email Masking
// ============================================================
//
// Masks an email address for safe logging:
//
//     john.doe@example.com  →  j***@example.com
//
// Only the first 2 characters of the local part are preserved.
// ============================================================

/**
 * Mask an email address for logging.
 *
 * @param {string} email
 * @returns {string}
 */
const maskEmail = (email) => {
    if (
        !email ||
        typeof email !== "string"
    ) {
        return "[unknown]";
    }

    const atIndex = email.indexOf("@");

    if (
        atIndex <= 0 ||
        atIndex === email.length - 1
    ) {
        return "[invalid]"; // Not a valid email, do not reveal it
    }

    const localPart = email.slice(0, atIndex);

    const domain = email.slice(atIndex); // includes "@"

    const maskedLocal =
        localPart.length <= 2
            ? localPart
            : `${localPart.slice(0, 2)}***`;

    return `${maskedLocal}${domain}`;
};

// ============================================================
// Rendered Email Sending Core
// ============================================================
//
// Low-level wrapper around Resend that:
// - Logs the outgoing attempt with masked recipient
// - Never throws (non-blocking)
// - Tracks failures via logger.error for support monitoring
// ============================================================

/**
 * Send an email via Resend.
 *
 * This method is intentionally non-throwing. Errors are logged
 * but never propagate to the caller.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - Rendered HTML body
 * @param {string} [params.templateName] - Template identifier for logging
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
const sendEmail = async ({ to, subject, html, templateName }) => {
    const maskedRecipient = maskEmail(to);

    logger.info(
        `Sending ${templateName || "email"} to ${maskedRecipient}`,
        {
            template: templateName,
            recipient: maskedRecipient,
            subject,
        }
    );

    try {
        const { data, error } = await emailConfig.client.emails.send({
            from: emailConfig.fromEmail,

            to: [to],

            subject,

            html,
        });

        if (error) {
            logger.error(
                `Email delivery failed: ${templateName || "email"}`,
                {
                    template: templateName,

                    recipient: maskedRecipient,

                    subject,

                    // Expose only the error message, never the raw
                    // Resend API response body or keys.
                    error: error.message || String(error),
                }
            );

            return {
                success: false,

                error: new Error(
                    error.message || "Email delivery failed."
                ),
            };
        }

        logger.info(
            `Email sent successfully: ${templateName || "email"}`,
            {
                template: templateName,

                recipient: maskedRecipient,

                messageId: data?.id || null,
            }
        );

        return {
            success: true,
        };
    } catch (error) {
        // ----------------------------------------------------
        // Non-blocking: never throw. Log for support monitoring.
        // ----------------------------------------------------

        logger.error(
            `Email service error: ${templateName || "email"}`,
            {
                template: templateName,

                recipient: maskedRecipient,

                subject,

                error: error?.message || "Unknown email error",
            }
        );

        return {
            success: false,

            error:
                error instanceof Error
                    ? error
                    : new Error("Unknown email error"),
        };
    }
};

// ============================================================
// Send Order Confirmation
// ============================================================

/**
 * Send order confirmation email after successful payment.
 *
 * @param {string} userEmail
 * @param {Object} order - Payment/order record
 * @param {Object} plan - Plan definition
 * @returns {Promise<{success: boolean}>}
 */
const sendOrderConfirmation = async (userEmail, order, plan) => {
    try {
        const html = generateOrderConfirmationHTML({
            userEmail,

            orderId:
                order.providerOrderId ||
                order.orderId ||
                String(order._id || ""),

            planName: plan?.name || "Subscription",

            billingPeriod: order.billingPeriod,

            amountMinor: order.amountMinor,

            currency: order.currency || "INR",

            renewalDate:
                order.currentPeriodEnd ||
                order.renewalDate ||
                order.expiresAt,

            appUrl: emailConfig.appUrl,
        });

        const result = await sendEmail({
            to: userEmail,

            subject: "Your CuratoCV Order Confirmation",

            html,

            templateName: "order_confirmation",
        });

        return {
            success: result.success,
        };
    } catch (error) {
        logger.error("sendOrderConfirmation failed", {
            recipient: maskEmail(userEmail),

            error: error?.message || "Unknown error",
        });

        return {
            success: false,
        };
    }
};

// ============================================================
// Send Subscription Active
// ============================================================

/**
 * Send subscription activation email after subscription activates.
 *
 * @param {string} userEmail
 * @param {Object} subscription - Subscription record
 * @param {Object} plan - Plan definition
 * @returns {Promise<{success: boolean}>}
 */
const sendSubscriptionActive = async (userEmail, subscription, plan) => {
    try {
        const html = generateSubscriptionActiveHTML({
            userEmail,

            planName: plan?.name || "Subscription",

            resumeLimit: plan?.resumeLimit ?? null,

            aiCredits: plan?.ai?.creditsPerPeriod ?? 0,

            startDate:
                subscription.currentPeriodStart ||
                subscription.startedAt ||
                subscription.createdAt,

            endDate:
                subscription.currentPeriodEnd ||
                subscription.expiresAt,

            appUrl: emailConfig.appUrl,
        });

        const result = await sendEmail({
            to: userEmail,

            subject: "Your CuratoCV Subscription is Active",

            html,

            templateName: "subscription_active",
        });

        return {
            success: result.success,
        };
    } catch (error) {
        logger.error("sendSubscriptionActive failed", {
            recipient: maskEmail(userEmail),

            error: error?.message || "Unknown error",
        });

        return {
            success: false,
        };
    }
};

// ============================================================
// Send Payment Failed
// ============================================================

/**
 * Send payment failure email.
 *
 * @param {string} userEmail
 * @param {Object} order - Payment/order record
 * @returns {Promise<{success: boolean}>}
 */
const sendPaymentFailed = async (userEmail, order) => {
    try {
        let reason = null;

        if (
            order.failure &&
            typeof order.failure === "object"
        ) {
            reason =
                order.failure.description ||
                order.failure.reason ||
                order.failure.code ||
                null;
        }

        const html = generatePaymentFailedHTML({
            userEmail,

            orderId:
                order.providerOrderId ||
                order.orderId ||
                String(order._id || ""),

            reason,

            appUrl: emailConfig.appUrl,
        });

        const result = await sendEmail({
            to: userEmail,

            subject: "CuratoCV Payment Failed",

            html,

            templateName: "payment_failed",
        });

        return {
            success: result.success,
        };
    } catch (error) {
        logger.error("sendPaymentFailed failed", {
            recipient: maskEmail(userEmail),

            error: error?.message || "Unknown error",
        });

        return {
            success: false,
        };
    }
};

// ============================================================
// Generic Rendered Email Sender
// ============================================================

/**
 * Render and send any email type using emailRenderer.
 *
 * @param {string} emailType - Standard key from EMAIL_TYPES
 * @param {string} userEmail - Recipient email
 * @param {Object} data - Context data for the template
 * @returns {Promise<{success: boolean}>}
 */
const sendRenderedEmail = async (emailType, userEmail, data = {}) => {
    try {
        const rendered = renderEmail(emailType, { ...data, userEmail });

        if (!rendered.success) {
            logger.error("Email rendering failed", {
                template: emailType,
                recipient: maskEmail(userEmail),
                error: rendered.error,
            });
            return {
                success: false,
                error: rendered.error,
            };
        }

        const result = await sendEmail({
            to: userEmail,
            subject: rendered.subject,
            html: rendered.html,
            templateName: emailType,
        });

        return {
            success: result.success,
        };
    } catch (error) {
        logger.error("sendRenderedEmail failed", {
            template: emailType,
            recipient: maskEmail(userEmail),
            error: error?.message || "Unknown error",
        });
        return {
            success: false,
        };
    }
};

// ============================================================
// Account Email Senders
// ============================================================

/**
 * Send welcome email to a newly registered user.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.verifyUrl
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendWelcome = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.WELCOME, userEmail, data);
};

/**
 * Send email verification email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.verifyUrl
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendEmailVerification = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.VERIFY_EMAIL, userEmail, data);
};

/**
 * Send verification reminder email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.verifyUrl
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendVerificationReminder = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.VERIFICATION_REMINDER, userEmail, data);
};

/**
 * Send password reset email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resetUrl
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendPasswordReset = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.PASSWORD_RESET, userEmail, data);
};

/**
 * Send password changed confirmation email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendPasswordChanged = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.PASSWORD_CHANGED, userEmail, data);
};

/**
 * Send email changed confirmation email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.oldEmail
 * @param {string} data.newEmail
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendEmailChanged = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.EMAIL_CHANGED, userEmail, data);
};

/**
 * Send account deletion confirmation email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @returns {Promise<{success: boolean}>}
 */
const sendAccountDeleted = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.ACCOUNT_DELETED, userEmail, data);
};

/**
 * Send security alert email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.alertDetails
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendSecurityAlert = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.SECURITY_ALERT, userEmail, data);
};

// ============================================================
// Resume Email Senders
// ============================================================

/**
 * Send resume published email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @param {string} data.publicUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendResumePublished = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.RESUME_PUBLISHED, userEmail, data);
};

/**
 * Send resume unpublished email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @returns {Promise<{success: boolean}>}
 */
const sendResumeUnpublished = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.RESUME_UNPUBLISHED, userEmail, data);
};

/**
 * Send resume shared email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @param {string} data.recipientEmail
 * @param {string} data.shareUrl
 * @param {string} data.appUrl
 * @returns {Promise<{success: boolean}>}
 */
const sendResumeShared = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.RESUME_SHARED, userEmail, data);
};

/**
 * Send resume deleted email.
 *
 * @param {string} userEmail
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @returns {Promise<{success: boolean}>}
 */
const sendResumeDeleted = async (userEmail, data = {}) => {
    return sendRenderedEmail(EMAIL_TYPES.RESUME_DELETED, userEmail, data);
};

// ============================================================
// Export
// ============================================================

const emailService = {
    sendOrderConfirmation,
    sendSubscriptionActive,
    sendPaymentFailed,
    sendRenderedEmail,
    sendWelcome,
    sendEmailVerification,
    sendVerificationReminder,
    sendPasswordReset,
    sendPasswordChanged,
    sendEmailChanged,
    sendAccountDeleted,
    sendSecurityAlert,
    sendResumePublished,
    sendResumeUnpublished,
    sendResumeShared,
    sendResumeDeleted,
    maskEmail,
};

export default emailService;
