// ============================================================
// Subscription Active Email Template
// ============================================================
//
// Sent after subscription is activated.
//
// Includes:
// - Plan tier
// - Benefits (resume limit, AI credits)
// - Start date
// - End date
// - Action button to go to dashboard
// ============================================================

/**
 * Generate subscription active email HTML.
 *
 * @param {Object} data
 * @param {string} data.userEmail - User's email address
 * @param {string} data.userName - User's display name (optional)
 * @param {string} data.planName - Plan tier name (e.g., "Pro")
 * @param {number} data.resumeLimit - Number of resumes allowed
 * @param {number} data.aiCredits - AI credits per period
 * @param {Date} data.startDate - Subscription start date
 * @param {Date} data.endDate - Subscription end date
 * @param {string} data.appUrl - Base URL for action links
 * @returns {string}
 */
const generateSubscriptionActiveHTML = (data) => {
    const {
        userEmail,
        userName = "there",
        planName,
        resumeLimit,
        aiCredits,
        startDate,
        endDate,
        appUrl,
    } = data;

    const startDateFormatted = new Date(startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const endDateFormatted = new Date(endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const dashboardUrl = appUrl ? new URL("/dashboard", appUrl).toString() : "#";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Activated - CuratoCV</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        .plan-highlight {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-left: 4px solid #0ea5e9;
            padding: 24px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .plan-name {
            font-size: 20px;
            font-weight: 700;
            color: #0c4a6e;
            margin: 0 0 16px 0;
        }
        .benefits-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 24px 0;
        }
        .benefit-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .benefit-icon {
            font-size: 28px;
            margin-bottom: 8px;
        }
        .benefit-value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin: 8px 0;
        }
        .benefit-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .timeline {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .timeline-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        .timeline-item:last-child {
            margin-bottom: 0;
        }
        .timeline-dot {
            width: 16px;
            height: 16px;
            background-color: #667eea;
            border-radius: 50%;
            margin-right: 16px;
            margin-top: 4px;
            flex-shrink: 0;
        }
        .timeline-content h4 {
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
        }
        .timeline-content p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        .features-section {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
            font-size: 14px;
        }
        .features-section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        .features-list {
            margin: 0;
            padding-left: 20px;
        }
        .features-list li {
            margin-bottom: 8px;
            color: #6b7280;
        }
        .features-list li:last-child {
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
                <h1>Subscription Active!</h1>
            </div>

            <div class="content">
                <p class="greeting">Hi ${userName},</p>

                <p>Welcome to the ${planName} plan! Your subscription is now active and you have access to all premium features.</p>

                <div class="plan-highlight">
                    <p class="plan-name">${planName}</p>
                    <p style="margin: 0; color: #06b6d4; font-size: 14px;">Your subscription is now active</p>
                </div>

                <h2 style="font-size: 18px; margin-bottom: 16px; color: #111827;">Your Benefits</h2>

                <div class="benefits-grid">
                    <div class="benefit-card">
                        <div class="benefit-icon">📄</div>
                        <div class="benefit-value">${resumeLimit === null ? "Unlimited" : resumeLimit}</div>
                        <div class="benefit-label">Resumes</div>
                    </div>
                    <div class="benefit-card">
                        <div class="benefit-icon">✨</div>
                        <div class="benefit-value">${aiCredits}</div>
                        <div class="benefit-label">AI Credits</div>
                    </div>
                </div>

                <h2 style="font-size: 18px; margin-bottom: 16px; color: #111827;">Subscription Timeline</h2>

                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h4>Started</h4>
                            <p>${startDateFormatted}</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h4>Renews On</h4>
                            <p>${endDateFormatted}</p>
                        </div>
                    </div>
                </div>

                <p style="text-align: center; margin: 24px 0;">
                    <a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>
                </p>

                <div class="features-section">
                    <h3>What You Can Do Now</h3>
                    <ul class="features-list">
                        <li>Create and edit unlimited ${planName === "Free" ? "2" : "unlimited"} resumes</li>
                        <li>Use AI-powered resume enhancement and suggestions</li>
                        <li>Access advanced customization and templates</li>
                        <li>Download resumes in multiple formats</li>
                        <li>Share your resume publicly or with specific people</li>
                    </ul>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                    Need help getting started? Visit our support center or contact our team anytime.
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

export default generateSubscriptionActiveHTML;
