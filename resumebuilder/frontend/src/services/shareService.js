// ============================================================
// CuratoCV Share Service
// ============================================================
//
// Manages public resume URL generation, and access control toggles.
// NOTE: Public share read-only API is at /api/resumes/public/:resumeId.
// This module handles authenticated actions (like toggling public status)
// via resume updates (since share toggle is just resume schema data).
// ============================================================

import api from "@curatocv/api-client";

/**
 * Get the public URL for a resume
 * @param {string} resumeId
 * @returns {string} public URL string
 */
export const getPublicUrl = (resumeId) => {
    return `${window.location.origin}/view/${resumeId}`;
};

/**
 * If backend had a separate endpoint, we would call it here.
 * Currently toggling share status is handled through resume updates
 * by sending { public: true } or { public: false } to the resume update endpoint.
 * We expose this helper just in case the app needs a separate service method.
 * @param {string} resumeId
 * @param {boolean} isPublic
 * @returns {Promise<Object>}
 */
export const toggleShareStatus = async (resumeId, isPublic) => {
    const formData = new FormData();
    formData.append("public", isPublic);
    // The resume update endpoint accepts application/json or multipart
    // For simplicity, since we are only sending a boolean, we can send it via PATCH or PUT.
    // Let's assume the frontend resumeService handles this natively
    const response = await api.put(`/resumes/update/${resumeId}`, { public: isPublic });
    return response.data;
};

/**
 * Send the resume link via email if we have backend support
 * @param {Object} payload { resumeId, recipientEmail, message? }
 * @returns {Promise<Object>}
 */
export const sendEmail = async ({ resumeId, recipientEmail, message }) => {
    // Placeholder for backend integration when /api/share/email is created
    const response = await api.post("/share/email", { resumeId, recipientEmail, message });
    return response.data;
};

const shareService = {
    getPublicUrl,
    toggleShareStatus,
    sendEmail
};

export default shareService;
