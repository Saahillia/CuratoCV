// ============================================================
// Payment Failed Email Template
// ============================================================
//
// Sent if payment fails.
//
// Includes:
// - Order ID
// - Reason (if available)
// - Retry link
// - Support contact information
// ============================================================

/**
 * Generate payment failed email HTML.
 *
 * @param {Object} data
 * @param {string} data.userEmail - User's email address
 * @param {string} data.userName - User's display name (optional)
 * @param {string} data.orderId - Razorpay order ID
 * @param {string} [data.reason] - Failure reason (optional)
 * @param {string} data.appUrl - Base URL for action links
 * @returns {string}
 */
const generatePaymentFailedHTML = (data) => {
    const {
        userEmail,
        userName = "there",
        orderId,
        reason = "Your payment could not be processed",
        appUrl,
    } = data;

    const retryUrl = appUrl ? new URL("/billing/retry", appUrl).toString() : "#";
    const supportUrl = appUrl ? new URL("/support", appUrl).toString() : "#";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - CuratoCV</title>
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
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
        .alert-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .alert-box p {
            margin: 0;
            color: #7f1d1d;
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
        .reason-section {
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .reason-section h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
            color: #92400e;
        }
        .reason-section p {
            margin: 0;
            font-size: 13px;
            color: #b45309;
        }
        .button-group {
            display: flex;
            gap: 12px;
            margin: 24px 0;
            flex-wrap: wrap;
        }
        .cta-button {
            display: inline-block;
            padding: 14px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            flex: 1;
            min-width: 200px;
        }
        .cta-button.primary {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
        }
        .cta-button.primary:hover {
            opacity: 0.9;
        }
        .cta-button.secondary {
            background-color: #f3f4f6;
            color: #111827;
            border: 1px solid #e5e7eb;
        }
        .cta-button.secondary:hover {
            background-color: #e5e7eb;
        }
        .troubleshooting {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
            font-size: 14px;
        }
        .troubleshooting h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        .troubleshooting ul {
            margin: 0;
            padding-left: 20px;
        }
        .troubleshooting li {
            margin-bottom: 8px;
            color: #6b7280;
        }
        .troubleshooting li:last-child {
            margin-bottom: 0;
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
                <h1>Payment Failed</h1>
            </div>

            <div class="content">
                <p class="greeting">Hi ${userName},</p>

                <div class="alert-box">
                    <p>Unfortunately, your payment could not be processed. Please try again or contact our support team for assistance.</p>
                </div>

                <h2 style="font-size: 18px; margin-bottom: 16px; color: #111827;">Order Details</h2>

                <div class="order-details">
                    <div class="detail-row">
                        <span class="detail-label">Order ID</span>
                        <span class="detail-value">${orderId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status</span>
                        <span class="detail-value" style="color: #ef4444;">Failed</span>
                    </div>
                </div>

                ${reason ? `
                <div class="reason-section">
                    <h3>Failure Reason</h3>
                    <p>${reason}</p>
                </div>
                ` : ""}

                <div class="button-group">
                    <a href="${retryUrl}" class="cta-button primary">Retry Payment</a>
                    <a href="${supportUrl}" class="cta-button secondary">Contact Support</a>
                </div>

                <div class="troubleshooting">
                    <h3>Why This Might Have Happened</h3>
                    <ul>
                        <li>Insufficient funds in your account</li>
                        <li>The card was declined by your bank</li>
                        <li>Incorrect card information</li>
                        <li>Temporary network issue</li>
                        <li>Exceeded daily transaction limit</li>
                    </ul>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                    If you continue to experience issues, our support team is here to help. Please reach out to us with your order ID (<strong>${orderId}</strong>) and we'll be happy to assist.
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0; color: #111827; font-weight: 600;">CuratoCV</p>
                <p style="margin: 4px 0;">Professional Resume Building Made Simple</p>
                <div class="footer-links">
                    <a href="${appUrl}">Website</a>
                    <a href="${supportUrl}">Support</a>
                </div>
                <p style="margin: 16px 0 0 0; color: #9ca3af;">© 2024 CuratoCV. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
};

export default generatePaymentFailedHTML;
