// ============================================================
// CuratoCV User Service Hooks
// ============================================================
//
// Provides extension points for product domains to hook into
// the platform user lifecycle without coupling the platform
// to product-specific logic (e.g. Resume Builder).
// ============================================================

const hooks = {
    deleteHandlers: [],
    resumeProviders: []
};

/**
 * Register a callback to execute when a user is deleted.
 * @param {Function} handler - async (userId) => void
 */
export const registerUserDeleteHook = (handler) => {
    hooks.deleteHandlers.push(handler);
};

/**
 * Register a callback to provide user resumes.
 * @param {Function} handler - async (userId) => Array
 */
export const registerResumeProvider = (handler) => {
    hooks.resumeProviders.push(handler);
};

export const executeUserDeleteHooks = async (userId) => {
    for (const handler of hooks.deleteHandlers) {
        await handler(userId);
    }
};

export const executeResumeProviders = async (userId) => {
    // Return resumes from the first registered provider (if any)
    if (hooks.resumeProviders.length > 0) {
        return await hooks.resumeProviders[0](userId);
    }
    return [];
};
