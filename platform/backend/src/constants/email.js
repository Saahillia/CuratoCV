// ============================================================
// CuratoCV Email Constants
// ============================================================
//
// Centralized definitions for email types, subjects, and metadata.
// ============================================================

export const EMAIL_TYPES = Object.freeze({
    // Account Emails
    WELCOME: "WELCOME",
    VERIFY_EMAIL: "VERIFY_EMAIL",
    VERIFICATION_REMINDER: "VERIFICATION_REMINDER",
    PASSWORD_RESET: "PASSWORD_RESET",
    PASSWORD_CHANGED: "PASSWORD_CHANGED",
    EMAIL_CHANGED: "EMAIL_CHANGED",
    ACCOUNT_DELETED: "ACCOUNT_DELETED",
    SECURITY_ALERT: "SECURITY_ALERT",

    // Billing Emails
    ORDER_CONFIRMATION: "ORDER_CONFIRMATION",
    SUBSCRIPTION_ACTIVE: "SUBSCRIPTION_ACTIVE",
    SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",
    SUBSCRIPTION_EXPIRING: "SUBSCRIPTION_EXPIRING",
    SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
    PAYMENT_FAILED: "PAYMENT_FAILED",
    REFUND_PROCESSED: "REFUND_PROCESSED",

    // Resume Emails
    RESUME_PUBLISHED: "RESUME_PUBLISHED",
    RESUME_UNPUBLISHED: "RESUME_UNPUBLISHED",
    RESUME_SHARED: "RESUME_SHARED",
    RESUME_DELETED: "RESUME_DELETED",
});

export const EMAIL_SUBJECTS = Object.freeze({
    [EMAIL_TYPES.WELCOME]: "Welcome to CuratoCV!",
    [EMAIL_TYPES.VERIFY_EMAIL]: "Verify Your CuratoCV Email Address",
    [EMAIL_TYPES.VERIFICATION_REMINDER]: "Reminder: Verify Your CuratoCV Account",
    [EMAIL_TYPES.PASSWORD_RESET]: "Reset Your CuratoCV Password",
    [EMAIL_TYPES.PASSWORD_CHANGED]: "Your CuratoCV Password Was Changed",
    [EMAIL_TYPES.EMAIL_CHANGED]: "Your CuratoCV Email Address Was Changed",
    [EMAIL_TYPES.ACCOUNT_DELETED]: "Your CuratoCV Account Has Been Deleted",
    [EMAIL_TYPES.SECURITY_ALERT]: "Security Alert for Your CuratoCV Account",

    [EMAIL_TYPES.ORDER_CONFIRMATION]: "Your CuratoCV Order Confirmation",
    [EMAIL_TYPES.SUBSCRIPTION_ACTIVE]: "Your CuratoCV Subscription is Active",
    [EMAIL_TYPES.SUBSCRIPTION_RENEWED]: "Your CuratoCV Subscription Was Renewed",
    [EMAIL_TYPES.SUBSCRIPTION_EXPIRING]: "Your CuratoCV Subscription is Expiring Soon",
    [EMAIL_TYPES.SUBSCRIPTION_EXPIRED]: "Your CuratoCV Subscription Has Expired",
    [EMAIL_TYPES.PAYMENT_FAILED]: "CuratoCV Payment Failed",
    [EMAIL_TYPES.REFUND_PROCESSED]: "CuratoCV Refund Processed",

    [EMAIL_TYPES.RESUME_PUBLISHED]: "Your Resume Has Been Published",
    [EMAIL_TYPES.RESUME_UNPUBLISHED]: "Your Resume Has Been Unpublished",
    [EMAIL_TYPES.RESUME_SHARED]: "Your Resume Link Has Been Shared",
    [EMAIL_TYPES.RESUME_DELETED]: "Your Resume Has Been Deleted",
});

export const EMAIL_DEFAULTS = Object.freeze({
    SENDER_NAME: "CuratoCV",
    SUPPORT_EMAIL: "support@curatocv.com",
    COMPANY_NAME: "CuratoCV Inc.",
    COPYRIGHT_YEAR: new Date().getFullYear(),
});

export default {
    EMAIL_TYPES,
    EMAIL_SUBJECTS,
    EMAIL_DEFAULTS,
};
