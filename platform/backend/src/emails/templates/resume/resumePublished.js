/**
 * Generate resume published email content.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @param {string} data.publicUrl
 * @returns {string}
 */
const resumePublished = (data) => {
    const { userName = "there", resumeName = "Your Resume", publicUrl = "#" } = data;

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>Your resume <strong>"${resumeName}"</strong> has been successfully published!</p>

    <p>Recruiters and employers can now view your public resume at the following link:</p>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #047857; font-size: 14px; word-break: break-all;">
            <a href="${publicUrl}" style="color: #047857;">${publicUrl}</a>
        </p>
    </div>

    <p>You can unpublish this link at any time to hide it from the public.</p>
</div>
`.trim();
};

export default resumePublished;
