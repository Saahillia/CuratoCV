// ============================================================
// CuratoCV Upload Validator
// ============================================================
//
// Responsible for validating uploaded file requests after
// Multer has parsed the multipart/form-data request.
//
// This validator:
// - verifies that an upload exists
// - verifies the expected field
// - verifies the uploaded file metadata
// - validates file size
// - validates supported MIME types
// - performs basic image-signature validation
//
// IMPORTANT:
// ------------------------------------------------------------
// MIME type alone is NOT trusted.
//
// Multer receives MIME information from the multipart request,
// so the actual file bytes are inspected as an additional
// security boundary.
//
// This validator does NOT:
// - upload files to ImageKit
// - process/remove image backgrounds
// - resize/crop images
// - store files
// - generate HTTP responses
//
// Those responsibilities belong to imageService/controller/
// middleware layers.
// ============================================================

import limits from "../Constants/limits.js";

// ============================================================
// Configuration
// ============================================================

const MAX_IMAGE_SIZE_BYTES =
    5 * 1024 * 1024;

const EXPECTED_FIELD_NAME =
    "image";

const ALLOWED_MIME_TYPES =
    Object.freeze([
        "image/jpeg",
        "image/png",
        "image/webp",
    ]);

// ============================================================
// File Signatures
// ============================================================
//
// These signatures allow us to verify that the uploaded bytes
// actually resemble the declared image format.
//
// JPEG:
// FF D8 FF
//
// PNG:
// 89 50 4E 47 0D 0A 1A 0A
//
// WebP:
// RIFF....WEBP
// ============================================================

const FILE_SIGNATURES = Object.freeze({
    jpeg: Object.freeze([
        0xff,
        0xd8,
        0xff,
    ]),

    png: Object.freeze([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
    ]),

    webp: Object.freeze([
        0x52,
        0x49,
        0x46,
        0x46,
    ]),
});

// ============================================================
// Helpers
// ============================================================

const isBuffer =
    (value) =>
        Buffer.isBuffer(value);

const hasBytes = (
    buffer,
    signature
) => {
    if (
        !isBuffer(buffer) ||
        buffer.length <
            signature.length
    ) {
        return false;
    }

    return signature.every(
        (byte, index) =>
            buffer[index] === byte
    );
};

// ============================================================
// Detect Image Type From Bytes
// ============================================================

const detectImageType = (
    buffer
) => {
    if (
        hasBytes(
            buffer,
            FILE_SIGNATURES.jpeg
        )
    ) {
        return "jpeg";
    }

    if (
        hasBytes(
            buffer,
            FILE_SIGNATURES.png
        )
    ) {
        return "png";
    }

    if (
        hasBytes(
            buffer,
            FILE_SIGNATURES.webp
        )
    ) {
        /*
         * WebP requires both:
         *
         * bytes 0-3  = RIFF
         * bytes 8-11 = WEBP
         */
        if (
            buffer.length >= 12 &&
            buffer[8] === 0x57 &&
            buffer[9] === 0x45 &&
            buffer[10] === 0x42 &&
            buffer[11] === 0x50
        ) {
            return "webp";
        }
    }

    return null;
};

// ============================================================
// MIME Type → Signature Type
// ============================================================

const mimeToImageType = (
    mimeType
) => {
    switch (mimeType) {
        case "image/jpeg":
            return "jpeg";

        case "image/png":
            return "png";

        case "image/webp":
            return "webp";

        default:
            return null;
    }
};

// ============================================================
// Validate File Metadata
// ============================================================

const validateFileMetadata = (
    file
) => {
    if (!file) {
        throw new Error(
            "An image file is required."
        );
    }

    if (
        file.fieldname !==
        EXPECTED_FIELD_NAME
    ) {
        throw new Error(
            `Invalid upload field. Expected "${EXPECTED_FIELD_NAME}".`
        );
    }

    if (
        !isBuffer(file.buffer)
    ) {
        throw new Error(
            "Uploaded file data is unavailable."
        );
    }

    if (
        file.buffer.length === 0
    ) {
        throw new Error(
            "Uploaded image is empty."
        );
    }

    if (
        file.buffer.length >
        MAX_IMAGE_SIZE_BYTES
    ) {
        throw new Error(
            `Image cannot exceed ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB.`
        );
    }

    if (
        !ALLOWED_MIME_TYPES.includes(
            file.mimetype
        )
    ) {
        throw new Error(
            "Unsupported image type. Only JPEG, PNG, and WebP images are allowed."
        );
    }

    return file;
};

// ============================================================
// Validate Image Bytes
// ============================================================

const validateImageSignature = (
    file
) => {
    const detectedType =
        detectImageType(
            file.buffer
        );

    if (!detectedType) {
        throw new Error(
            "The uploaded file is not a supported image."
        );
    }

    const declaredType =
        mimeToImageType(
            file.mimetype
        );

    if (
        detectedType !==
        declaredType
    ) {
        throw new Error(
            "The uploaded file type does not match its actual contents."
        );
    }

    return {
        ...file,
        detectedImageType:
            detectedType,
    };
};

// ============================================================
// Validate Uploaded Image
// ============================================================

const validateUploadedImage = (
    file
) => {
    const validatedFile =
        validateFileMetadata(
            file
        );

    return validateImageSignature(
        validatedFile
    );
};

// ============================================================
// Express Middleware
// ============================================================
//
// Usage:
//
// router.post(
//     "/photo",
//     authMiddleware,
//     upload.single("image"),
//     validateUploadMiddleware,
//     controller
// );
//
// The validated file is placed on:
//
//     req.validatedUpload
//
// The original req.file remains available as well.
// ============================================================

export const validateUploadMiddleware = (
    req,
    res,
    next
) => {
    try {
        req.validatedUpload =
            validateUploadedImage(
                req.file
            );

        return next();
    } catch (error) {
        return res.status(400).json({
            success: false,

            message:
                error?.message ||
                "Invalid uploaded image.",
        });
    }
};

// ============================================================
// Multiple Upload Validation
// ============================================================
//
// This is provided for future functionality, but the current
// CuratoCV photo flow intentionally accepts one image at a
// time.
// ============================================================

export const validateUploadedImages = (
    files
) => {
    if (
        !Array.isArray(files)
    ) {
        throw new Error(
            "Uploaded files must be an array."
        );
    }

    return files.map(
        validateUploadedImage
    );
};

// ============================================================
// Exports
// ============================================================

export {
    MAX_IMAGE_SIZE_BYTES,
    EXPECTED_FIELD_NAME,
    ALLOWED_MIME_TYPES,
    FILE_SIGNATURES,
    detectImageType,
    mimeToImageType,
    validateFileMetadata,
    validateImageSignature,
    validateUploadedImage,
};

export default validateUploadedImage;