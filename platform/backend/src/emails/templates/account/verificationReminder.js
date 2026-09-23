/**
 * Generate verification reminder email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.verifyUrl
 * @returns {string}
 */
const verificationReminder = (data) => {
    const { userName = "there", verifyUrl = "#" } = data;

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>We noticed you haven't verified your email address yet. Completing this step is necessary to secure your CuratoCV account and maintain access to your resumes.</p>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Your Email Now</a>
    </p>

    <p style="font-size: 14px; color: #6b7280; word-break: break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verifyUrl}" style="color: #d97706;">${verifyUrl}</a>
    </p>

    <p>If you did not request this account, please ignore this email.</p>
</div>
`.trim();
};

export default verificationReminder;
