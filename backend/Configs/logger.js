// ============================================================
// CuratoCV Application Logger
// ============================================================
//
// Centralized server-side logging.
//
// SECURITY:
// - Never log passwords.
// - Never log JWTs.
// - Never log API keys.
// - Never log database connection strings.
// - Never log uploaded file contents.
// - Never log complete request bodies containing resume data.
//
// Keep application logging centralized so we can replace the
// underlying logging implementation later without changing
// every controller/service.
// ============================================================

// ============================================================
// Log levels
// ============================================================

const LOG_LEVELS = Object.freeze({
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error",
});

// ============================================================
// Environment
// ============================================================

const isProduction =
    process.env.NODE_ENV === "production";

// ============================================================
// Safe metadata serialization
// ============================================================

const serializeMetadata = (metadata) => {
    if (
        metadata === null ||
        metadata === undefined
    ) {
        return "";
    }

    if (
        typeof metadata !== "object"
    ) {
        return String(metadata);
    }

    try {
        return JSON.stringify(
            sanitizeMetadata(metadata)
        );
    } catch {
        return "[Unable to serialize log metadata]";
    }
};

// ============================================================
// Sensitive-field sanitization
// ============================================================

const SENSITIVE_KEYS = new Set([
    "password",
    "currentPassword",
    "newPassword",
    "confirmPassword",

    "token",
    "accessToken",
    "refreshToken",
    "authorization",

    "apiKey",
    "apikey",
    "privateKey",
    "secret",

    "jwt",
    "jwtSecret",

    "mongodbUri",
    "mongoUri",
    "connectionString",

    "cookie",
    "set-cookie",
]);

const sanitizeMetadata = (
    value,
    seen = new WeakSet()
) => {
    if (
        value === null ||
        typeof value !== "object"
    ) {
        return value;
    }

    if (
        seen.has(value)
    ) {
        return "[Circular]";
    }

    seen.add(value);

    if (Array.isArray(value)) {
        return value.map(
            (item) =>
                sanitizeMetadata(
                    item,
                    seen
                )
        );
    }

    const sanitized = {};

    for (
        const [
            key,
            currentValue,
        ] of Object.entries(value)
    ) {
        if (
            SENSITIVE_KEYS.has(
                key.toLowerCase()
            )
        ) {
            sanitized[key] =
                "[REDACTED]";

            continue;
        }

        sanitized[key] =
            sanitizeMetadata(
                currentValue,
                seen
            );
    }

    return sanitized;
};

// ============================================================
// Timestamp
// ============================================================

const getTimestamp = () =>
    new Date().toISOString();

// ============================================================
// Internal logger
// ============================================================

const writeLog = (
    level,
    message,
    metadata
) => {
    const timestamp =
        getTimestamp();

    const serializedMetadata =
        serializeMetadata(
            metadata
        );

    const output = [
        `[${timestamp}]`,
        `[${level.toUpperCase()}]`,
        message,
        serializedMetadata,
    ]
        .filter(Boolean)
        .join(" ");

    switch (level) {
        case LOG_LEVELS.ERROR:
            console.error(output);
            break;

        case LOG_LEVELS.WARN:
            console.warn(output);
            break;

        case LOG_LEVELS.DEBUG:
            /*
             * Debug logs are intentionally suppressed in
             * production to reduce noise and accidental
             * information disclosure.
             */
            if (!isProduction) {
                console.debug(output);
            }
            break;

        case LOG_LEVELS.INFO:
        default:
            console.info(output);
            break;
    }
};

// ============================================================
// Public logger
// ============================================================

const logger = Object.freeze({
    debug(message, metadata) {
        writeLog(
            LOG_LEVELS.DEBUG,
            message,
            metadata
        );
    },

    info(message, metadata) {
        writeLog(
            LOG_LEVELS.INFO,
            message,
            metadata
        );
    },

    warn(message, metadata) {
        writeLog(
            LOG_LEVELS.WARN,
            message,
            metadata
        );
    },

    error(message, metadata) {
        writeLog(
            LOG_LEVELS.ERROR,
            message,
            metadata
        );
    },
});

// ============================================================
// Export
// ============================================================

export default logger;