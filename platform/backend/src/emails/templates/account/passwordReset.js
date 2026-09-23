/**
 * Generate password reset email content.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resetUrl
 * @param {string} data.otp
 * @returns {string}
 */
const passwordReset = (data) => {
    const { userName = "there", resetUrl = "#", otp = "" } = data;

    return `
<div style="font-size: 16px; color: #374151; font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <p>Hi ${userName},</p>
    <p>We received a request to reset your password for your CuratoCV account. Use the 6-digit verification code below to proceed with resetting your password.</p>

    ${otp ? `
    <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background-color: #fef2f2; border: 2px dashed #ef4444; padding: 16px 32px; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Password Reset Code</p>
            <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: 700; color: #b91c1c; letter-spacing: 6px; font-family: monospace;">${otp}</p>
        </div>
    </div>
    ` : ''}

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #b91c1c; font-size: 14px;"><strong>Security Notice:</strong> This code will expire in 10 minutes.</p>
    </div>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password Page</a>
    </p>

    <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

    <p style="font-size: 14px; color: #6b7280; word-break: break-all;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #ef4444;">${resetUrl}</a>
    </p>
</div>
`.trim();
};

export default passwordReset;
