// ============================================================
// CuratoCV AI Service
// ============================================================
//
// Wraps the AI assistant API endpoints. The backend AI routes
// (mounted at /api/ai) currently expose:
//   POST /api/ai/enhance-pro-sum
//   POST /api/ai/enhance-job-desc
//   POST /api/ai/upload-resume
//
// These are specific enhance actions rather than a generic
// "generateContent" / "improveContent" interface.
//
// TODO: Once the backend exposes a generic content generation
// endpoint (or the API shape is finalized), update the methods
// below to match. The current methods map 1:1 to the existing
// backend actions.
//
// SECURITY NOTES
// ------------------------------------------------------------
// - AI credit consumption is enforced by the backend. The
//   frontend does not track or gate AI usage locally.
// - The backend independently verifies the user's AI entitlement
//   on each call. Frontend UI may show remaining credits from
//   subscriptionService.getAIEntitlement() for UX only.
// ============================================================

import api from "@curatocv/api-client";

// ============================================================
// Public methods (current backend endpoints)
// ============================================================

/**
 * Enhance / rewrite a professional summary.
 * Backend endpoint: POST /api/ai/enhance-pro-sum
 * @param {Object} payload
 * @param {string} payload.summary - current professional summary
 * @returns {Promise<Object>} enhanced summary from backend
 */
async function enhanceProfessionalSummary({ summary }) {
    const response = await api.post("/ai/enhance-pro-sum", {
        userContent: summary,
    });
    return response.data;
}

/**
 * Enhance / rewrite a job description.
 * Backend endpoint: POST /api/ai/enhance-job-desc
 * @param {Object} payload
 * @param {string} payload.description - current job description
 * @returns {Promise<Object>} enhanced description from backend
 */
async function enhanceJobDescription({ description }) {
    const response = await api.post("/ai/enhance-job-desc", {
        userContent: description,
    });
    return response.data;
}

async function getEntryTips({ section, entry }) {
    const response = await api.post("/ai/entry-tips", { section, entry });
    return response.data;
}

/**
 * Upload and parse resume text for AI processing.
 * Backend endpoint: POST /api/ai/upload-resume
 * Accepts JSON payload matching backend requirements: { title, resumeText }
 *
 * @param {Object|File} payload - If Object, contains { title, resumeText }; if File, fallback warning.
 * @returns {Promise<Object>} parsed/processed result from backend
 */
async function uploadResume(payload) {
    if (typeof payload === "object" && payload.resumeText) {
        const response = await api.post("/ai/upload-resume", {
            title: payload.title || "Untitled Resume",
            resumeText: payload.resumeText,
        });
        return response.data;
    }

    throw new Error(
        "Invalid payload for uploadResume: requires { title, resumeText } text payload.",
    );
}

// ============================================================
// TODO: Future generic interface (when backend adds it)
// ============================================================
//
// The methods below are placeholders for the eventual generic
// interface. They currently throw with a TODO note. Once the
// backend exposes /api/ai/generate and /api/ai/improve (or
// similar), implement them by calling the appropriate endpoints.
//
// async function generateContent({ section, context }) {
//     // TODO: Replace with actual backend endpoint when available
//     // e.g., await api.post("/ai/generate", { section, context });
//     throw new Error("TODO: generateContent endpoint not yet implemented on backend");
// }
//
// async function improveContent({ section, content, instructions }) {
//     // TODO: Replace with actual backend endpoint when available
//     // e.g., await api.post("/ai/improve", { section, content, instructions });
//     throw new Error("TODO: improveContent endpoint not yet implemented on backend");
// }

// ============================================================
// Export
// ============================================================

const aiService = {
    // Current backend-mapped methods
    enhanceProfessionalSummary,
    enhanceJobDescription,
    uploadResume,
    getEntryTips,

    // TODO: Uncomment and implement when backend adds generic endpoints
    // generateContent,
    // improveContent,
};

export default aiService;
