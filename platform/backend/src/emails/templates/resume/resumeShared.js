/**
 * Generate resume shared email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @param {string} data.recipientEmail
 * @param {string} data.shareUrl
 * @param {string} data.appUrl
 * @returns {string}
 */
const resumeShared = (data) => {
    const {
        userName = "there",
        resumeName = "Your Resume",
        recipientEmail,
        shareUrl = "#",
        appUrl = "https://curatocv.com"
    } = data;

    const resumeUrl = new URL(`/resume/${shareUrl}`, appUrl).toString();

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>Your resume <strong>"${resumeName}"</strong> has been shared with <strong>${recipientEmail}</strong>.</p>

    <p>The recipient can view the resume at:</p>

    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; word-break: break-all;">
            <a href="${resumeUrl}" style="color: #1e40af;">${resumeUrl}</a>
        </p>
    </div>

    <p>You can revoke access to this shared link at any time from your dashboard.</p>
</div>
`.trim();
};

export default resumeShared;