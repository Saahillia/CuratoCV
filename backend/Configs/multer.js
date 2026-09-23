import multer from "multer";

// ============================================================
// CuratoCV Multipart Upload Configuration
// ============================================================
//
// Multer is responsible ONLY for parsing multipart/form-data.
//
// It is NOT the final image-security layer.
//
// Uploaded files must still pass:
//   1. Multer request limits
//   2. MIME/type checks
//   3. Actual binary/image validation
//   4. Image processing validation
//   5. Image service checks
//
// Only then may the image be sent to ImageKit or another
// future image-processing provider.
//
// SECURITY PRINCIPLES
// ------------------------------------------------------------
// - Never write uploaded files directly to the server filesystem.
// - Never trust the client-provided MIME type.
// - Never trust the client-provided filename.
// - Never accept unlimited file sizes.
// - Never allow unlimited multipart fields.
// - Never send an unvalidated upload directly to ImageKit.
// ============================================================

// ============================================================
// Upload Limits
// ============================================================
//
// These limits belong to the multipart parser itself.
//
// Business/data validation limits should remain in the
// appropriate validator rather than being mixed into Multer.
// ============================================================

const MAX_IMAGE_SIZE_BYTES =
    5 * 1024 * 1024; // 5 MB

const uploadLimits = Object.freeze({
    // Only one uploaded file is expected.
    files: 1,

    // Maximum size of the uploaded file.
    fileSize:
        MAX_IMAGE_SIZE_BYTES,

    // Maximum number of non-file multipart fields.
    fields: 20,

    // Maximum size of an individual multipart field.
    fieldSize:
        64 * 1024, // 64 KB

    // Maximum total number of multipart parts.
    //
    // 20 fields + 1 file = 21.
    parts: 21,

    // Limit the size of a multipart field name.
    fieldNameSize: 100,

    // Limit the number of HTTP header pairs processed
    // by the underlying multipart parser.
    headerPairs: 200,

    // Mitigate deep multipart nesting DoS (multer 2.2.0+ recommendation)
    fieldNestingDepth: 10,

    // Limit array index depth to mitigate multipart array flooding
    fieldArrayIndexLimit: 100,
});

// ============================================================
// Allowed MIME Types
// ============================================================
//
// IMPORTANT:
//
// file.mimetype is supplied by the client and therefore
// cannot be considered proof that the uploaded bytes are
// actually an image.
//
// This is only an EARLY rejection layer.
//
// Actual binary/image validation belongs to:
//     Validators/uploadValidator.js
//
// and/or:
//     Services/imageService.js
// ============================================================

const ALLOWED_MIME_TYPES =
    new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
    ]);

// ============================================================
// Multer File Filter
// ============================================================

const fileFilter = (
    req,
    file,
    callback
) => {
    if (!file) {
        return callback(
            new multer.MulterError(
                "LIMIT_UNEXPECTED_FILE"
            )
        );
    }

    /*
     * Reject unsupported MIME types as early as possible.
     *
     * This does NOT replace actual binary inspection.
     */
    if (
        !ALLOWED_MIME_TYPES.has(
            file.mimetype
        )
    ) {
        return callback(
            new multer.MulterError(
                "LIMIT_UNEXPECTED_FILE"
            )
        );
    }

    return callback(
        null,
        true
    );
};

// ============================================================
// Multer Instance
// ============================================================

const upload = multer({
    /*
     * Keep uploads in memory because CuratoCV does not need
     * to persist temporary files on the application server.
     *
     * This also prevents attacker-controlled filenames and
     * paths from being written directly to the filesystem.
     *
     * IMPORTANT:
     * The strict fileSize limit above is essential because
     * memoryStorage() stores the complete upload in RAM.
     */
    storage:
        multer.memoryStorage(),

    limits:
        uploadLimits,

    fileFilter,
});

export default upload;