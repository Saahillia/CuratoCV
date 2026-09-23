/**
 * Generate security alert email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.alertDetails
 * @param {string} data.appUrl
 * @returns {string}
 */
const securityAlert = (data) => {
    const { userName = "there", alertDetails = "Suspicious activity detected.", appUrl = "https://curatocv.com" } = data;
    const recoveryUrl = new URL("/support", appUrl).toString();

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>We detected something unusual on your CuratoCV account. To ensure your account remains secure, please review the security alert details below:</p>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <h4 style="margin-top: 0; color: #b45309; font-size: 15px;">Alert Activity:</h4>
        <p style="margin: 0; color: #78350f; font-size: 14px; white-space: pre-line;">${alertDetails}</p>
    </div>

    <p>If this check was NOT authorized by you, please reset your password immediately and contact support:</p>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${recoveryUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Contact Support</a>
    </p>

    <p>Best regards,<br>The CuratoCV Security Team</p>
</div>
`.trim();
};

export default securityAlert;
