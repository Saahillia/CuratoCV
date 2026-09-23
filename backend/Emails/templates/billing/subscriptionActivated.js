/**
 * Generate subscription activated email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.planName
 * @param {number} data.amount
 * @param {string} data.currency
 * @param {string} data.startDate
 * @param {string} data.appUrl
 * @returns {string}
 */
const subscriptionActivated = (data) => {
    const {
        userName = "there",
        planName = "Pro Plan",
        amount = 0,
        currency = "INR",
        startDate,
        appUrl = "https://curatocv.com"
    } = data;

    const formattedAmount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount / 100);

    const dashboardUrl = new URL("/dashboard", appUrl).toString();

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>Your <strong>CuratoCV Premium</strong> subscription has been activated successfully!</p>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <h4 style="margin-top: 0; color: #047857; font-size: 15px;">Subscription Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
            <tr><td style="padding: 6px 0;">Plan</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${planName}</td></tr>
            <tr><td style="padding: 6px 0;">Amount Paid</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formattedAmount}</td></tr>
            <tr><td style="padding: 6px 0;">Start Date</td><td style="padding: 6px 0; text-align: right;">${startDate || "Today"}</td></tr>
        </table>
    </div>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Dashboard</a>
    </p>

    <p>You can now access all premium features including AI credits and advanced resume templates.</p>
</div>
`.trim();
};

export default subscriptionActivated;