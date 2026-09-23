// ============================================================
// CuratoCV Auth Service
// ============================================================
//
// Thin wrapper around the user/auth API endpoints.
//
// Responsibilities:
// - register, login, logout, getCurrentUser
// - Persist/remove the JWT in localStorage
//
// SECURITY NOTES
// ------------------------------------------------------------
// - The token is an opaque credential issued by the backend.
//   The frontend treats it as untrusted data: it only stores
//   it and attaches it to requests via the api interceptor.
// - NEVER decode the JWT on the frontend to decide pricing,
//   plan, or entitlement. Those come from dedicated backend
//   endpoints (subscriptionService).
// - `logout` only clears local state. Session invalidation,
//   if any, is enforced by the backend.
// ============================================================

import api, { TOKEN_STORAGE_KEY } from "./api";

// ============================================================
// Helpers
// ============================================================

function persistToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
}

// ============================================================
// Public methods
// ============================================================

/**
 * Register a new user.
 * @param {Object} payload
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} payload.password
 * @returns {Promise<Object>} { token, user } (shape from backend)
 */
async function register({ name, email, password }) {
    const response = await api.post("/users/register", {
        name,
        email,
        password,
    });

    const data = response.data;
    persistToken(data?.token);
    return data;
}

/**
 * Log in an existing user.
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 * @returns {Promise<Object>} { token, user } (shape from backend)
 */
async function login({ email, password }) {
    const response = await api.post("/users/login", {
        email,
        password,
    });

    const data = response.data;
    persistToken(data?.token);
    return data;
}

/**
 * Clear local auth state. The backend remains authoritative for
 * any server-side session validity.
 */
function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Fetch the currently authenticated user's canonical account profile.
 * Requires a valid token (auto-attached by the api interceptor).
 * @returns {Promise<Object>} user profile response from backend ({ success, data })
 */
async function getCurrentUser() {
    const response = await api.get("/users/me");
    return response.data;
}

/**
 * Update the currently authenticated user's canonical account profile.
 * @param {Object} payload - { name }
 * @returns {Promise<Object>} updated user profile response from backend ({ success, data })
 */
async function updateCurrentUser(payload) {
    const response = await api.patch("/users/me", payload);
    return response.data;
}

/**
 * Fetch the authenticated user's resumes. Convenience that
 * delegates to the users endpoint (same data is also available
 * from resumeService once resume endpoints are finalized).
 * @returns {Promise<Array>} list of resumes from backend
 */
async function getUserResumes() {
    const response = await api.get("/users/resumes");
    return response.data;
}

const authService = {
    register,
    login,
    logout,
    getCurrentUser,
    updateCurrentUser,
    getUserResumes,
};

export default authService;
