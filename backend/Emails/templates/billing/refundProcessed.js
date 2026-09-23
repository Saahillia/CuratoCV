/**
 * Generate refund processed email HTML.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.planName
 * @param {number} data.amountMinor
 * @param {string} data.currency
 * @param {string} data.refundReason
 * @param {string} data.appUrl
 * @returns {string}
 */
const generateRefundProcessedHTML = (data) => {
    const {
        userName = "there",
        planName,
        amountMinor,
        currency = "INR",
        refundReason = "Refund processed.",
        appUrl,
    } = data;

    const amount = (amountMinor / 100).toFixed(2);
    const billingUrl = appUrl ? new URL("/billing", appUrl).toString() : "#";

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Refund Processed - CuratoCV</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
.email-wrapper { background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
.header h1 { margin: 0; font-size: 24px; font-weight: 600; }
.content { padding: 40px; }
.greeting { font-size: 16px; margin-bottom: 24px; }
.alert-box { background-color: #eff6ff; border-left: 4px solid #667eea; padding: 16px; margin: 24px 0; border-radius: 4px; }
.alert-box p { margin: 0; color: #1e3a8a; font-size: 14px; }
.detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
.detail-row:last-child { border-bottom: none; }
.cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 24px 0; text-align: center; }
.footer { background-color: #f3f4f6; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
<div class="container">
<div class="email-wrapper">
<div class="header"><h1>Refund Processed</h1></div>
<div class="content">
<p class="greeting">Hi ${userName},</p>
<div class="alert-box"><p>A refund for your <strong>${planName}</strong> subscription has been processed.</p></div>
<div style="background:#f3f4f6; border-radius:8px; padding:20px; margin:24px 0;">
<div class="detail-row"><span style="font-weight:600; color:#6b7280;">Plan</span><span style="font-weight:500; color:#111827;">${planName}</span></div>
<div class="detail-row"><span style="font-weight:600; color:#6b7280;">Amount</span><span style="font-weight:500; color:#111827;">${currency} ${amount}</span></div>
<div class="detail-row"><span style="font-weight:600; color:#6b7280;">Reason</span><span style="font-weight:500; color:#111827;">${refundReason}</span></div>
</div>
<p style="text-align:center; margin:24px 0;"><a href="${billingUrl}" class="cta-button">View Billing</a></p>
</div>
<div class="footer">
<p style="margin:0; color:#111827; font-weight:600;">CuratoCV</p>
<p style="margin:4px 0;">Professional Resume Building Made Simple</p>
</div>
</div>
</div>
</body>
</html>
`.trim();
};

export default generateRefundProcessedHTML;
