// ============================================================
// CuratoCV Base Email Template
// ============================================================
//
// Common HTML shell wrapping email contents.
//
// Responsibilities:
// - Provide uniform header branding, responsive grid, and footer
// - Escape header elements safely
// ============================================================

/**
 * Generate standard HTML shell wrapping body content.
 *
 * @param {Object} params
 * @param {string} params.title - Document title & header text
 * @param {string} params.content - HTML body content
 * @param {string} [params.preheader] - Optional preheader text preview
 * @param {string} [params.appUrl] - Application base URL
 * @returns {string} Complete HTML string
 */
export const renderBaseTemplate = ({
    title = "CuratoCV Notice",
    content = "",
    preheader = "",
    appUrl = "https://curatocv.com",
}) => {
    const safeAppUrl = appUrl || "https://curatocv.com";
    const currentYear = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 32px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 36px 32px;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 28px 32px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
        .footer-links {
            margin: 12px 0;
        }
        .footer-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 8px;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        .preheader {
            display: none !important;
            visibility: hidden;
            opacity: 0;
            color: transparent;
            height: 0;
            width: 0;
        }
    </style>
</head>
<body>
    ${preheader ? `<span class="preheader">${preheader}</span>` : ""}
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <h1>CuratoCV</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p style="margin: 0; color: #111827; font-weight: 600;">CuratoCV</p>
                <p style="margin: 4px 0;">AI-Powered Professional Resume Builder</p>
                <div class="footer-links">
                    <a href="${safeAppUrl}">Website</a>
                    <a href="${safeAppUrl}/support">Support</a>
                </div>
                <p style="margin: 12px 0 0 0; color: #9ca3af;">© ${currentYear} CuratoCV. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`.trim();
};

export default renderBaseTemplate;
