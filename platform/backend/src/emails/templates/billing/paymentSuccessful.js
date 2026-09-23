/**
 * Generate payment successful email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.planName
 * @param {number} data.amount
 * @param {string} data.currency
 * @param {string} data.paymentId
 * @param {string} data.invoiceUrl
 * @param {string} data.appUrl
 * @returns {string}
 */
const paymentSuccessful = (data) => {
    const {
        userName = "there",
        planName = "Pro Plan",
        amount = 0,
        currency = "INR",
        paymentId,
        invoiceUrl = "#",
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
    <p>Your payment for <strong>${planName}</strong> was successful! 🎉</p>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <h4 style="margin-top: 0; color: #047857; font-size: 15px;">Payment Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
            <tr><td style="padding: 6px 0;">Plan</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${planName}</td></tr>
            <tr><td style="padding: 6px 0;">Amount Paid</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formattedAmount}</td></tr>
            ${paymentId ? `<tr><td style="padding: 6px 0;">Payment ID</td><td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 13px;">${paymentId}</td></tr>` : ""}
        </table>
    </div>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${invoiceUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Invoice</a>
    </p>

    <p>You can manage your subscription and billing details from your dashboard:</p>
    <p style="text-align: center; margin: 24px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; color: #667eea; text-decoration: underline; font-weight: 500;">Go to Dashboard</a>
    </p>

    <p>Thank you for choosing CuratoCV!</p>
</div>
`.trim();
};

export default paymentSuccessful;