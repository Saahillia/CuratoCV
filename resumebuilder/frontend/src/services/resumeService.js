// ============================================================
// CuratoCV Resume Service
// ============================================================
//
// Wraps the resume CRUD API endpoints backed by the backend
// resumeRouter mounted at "/api/resumes".
//
// Endpoints used (backend/Routes/resumeRoutes.js):
//   POST   /api/resumes/create            (auth required)
//   PUT    /api/resumes/update/:resumeId  (auth required, multipart)
//   DELETE /api/resumes/delete/:resumeId  (auth required)
//   GET    /api/resumes/get/:resumeId     (auth required)
//   GET    /api/resumes/public/:resumeId  (public)
//
// Responsibilities:
// - createResume, updateResume, deleteResume, getResume,
//   getUserResumes
//
// SECURITY NOTES
// ------------------------------------------------------------
// - Resume ownership is enforced by the backend. The frontend
//   only passes the resumeId; it never authorizes itself.
// - Resume creation limits are enforced by the backend via the
//   user's entitlement. Do NOT gate creation on client state.
// - updateResume sends multipart/form-data because the backend
//   accepts an "image" file upload via multer. When no file is
//   present we still use FormData so the field shape matches.
// ============================================================

import api from "@curatocv/api-client";

// ============================================================
// Public methods
// ============================================================

/**
 * Create a new resume for the authenticated user.
 * @param {Object} payload - resume data (matches backend schema)
 * @returns {Promise<Object>} created resume from backend
 */
async function createResume(payload) {
    const response = await api.post("/resumes/create", payload);
    return response.data;
}

/**
 * Update an existing resume.
 * Uses multipart/form-data because the backend route accepts an
 * optional "image" file via multer.
 *
 * @param {string} resumeId
 * @param {Object} payload - fields to update; may include a
 *                           `image` File for upload.
 * @returns {Promise<Object>} updated resume from backend
 */
async function updateResume(resumeId, payload = {}) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        // File objects go through as-is; everything else as string.
        if (value instanceof File) {
            formData.append(key, value);
        } else if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    });

    const response = await api.put(`/resumes/update/${resumeId}`, formData, {
        headers: {
            // Let axios set the correct multipart boundary.
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

/**
 * Delete a resume by id. Ownership enforced server-side.
 * @param {string} resumeId
 * @returns {Promise<Object>} delete result from backend
 */
async function deleteResume(resumeId) {
    const response = await api.delete(`/resumes/delete/${resumeId}`);
    return response.data;
}

/**
 * Fetch a single resume by id. Ownership enforced server-side.
 * @param {string} resumeId
 * @returns {Promise<Object>} resume from backend
 */
async function getResume(resumeId) {
    const response = await api.get(`/resumes/get/${resumeId}`);
    return response.data;
}

/**
 * Fetch the authenticated user's resumes.
 * Delegates to the users endpoint (GET /api/users/resumes),
 * which returns the current user's resumes.
 * @returns {Promise<Array>} list of resumes from backend
 */
async function getUserResumes() {
    const response = await api.get("/users/resumes");
    return response.data;
}

const resumeService = {
    createResume,
    updateResume,
    deleteResume,
    getResume,
    getUserResumes,
};

export default resumeService;
