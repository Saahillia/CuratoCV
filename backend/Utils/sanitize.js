// ============================================================
// CuratoCV Sanitization Utilities
// ============================================================
//
// Centralized sanitization helpers for user-controlled data.
//
// Responsibilities:
// - Normalize user-provided strings
// - Remove dangerous control characters
// - Normalize whitespace
// - Recursively sanitize plain objects/arrays when required
// - Prevent accidental storage of malformed text
//
// NOT responsible for:
// - Validating business rules
// - Authentication
// - Authorization
// - HTML rendering
// - SQL/MongoDB query construction
// - Filename generation
//
// IMPORTANT:
//
// Sanitization does NOT replace validation.
//
// Example:
//
// "hello"       -> valid
// ""            -> sanitized empty string
//
// Whether an empty string is allowed is a VALIDATION concern.
// ============================================================

// ============================================================
// Constants
// ============================================================

// Remove ASCII control characters except:
// - newline (\n)
// - carriage return (\r)
// - tab (\t)
//
// Resume descriptions can legitimately contain line breaks.
const CONTROL_CHARACTERS =
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// Normalize Unicode whitespace while preserving ordinary
// spaces, newlines, carriage returns, and tabs.
const EXCESSIVE_SPACES =
    /[ \t]+/g;

// More than two consecutive line breaks are unnecessary in
// resume content.
const EXCESSIVE_LINE_BREAKS =
    /\n{3,}/g;

// ============================================================
// sanitizeString
// ============================================================
//
// General-purpose text sanitization.
//
// This function intentionally does NOT:
// - remove punctuation
// - strip URLs
// - strip HTML blindly
// - truncate content
//
// Those decisions belong to the specific field validator.
//
// ============================================================

/**
 * Sanitize a user-provided string.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeString = (
    value
) => {
    if (
        typeof value !== "string"
    ) {
        return value;
    }

    return value
        .replace(
            CONTROL_CHARACTERS,
            ""
        )
        .replace(
            EXCESSIVE_SPACES,
            " "
        )
        .replace(
            EXCESSIVE_LINE_BREAKS,
            "\n\n"
        )
        .trim();
};

// ============================================================
// sanitizeSingleLine
// ============================================================
//
// Used for fields that should remain a single line:
//
// - names
// - titles
// - company names
// - job titles
// - institution names
// - skill names
//
// ============================================================

/**
 * Sanitize text that should contain no line breaks.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeSingleLine = (
    value
) => {
    if (
        typeof value !== "string"
    ) {
        return value;
    }

    return sanitizeString(
        value
    )
        .replace(
            /[\r\n\t]+/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
};

// ============================================================
// sanitizeMultiline
// ============================================================
//
// Used for resume descriptions and summaries where line breaks
// may be meaningful.
//
// ============================================================

/**
 * Sanitize multiline resume content.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeMultiline = (
    value
) => {
    if (
        typeof value !== "string"
    ) {
        return value;
    }

    return sanitizeString(
        value
    )
        .replace(
            /\r\n/g,
            "\n"
        )
        .replace(
            /\r/g,
            "\n"
        )
        .trim();
};

// ============================================================
// sanitizeEmail
// ============================================================
//
// Email validation belongs to the validator.
// This helper only normalizes the representation.
//
// ============================================================

/**
 * Normalize an email address.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeEmail = (
    value
) => {
    if (
        typeof value !== "string"
    ) {
        return value;
    }

    return sanitizeSingleLine(
        value
    ).toLowerCase();
};

// ============================================================
// sanitizeUrl
// ============================================================
//
// URL validation remains the responsibility of the validator.
//
// This helper only removes whitespace/control characters around
// the URL.
//
// ============================================================

/**
 * Normalize a URL string.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeUrl = (
    value
) => {
    if (
        typeof value !== "string"
    ) {
        return value;
    }

    return sanitizeSingleLine(
        value
    );
};

// ============================================================
// isPlainObject
// ============================================================

const isPlainObject = (
    value
) => {
    if (
        value === null ||
        typeof value !==
            "object"
    ) {
        return false;
    }

    const prototype =
        Object.getPrototypeOf(
            value
        );

    return (
        prototype ===
            Object.prototype ||
        prototype === null
    );
};

// ============================================================
// sanitizeObject
// ============================================================
//
// Recursively sanitizes strings inside ordinary objects and
// arrays.
//
// IMPORTANT:
//
// This should only be used on data that has already been
// structurally validated or is about to enter validation.
//
// It does NOT:
// - whitelist fields
// - validate values
// - prevent prototype pollution by itself
//
// The validation/service layer remains responsible for
// controlling which fields may actually be persisted.
// ============================================================

/**
 * Recursively sanitize plain objects and arrays.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeObject = (
    value
) => {
    // --------------------------------------------------------
    // String
    // --------------------------------------------------------

    if (
        typeof value === "string"
    ) {
        return sanitizeString(
            value
        );
    }

    // --------------------------------------------------------
    // Array
    // --------------------------------------------------------

    if (
        Array.isArray(value)
    ) {
        return value.map(
            (
                item
            ) =>
                sanitizeObject(
                    item
                )
        );
    }

    // --------------------------------------------------------
    // Plain Object
    // --------------------------------------------------------

    if (
        isPlainObject(value)
    ) {
        const sanitized = {};

        for (
            const [
                key,
                childValue,
            ] of Object.entries(
                value
            )
        ) {
            /*
             * Never copy MongoDB/JavaScript prototype pollution
             * keys into the sanitized object.
             */
            if (
                key ===
                    "__proto__" ||
                key ===
                    "prototype" ||
                key ===
                    "constructor"
            ) {
                continue;
            }

            sanitized[key] =
                sanitizeObject(
                    childValue
                );
        }

        return sanitized;
    }

    // --------------------------------------------------------
    // Other values
    // --------------------------------------------------------
    //
    // Numbers, booleans, null, dates, ObjectIds, etc. are left
    // untouched.
    //

    return value;
};

// ============================================================
// sanitizeResumeText
// ============================================================
//
// Convenience helper for common resume text.
//
// Single-line fields are handled separately by their validators,
// so this function is primarily useful for free-form content.
//
// ============================================================

const sanitizeResumeText = (
    value
) => {
    return sanitizeMultiline(
        value
    );
};

// ============================================================
// Export
// ============================================================

const sanitize =
    Object.freeze({
        sanitizeString,

        sanitizeSingleLine,

        sanitizeMultiline,

        sanitizeEmail,

        sanitizeUrl,

        sanitizeObject,

        sanitizeResumeText,
    });

export {
    sanitizeString,
    sanitizeSingleLine,
    sanitizeMultiline,
    sanitizeEmail,
    sanitizeUrl,
    sanitizeObject,
    sanitizeResumeText,
};

export default sanitize;