// ============================================================
// CuratoCV Resume Draft Persistence
// ============================================================
//
// Stores a separate local draft for every resume.
//
// LocalStorage is treated only as a recovery/fast-load mechanism.
// The backend remains the authoritative persisted source.
//
// Storage format:
//
//   curatocv_resume_draft:<resumeId>
//
// {
//     id: "<resumeId>",
//     data: { ...canonicalResume },
//     savedAt: "<ISO timestamp>"
// }
// ============================================================

const STORAGE_KEY_PREFIX = "curatocv_resume_draft:";

const getStorageKey = (resumeId) => {
    if (!resumeId || typeof resumeId !== "string") {
        return null;
    }

    return `${STORAGE_KEY_PREFIX}${resumeId}`;
};

/**
 * Save a resume draft locally.
 *
 * @param {string} resumeId
 * @param {object} resumeData
 * @returns {object|null} stored draft metadata
 */
export const saveResumeToLocal = (
    resumeId,
    resumeData
) => {
    const storageKey =
        getStorageKey(resumeId);

    if (
        !storageKey ||
        !resumeData ||
        typeof resumeData !== "object"
    ) {
        return null;
    }

    const savedAt =
        new Date().toISOString();

    const payload = {
        id: resumeId,
        data: resumeData,
        savedAt,
    };

    try {
        localStorage.setItem(
            storageKey,
            JSON.stringify(payload)
        );

        return payload;
    } catch (error) {
        console.warn(
            "Failed to save resume draft to localStorage:",
            error
        );

        return null;
    }
};

/**
 * Load the local draft for one specific resume.
 *
 * @param {string} resumeId
 * @returns {object|null} full draft payload including savedAt
 */
export const loadResumeFromLocal = (
    resumeId
) => {
    const storageKey =
        getStorageKey(resumeId);

    if (!storageKey) {
        return null;
    }

    try {
        const raw =
            localStorage.getItem(
                storageKey
            );

        if (!raw) {
            return null;
        }

        const parsed =
            JSON.parse(raw);

        if (
            !parsed ||
            parsed.id !== resumeId ||
            !parsed.data ||
            typeof parsed.data !== "object"
        ) {
            return null;
        }

        return {
            id: resumeId,
            data: parsed.data,
            savedAt:
                typeof parsed.savedAt === "string"
                    ? parsed.savedAt
                    : null,
        };
    } catch (error) {
        console.warn(
            "Failed to load resume draft from localStorage:",
            error
        );

        return null;
    }
};

/**
 * Remove the local draft for one resume.
 *
 * @param {string} resumeId
 */
export const clearResumeFromLocal = (
    resumeId
) => {
    const storageKey =
        getStorageKey(resumeId);

    if (!storageKey) {
        return;
    }

    try {
        localStorage.removeItem(
            storageKey
        );
    } catch {
        // LocalStorage cleanup is best-effort.
    }
};

/**
 * Remove all CuratoCV resume drafts.
 *
 * Useful for logout/account cleanup.
 */
export const clearAllResumeDrafts = () => {
    try {
        const keys = [];

        for (
            let index = 0;
            index < localStorage.length;
            index += 1
        ) {
            const key =
                localStorage.key(index);

            if (
                key &&
                key.startsWith(
                    STORAGE_KEY_PREFIX
                )
            ) {
                keys.push(key);
            }
        }

        keys.forEach((key) => {
            localStorage.removeItem(key);
        });
    } catch {
        // LocalStorage cleanup is best-effort.
    }
};

export default {
    saveResumeToLocal,
    loadResumeFromLocal,
    clearResumeFromLocal,
    clearAllResumeDrafts,
};
