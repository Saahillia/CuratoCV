/**
 * Generate resume deleted email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @param {string} data.resumeName
 * @returns {string}
 */
const resumeDeleted = (data) => {
    const { userName = "there", resumeName = "Your Resume" } = data;

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>Your resume <strong>"${resumeName}"</strong> has been permanently deleted from CuratoCV.</p>

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #b91c1c; font-size: 14px;"><strong>Note:</strong> This action is irreversible. All resume content, versions, and analytics have been permanently erased.</p>
    </div>

    <p>Need a new resume? You can create one anytime from your dashboard.</p>
</div>
`.trim();
};

export default resumeDeleted;