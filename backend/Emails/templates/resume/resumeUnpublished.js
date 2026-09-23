/**
 * Generate resume unpublished email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @returns {string}
 */
const resumeUnpublished = (data) => {
    const { userName = "there", resumeName = "Your Resume" } = data;

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>Your resume <strong>"${resumeName}"</strong> has been successfully unpublished.</p>

    <div style="background-color: #f3f4f6; border-left: 4px solid #9ca3af; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #4b5563; font-size: 14px;">The public link to this resume is no longer accessible. You can republish it anytime.</p>
    </div>
</div>
`.trim();
};

export default resumeUnpublished;
