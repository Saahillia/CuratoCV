/**
 * Generate verify email content.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.verifyUrl
 * @param {string} data.otp
 * @returns {string}
 */
const verifyEmail = (data) => {
    const { userName = "there", verifyUrl = "#", otp = "" } = data;

    return `
<div style="font-size: 16px; color: #374151; font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <p>Hi ${userName},</p>
    <p>Thank you for signing up for CuratoCV! Please use the verification code below to verify your email address and secure your account.</p>

    ${otp ? `
    <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background-color: #f3f4f6; border: 2px dashed #3b82f6; padding: 16px 32px; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
            <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: 700; color: #1e40af; letter-spacing: 6px; font-family: monospace;">${otp}</p>
        </div>
    </div>
    ` : ''}

    <div style="background-color: #ebf5ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Note:</strong> This code will expire in 10 minutes.</p>
    </div>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email Address</a>
    </p>

    <p style="font-size: 14px; color: #6b7280; word-break: break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verifyUrl}" style="color: #3b82f6;">${verifyUrl}</a>
    </p>
</div>
`.trim();
};

export default verifyEmail;
