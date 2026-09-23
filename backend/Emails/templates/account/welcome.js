/**
 * Generate welcome email inner content.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.appUrl
 * @returns {string}
 */
const welcomeEmail = (data) => {
    const { userName = "there", appUrl = "https://curatocv.com" } = data;
    const dashboardUrl = new URL("/dashboard", appUrl).toString();

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>Welcome to CuratoCV! We're thrilled to have you on board. CuratoCV is designed to help you craft professional, compelling resumes in minutes, powered by AI.</p>

    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #111827; font-size: 16px;">Next steps to get started:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Log in to your dashboard</li>
            <li style="margin-bottom: 8px;">Create your first resume profiling your core skills</li>
            <li style="margin-bottom: 8px;">Use the AI Assistant to refine your summary and experience bullet points</li>
        </ol>
    </div>

    <p style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
    </p>

    <p>If you have any questions, our support team is always here to help.</p>
</div>
`.trim();
};

export default welcomeEmail;
