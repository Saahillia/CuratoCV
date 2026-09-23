// ============================================================
// CuratoCV Email Service
// ============================================================
//
// Wraps the backend email endpoints, if any, or provides a
// client interface to trigger transactional emails. Most emails
// are triggered server-side (e.g. welcome email on registration),
// but a few interactive flows (like "resend verification" or
// "share resume via email") may be initiated from the frontend.
// ============================================================

import api from "./api.js";

/**
 * Resend the email verification link. Requires authentication.
 * @returns {Promise<Object>} success response
 */
export const resendVerificationEmail = async () => {
    const response = await api.post("/users/resend-verification");
    return response.data;
};

/**
 * Trigger a password reset email by providing the account email.
 * @param {string} email
 * @returns {Promise<Object>} success response
 */
export const requestPasswordReset = async (email) => {
    const response = await api.post("/users/forgot-password", { email });
    return response.data;
};

/**
 * Request an email verification OTP for an authenticated user.
 * @returns {Promise<Object>} success response with OTP or verification URL
 */
export const requestEmailVerification = async () => {
    const response = await api.post("/users/request-email-verification");
    return response.data;
};

/**
 * Verify an email OTP. The OTP was sent via requestEmailVerification.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.otp
 * @returns {Promise<Object>} success response
 */
export const verifyEmail = async ({ email, otp }) => {
    const response = await api.post("/users/verify-email", { email, otp });
    return response.data;
};

/**
 * Verify a password reset OTP.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.otp
 * @returns {Promise<Object>} success response with reset token
 */
export const verifyPasswordResetOtp = async ({ email, otp }) => {
    const response = await api.post("/users/verify-password-reset-otp", { email, otp });
    return response.data;
};

/**
 * Reset the password using a verified reset token.
 * @param {Object} params
 * @param {string} params.resetToken
 * @param {string} params.newPassword
 * @returns {Promise<Object>} success response
 */
export const resetPassword = async ({ resetToken, newPassword }) => {
    const response = await api.post("/users/reset-password", { resetToken, newPassword });
    return response.data;
};

/**
 * Subscribe to product/marketing newsletters (if supported).
 * @param {string} email
 * @returns {Promise<Object>}
 */
export const subscribeNewsletter = async (email) => {
    const response = await api.post("/newsletter/subscribe", { email });
    return response.data;
};

const emailService = {
    resendVerificationEmail,
    requestPasswordReset,
    requestEmailVerification,
    verifyEmail,
    verifyPasswordResetOtp,
    resetPassword,
    subscribeNewsletter,
};

export default emailService;
