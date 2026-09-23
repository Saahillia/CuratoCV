// ============================================================
// Order Confirmation Email Template
// ============================================================
//
// Sent after successful payment.
//
// Includes:
// - Order ID
// - Plan name
// - Billing period
// - Amount
// - Renewal date
// - Action button to view subscription
// ============================================================

/**
 * Generate order confirmation email HTML.
 *
 * @param {Object} data
 * @param {string} data.userEmail - User's email address
 * @param {string} data.userName - User's display name (optional)
 * @param {string} data.orderId - Razorpay order ID
 * @param {string} data.planName - Plan tier name (e.g., "Pro")
 * @param {string} data.billingPeriod - Billing period (e.g., "monthly")
 * @param {number} data.amountMinor - Amount in smallest currency unit
 * @param {string} data.currency - Currency code (e.g., "INR")
 * @param {Date} data.renewalDate - Subscription renewal date
 * @param {string} data.appUrl - Base URL for action links
 * @returns {string}
 */
const generateOrderConfirmationHTML = (data) => {
    const {
        userEmail,
        userName = "there",
        orderId,
        planName,
        billingPeriod,
        amountMinor,
        currency,
        renewalDate,
        appUrl,
    } = data;

    const amount = (amountMinor / 100).toFixed(2);
    const renewalDateFormatted = new Date(renewalDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const billingPeriodLabel =
        {
            monthly: "1 Month",
            three_month: "3 Months",
            six_month: "6 Months",
            yearly: "1 Year",
        }[billingPeriod] || billingPeriod;

    const dashboardUrl = appUrl ? new URL("/dashboard", appUrl).toString() : "#";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - CuratoCV</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 24px;
        }
        .success-message {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .success-message p {
            margin: 0;
            color: #065f46;
            font-size: 14px;
        }
        .order-details {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 14px;
        }
        .detail-value {
            color: #111827;
            font-size: 14px;
            font-weight: 500;
        }
        .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            border-top: 2px solid #e5e7eb;
            border-bottom: 2px solid #e5e7eb;
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin: 16px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            text-align: center;
        }
        .cta-button:hover {
            opacity: 0.9;
        }
        .info-section {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
            font-size: 14px;
            line-height: 1.8;
        }
        .info-section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        .info-section p {
            margin: 0;
            color: #6b7280;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
        .footer-links {
            margin: 16px 0;
        }
        .footer-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 12px;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <h1>Order Confirmed</h1>
            </div>

            <div class="content">
                <p class="greeting">Hi ${userName},</p>

                <div class="success-message">
                    <p>Your payment has been successfully processed. Your subscription is now active!</p>
                </div>

                <h2 style="font-size: 18px; margin-bottom: 16px; color: #111827;">Order Details</h2>

                <div class="order-details">
                    <div class="detail-row">
                        <span class="detail-label">Order ID</span>
                        <span class="detail-value">${orderId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Plan</span>
                        <span class="detail-value">${planName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Billing Period</span>
                        <span class="detail-value">${billingPeriodLabel}</span>
                    </div>
                    <div class="amount-row">
                        <span>${currency} ${amount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Renews On</span>
                        <span class="detail-value">${renewalDateFormatted}</span>
                    </div>
                </div>

                <p style="text-align: center; margin: 24px 0;">
                    <a href="${dashboardUrl}" class="cta-button">View Your Subscription</a>
                </p>

                <div class="info-section">
                    <h3>What's Next?</h3>
                    <p>Your ${planName} subscription is now active. Log in to your dashboard to start using premium features, including AI-powered resume assistance and advanced customization options.</p>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                    If you have any questions about your subscription or need support, please don't hesitate to reach out to our support team.
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0; color: #111827; font-weight: 600;">CuratoCV</p>
                <p style="margin: 4px 0;">Professional Resume Building Made Simple</p>
                <div class="footer-links">
                    <a href="${appUrl}">Website</a>
                    <a href="${appUrl}/support">Support</a>
                </div>
                <p style="margin: 16px 0 0 0; color: #9ca3af;">© 2024 CuratoCV. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
};

export default generateOrderConfirmationHTML;
