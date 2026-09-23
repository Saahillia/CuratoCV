import sharp from "sharp";
import { URL } from "url";

// ============================================================
// CuratoCV Image Validation Utility
// ============================================================
//
// Implements 6D backend boundary validations:
// - Magic byte signatures verified against declared MIME
// - Deep buffer verification using Sharp codec decoding
// - Format consistency validation
// - Extent/dimension limits (prevention of zip-bomb/pixel-bombs)
//
// Implements 6E-2 canonical photo validation:
// - Strict HTTPS + ImageKit-origin enforcement for persisted photo objects
// - Canonical {url, fileId} shape enforcement
// - No arbitrary external URLs in the canonical photo field
//
// Does NOT perform semantic/steg inspection.
// ============================================================

// ============================================================
// Photo URL Trust Boundary (6E-2)
// ============================================================
//
// The canonical profile photo stored in MongoDB must be a
// server-generated ImageKit asset, never an arbitrary client URL.
//
// This validator enforces that boundary for ANY photo object
// submitted through the resume update path — including legacy
// compatibility submissions.
//
// Rule:
//   photo.url  →  HTTPS + trusted ImageKit origin
//   photo.fileId → must be a non-empty string (server-assigned)
//
// External resume links (LinkedIn, GitHub, project URLs) are
// separate fields and have their own URL validation scope.
// ============================================================

/**
 * Returns the trusted ImageKit URL host from environment.
 * Falls back to null if the configuration is missing.
 *
 * @returns {string|null}
 */
export const getTrustedImageOrigin = () => {
    const endpoint =
        process.env.IMAGEKIT_URL_ENDPOINT ||
        process.env.IMAGEKIT_PUBLIC_KEY;

    if (!endpoint) return null;

    try {
        const parsed = new URL(endpoint);
        return parsed.host;
    } catch {
        return null;
    }
};

/**
 * Validates that a persisted photo object conforms to the
 * canonical shape and trust boundary.
 *
 * Canonical shape: { url: string, fileId: string }
 *
 * Trust rules:
 *   - url must be a valid URL
 *   - url must use HTTPS
 *   - url must point to the configured ImageKit host
 *   - fileId must be a non-empty string (server-assigned)
 *   - no unexpected/extra keys
 *
 * @param {unknown} photo - The photo value to validate.
 * @returns {{ url: string, fileId: string } | null} The validated
 *   canonical object, or null if validation fails.
 */
export const validatePhotoObject = (photo) => {
    // Reject non-objects (including null, arrays)
    if (
        !photo ||
        typeof photo !== "object" ||
        Array.isArray(photo)
    ) {
        return null;
    }

    // Require exactly the canonical keys
    const keys = Object.keys(/** @type {object} */ (photo));
    if (keys.length !== 2 || !keys.includes("url") || !keys.includes("fileId")) {
        return null;
    }

    const { url, fileId } = /** @type {{ url: unknown, fileId: unknown }} */ (photo);

    if (typeof url !== "string") return null;
    if (typeof fileId !== "string") return null;

    const trimmedUrl = url.trim();
    const trimmedFileId = fileId.trim();

    // Empty photo object is valid (no photo set)
    if (!trimmedUrl && !trimmedFileId) {
        return { url: "", fileId: "" };
    }

    // If a URL exists, it must be a valid ImageKit URL
    if (trimmedUrl) {
        let parsedUrl;
        try {
            parsedUrl = new URL(trimmedUrl);
        } catch {
            return null;
        }

        if (parsedUrl.protocol !== "https:") {
            return null;
        }

        const trustedHost = getTrustedImageOrigin();
        if (trustedHost && parsedUrl.host !== trustedHost) {
            return null;
        }

        // Must have a corresponding fileId
        if (!trimmedFileId) {
            return null;
        }
    }

    return { url: trimmedUrl, fileId: trimmedFileId };
};

const MAX_DIMENSION = 4096;

