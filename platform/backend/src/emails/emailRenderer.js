// ============================================================
// CuratoCV Email Renderer
// ============================================================
//
// Centralized template rendering engine.
//
// Responsibilities:
// - Escape untrusted user input before rendering
// - Process HTML templates using predefined functions
// - Generate plaintext fallback body from HTML structure
// - Map EMAIL_TYPES to the correct subjects and template functions
//
// ============================================================

import { EMAIL_TYPES, EMAIL_SUBJECTS } from "../constants/email.js";
import { renderBaseTemplate } from "./templates/system/baseTemplate.js";

// Account Template imports
import welcomeEmail from "./templates/account/welcome.js";
import verifyEmail from "./templates/account/verifyEmail.js";
import verificationReminder from "./templates/account/verificationReminder.js";
import passwordReset from "./templates/account/passwordReset.js";
import passwordChanged from "./templates/account/passwordChanged.js";
import emailChanged from "./templates/account/emailChanged.js";
import accountDeleted from "./templates/account/accountDeleted.js";
import securityAlert from "./templates/account/securityAlert.js";

// Billing Template imports
import generateOrderConfirmationHTML from "./templates/billing/OrderConfirmation.js";
import generateSubscriptionActiveHTML from "./templates/billing/SubscriptionActive.js";
import generatePaymentFailedHTML from "./templates/billing/PaymentFailed.js";
import generateSubscriptionRenewedHTML from "./templates/billing/subscriptionRenewed.js";
import generateSubscriptionExpiringHTML from "./templates/billing/subscriptionExpiring.js";
import generateSubscriptionExpiredHTML from "./templates/billing/subscriptionExpired.js";
import generateRefundProcessedHTML from "./templates/billing/refundProcessed.js";

// Resume Template imports
import resumePublished from "./templates/resume/resumePublished.js";
import resumeUnpublished from "./templates/resume/resumeUnpublished.js";
import resumeShared from "./templates/resume/resumeShared.js";
import resumeDeleted from "./templates/resume/resumeDeleted.js";

// ============================================================
// HTML Escaping Utility
// ============================================================

/**
 * Escapes HTML characters in untrusted input to prevent XSS.
 * @param {string} str - Input string
 * @returns {string} - Escaped string
 */
export const escapeHtml = (str) => {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// ============================================================
// Template Registry
// ============================================================

const TEMPLATE_GENERATORS = Object.freeze({
    [EMAIL_TYPES.WELCOME]: welcomeEmail,
    [EMAIL_TYPES.VERIFY_EMAIL]: verifyEmail,
    [EMAIL_TYPES.VERIFICATION_REMINDER]: verificationReminder,
    [EMAIL_TYPES.PASSWORD_RESET]: passwordReset,
    [EMAIL_TYPES.PASSWORD_CHANGED]: passwordChanged,
    [EMAIL_TYPES.EMAIL_CHANGED]: emailChanged,
    [EMAIL_TYPES.ACCOUNT_DELETED]: accountDeleted,
    [EMAIL_TYPES.SECURITY_ALERT]: securityAlert,

    [EMAIL_TYPES.ORDER_CONFIRMATION]: generateOrderConfirmationHTML,
    [EMAIL_TYPES.SUBSCRIPTION_ACTIVE]: generateSubscriptionActiveHTML,
    [EMAIL_TYPES.SUBSCRIPTION_RENEWED]: generateSubscriptionRenewedHTML,
    [EMAIL_TYPES.SUBSCRIPTION_EXPIRING]: generateSubscriptionExpiringHTML,
    [EMAIL_TYPES.SUBSCRIPTION_EXPIRED]: generateSubscriptionExpiredHTML,
    [EMAIL_TYPES.PAYMENT_FAILED]: generatePaymentFailedHTML,
    [EMAIL_TYPES.REFUND_PROCESSED]: generateRefundProcessedHTML,

    [EMAIL_TYPES.RESUME_PUBLISHED]: resumePublished,
    [EMAIL_TYPES.RESUME_UNPUBLISHED]: resumeUnpublished,
    [EMAIL_TYPES.RESUME_SHARED]: resumeShared,
    [EMAIL_TYPES.RESUME_DELETED]: resumeDeleted,
});

// ============================================================
// Text Fallback Generator
// ============================================================

/**
 * Strip HTML tags to create a plain text fallback.
 * Super basic stripping; relies on well-formatted simple emails.
 */
const generatePlainTextFallback = (html) => {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove styles
        .replace(/<\/div>|<\/p>|<\/li>|<\/h[1-6]>/gi, "\n\n") // Line breaks for blocks
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "") // Strip all other tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#039;/g, "'")
        .replace(/\n\s*\n/g, "\n\n") // Remove extra line breaks
        .trim();
};

// ============================================================
// Main Renderer
// ============================================================

/**
 * Render email template (HTML, text fallback, subject line).
 *
 * @param {string} emailType - Standard key from EMAIL_TYPES
 * @param {Object} data - Context data for the template
 * @returns {{success: boolean, html?: string, text?: string, subject?: string, error?: string}}
 */
export const renderEmail = (emailType, data = {}) => {
    try {
        if (!TEMPLATE_GENERATORS[emailType]) {
            throw new Error(`Unsupported email type: ${emailType}`);
        }

        // Deep copy data and escape string values for safety
        const safeData = {};
        for (const [key, value] of Object.entries(data)) {
            if (
                typeof value === "string" &&
                !key.toLowerCase().includes("url") &&
                !key.toLowerCase().includes("link")
            ) {
                safeData[key] = escapeHtml(value);
            } else {
                safeData[key] = value;
            }
        }

        // Generate inner HTML content using the localized/specific template
        let rawHtmlContent = TEMPLATE_GENERATORS[emailType](safeData);
        let finalHtml = rawHtmlContent;

        // If it's one of the new simple component templates, they return inner content, not full HTML
        // So we wrap them in baseTemplate. If it starts with "<!DOCTYPE", it's already a full valid doc.
        if (
            typeof rawHtmlContent === "string" &&
            !rawHtmlContent.trim().toLowerCase().startsWith("<!doctype")
        ) {
            finalHtml = renderBaseTemplate({
                title: EMAIL_SUBJECTS[emailType] || "CuratoCV Notice",
                content: rawHtmlContent,
                appUrl: safeData.appUrl,
            });
        }

        const subject =
            safeData.customSubject ||
            EMAIL_SUBJECTS[emailType] ||
            "CuratoCV Notice";
        const text = generatePlainTextFallback(finalHtml);

        return {
            success: true,
            html: finalHtml,
            text,
            subject,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || "Failed to render email.",
        };
    }
};

export default {
    escapeHtml,
    renderEmail,
};
