/**
 * Generate password changed confirmation email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.appUrl
 * @returns {string}
 */
const passwordChanged = (data) => {
    const { userName = "there", appUrl = "https://curatocv.com" } = data;
    const loginUrl = new URL("/login", appUrl).toString();
    const supportUrl = new URL("/support", appUrl).toString();

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>Your CuratoCV account password has been successfully changed.</p>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #047857; font-size: 14px;">If you made this change, no further action is required.</p>
    </div>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Log In to Your Account</a>
    </p>

    <p style="font-weight: bold; color: #b91c1c;">Did not request this change?</p>
    <p>If you did not change your password, please secure your account immediately by resetting your password and contacting <a href="${supportUrl}" style="color: #667eea;">Support</a>.</p>
</div>
`.trim();
};

export default passwordChanged;