// Known allowed signatures per MIME.
// A safe upload must match one of its MIME's signatures.
const MAGIC_SIGNATURES = {
    "image/jpeg": [
        [0xff, 0xd8, 0xff],
    ],
    "image/png": [
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    ],
    "image/webp": [
        // WebP has a 'RIFF' header followed by size, then 'WEBP'
        // We handle it specially in the logic below, but declare standard here.
    ],
};

const WEB_P_RIFF = [0x52, 0x49, 0x46, 0x46]; // 'R', 'I', 'F', 'F'
const WEB_P_WEBP = [0x57, 0x45, 0x42, 0x50]; // 'W', 'E', 'B', 'P'

/**
 * Validates the raw buffer magic bytes against the declared MIME type.
 *
 * @param {Buffer} buffer - The uploaded file buffer.
 * @param {string} mimetype - The declared MIME type (e.g., 'image/jpeg').
 * @returns {boolean} - true if signature matches, false otherwise.
 */
export const validateMagicBytes = (buffer, mimetype) => {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        return false;
    }

    if (mimetype === "image/webp") {
        if (buffer.length < 12) return false;

        // Check RIFF at offset 0
        for (let i = 0; i < WEB_P_RIFF.length; i++) {
            if (buffer[i] !== WEB_P_RIFF[i]) return false;
        }

        // Check WEBP at offset 8
        for (let i = 0; i < WEB_P_WEBP.length; i++) {
            if (buffer[i + 8] !== WEB_P_WEBP[i]) return false;
        }

        return true;
    }

    const signatures = MAGIC_SIGNATURES[mimetype];
    if (!signatures || signatures.length === 0) {
        return false; // Unsupported MIME for magic byte validation
    }

    for (const signature of signatures) {
        if (buffer.length < signature.length) continue;

        let isMatch = true;
        for (let i = 0; i < signature.length; i++) {
            if (buffer[i] !== signature[i]) {
                isMatch = false;
                break;
            }
        }

        if (isMatch) return true;
    }

    return false;
};

/**
 * Validates the image pipeline for a given upload.
 * It will throw a structured API/Validation error format if any verification step fails.
 *
 * @param {Buffer} buffer - The raw image buffer.
 * @param {string} declaredMimeType - The expected MIME type.
 * @returns {Promise<Object>} - Contains { width, height, format } to represent valid metadata.
 */
export const validateSafeImage = async (buffer, declaredMimeType) => {
    // 1. Validate magic bytes
    if (!validateMagicBytes(buffer, declaredMimeType)) {
        const err = new Error("File signature does not match declared image type.");
        err.code = "INVALID_MAGIC_BYTES";
        throw err;
    }

    // 2. Decode using Sharp and extract metadata
    let metadata;
    try {
        metadata = await sharp(buffer).metadata();
    } catch (sharpError) {
        const err = new Error("Unable to decode image or file is malformed.");
        err.code = "IMAGE_DECODE_FAILED";
        throw err;
    }

    // 3. Verify that the decoded format matches the requested MIME type
    const formatMap = {
        "image/jpeg": ["jpeg", "jpg"],
        "image/png": ["png"],
        "image/webp": ["webp"],
    };

    const allowedFormats = formatMap[declaredMimeType];
    if (!allowedFormats || !allowedFormats.includes(metadata.format)) {
        const err = new Error("Decoded image format does not match declared MIME type.");
        err.code = "FORMAT_MISMATCH";
        throw err;
    }

    // 4. Extent/dimension limits verification
    if (!metadata.width || !metadata.height || metadata.width === 0 || metadata.height === 0) {
        const err = new Error("Image has invalid dimensions.");
        err.code = "INVALID_DIMENSIONS";
        throw err;
    }

    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
        const err = new Error(`Image dimensions exceed the maximum limit of ${MAX_DIMENSION}x${MAX_DIMENSION}.`);
        err.code = "DIMENSIONS_TOO_LARGE";
        throw err;
    }

    return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
    };
};
