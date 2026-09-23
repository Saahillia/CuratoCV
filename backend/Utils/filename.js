// ============================================================
// CuratoCV Filename Utilities
// ============================================================
//
// Centralized filename generation for exported resume files.
//
// Responsibilities:
// - Convert user-provided resume titles into safe filenames
// - Remove filesystem-unsafe characters
// - Prevent path traversal
// - Prevent excessively long filenames
// - Generate CuratoCV PDF filenames
//
// NOT responsible for:
// - Creating files
// - Generating PDFs
// - Uploading files
// - HTTP responses
//
// PDF creation belongs to pdfService.js.
// ============================================================

// ============================================================
// Configuration
// ============================================================

const DEFAULT_RESUME_TITLE =
    "Untitled Resume";

const CURATOCV_SUFFIX =
    "CuratoCV";

const MAX_FILENAME_LENGTH =
    180;

// Characters that are unsafe or problematic across common
// operating systems/filesystems.
//
// We intentionally remove:
// - path separators
// - control characters
// - Windows reserved filename characters
// - characters commonly interpreted by shells/filesystems
const UNSAFE_FILENAME_CHARACTERS =
    /[<>:"/\\|?*\u0000-\u001F\u007F]/g;

// Replace repeated whitespace with one space.
const REPEATED_WHITESPACE =
    /\s+/g;

// Replace repeated underscores/hyphens generated during
// sanitization.
const REPEATED_UNDERSCORES =
    /_+/g;

// Remove leading/trailing separators.
const EDGE_SEPARATORS =
    /^[_\-. ]+|[_\-. ]+$/g;

// ============================================================
// sanitizeFilename
// ============================================================

/**
 * Convert arbitrary user-provided text into a safe filename.
 *
 * @param {string} value
 * @param {string} fallback
 * @returns {string}
 */
const sanitizeFilename = (
    value,
    fallback = DEFAULT_RESUME_TITLE
) => {
    let filename =
        typeof value === "string"
            ? value.trim()
            : "";

    if (!filename) {
        filename =
            fallback;
    }

    /*
     * Remove filesystem-unsafe characters.
     */
    filename =
        filename.replace(
            UNSAFE_FILENAME_CHARACTERS,
            ""
        );

    /*
     * Normalize whitespace.
     */
    filename =
        filename.replace(
            REPEATED_WHITESPACE,
            " "
        );

    /*
     * Convert spaces to underscores.
     *
     * This produces predictable download filenames and avoids
     * awkward URL/file-header encoding.
     */
    filename =
        filename.replace(
            /\s/g,
            "_"
        );

    /*
     * Prevent repeated underscores.
     */
    filename =
        filename.replace(
            REPEATED_UNDERSCORES,
            "_"
        );

    /*
     * Remove separators from the beginning/end.
     */
    filename =
        filename.replace(
            EDGE_SEPARATORS,
            ""
        );

    /*
     * Prevent an empty result after sanitization.
     */
    if (!filename) {
        filename =
            fallback;
    }

    /*
     * Prevent excessively long filesystem names.
     */
    filename =
        filename.slice(
            0,
            MAX_FILENAME_LENGTH
        );

    /*
     * Clean the result again in case truncation ends with an
     * unwanted separator.
     */
    filename =
        filename.replace(
            EDGE_SEPARATORS,
            ""
        );

    return (
        filename ||
        fallback
    );
};

// ============================================================
// createResumePdfFilename
// ============================================================

/**
 * Generate the final CuratoCV PDF filename.
 *
 * Example:
 *
 *     "Software Engineer - Amazon"
 *
 * becomes:
 *
 *     "Software_Engineer_-_Amazon_CuratoCV.pdf"
 *
 * @param {string} resumeTitle
 * @returns {string}
 */
const createResumePdfFilename = (
    resumeTitle
) => {
    const safeTitle =
        sanitizeFilename(
            resumeTitle
        );

    return `${safeTitle}_${CURATOCV_SUFFIX}.pdf`;
};

// ============================================================
// createResumeFilename
// ============================================================
//
// Generic helper when the caller wants a specific extension.
//
// The extension is normalized so callers cannot accidentally
// create a path or inject additional filename content.
// ============================================================

/**
 * Generate a safe filename with a supplied extension.
 *
 * @param {string} name
 * @param {string} extension
 * @returns {string}
 */
const createFilename = (
    name,
    extension
) => {
    const safeName =
        sanitizeFilename(
            name
        );

    const normalizedExtension =
        typeof extension ===
            "string"
            ? extension
                  .trim()
                  .replace(
                      /^\.+/,
                      ""
                  )
                  .replace(
                      /[^a-zA-Z0-9]/g,
                      ""
                  )
            : "";

    if (
        !normalizedExtension
    ) {
        return safeName;
    }

    return `${safeName}.${normalizedExtension}`;
};

// ============================================================
// Export
// ============================================================

const filename = Object.freeze({
    sanitizeFilename,

    createFilename,

    createResumePdfFilename,
});

export {
    sanitizeFilename,
    createFilename,
    createResumePdfFilename,
};

export default filename;