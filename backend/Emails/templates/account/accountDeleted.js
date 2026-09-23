/**
 * Generate account deleted email.
 *
 * @param {Object} data
 * @param {string} data.userName
 * @returns {string}
 */
const accountDeleted = (data) => {
    const { userName = "there" } = data;

    return `
<div style="font-size: 16px; color: #374151;">
    <p>Hi ${userName},</p>
    <p>This email confirms that your CuratoCV account has been permanently deleted, and all your records, resumes, and credits have been cleared from our systems.</p>

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #b91c1c; font-size: 14px;"><strong>Note:</strong> This action is irreversible. All data has been permanently erased.</p>
    </div>

    <p>We're sorry to see you go! If you choose to return in the future, you are always welcome to sign up again.</p>
    <p>Thank you for using CuratoCV.</p>
</div>
`.trim();
};

export default accountDeleted;
