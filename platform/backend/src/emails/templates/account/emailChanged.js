/**
 * Generate email changed confirmation.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.oldEmail
 * @param {string} data.newEmail
 * @param {string} data.appUrl
 * @returns {string}
 */
const emailChanged = (data) => {
    const { userName = "there", oldEmail, newEmail, appUrl = "https://curatocv.com" } = data;
    const supportUrl = new URL("/support", appUrl).toString();

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>The email address associated with your CuratoCV account was successfully changed.</p>

    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563;"><strong>Old Email:</strong> ${oldEmail}</p>
        <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>New Email:</strong> ${newEmail}</p>
    </div>

    <p style="text-align: center; margin: 32px 0;">
        <span style="font-size: 14px; color: #6b7280;">If you requested this change, we've sent a verification link to your new address.</span>
    </p>

    <p style="font-weight: bold; color: #b91c1c;">Did not request this change?</p>
    <p>If you did not authorize this, please contact <a href="${supportUrl}" style="color: #667eea;">Support</a> immediately to secure your account.</p>
</div>
`.trim();
};

export default emailChanged;
