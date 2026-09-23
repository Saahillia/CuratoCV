// ============================================================
// CuratoCV Upload Middleware
// ============================================================
//
// Handles file uploads for resume images and other media.
//
// Responsibilities:
// - Accept multipart/form-data requests
// - Validate file type and size
// - Store uploads in memory (no disk writes)
// - Reject invalid files with proper errors
// - Pass validated file to controller via req.file
//
// NOT responsible for:
// - Image processing (ImageKit handles transformation)
// - Business logic
// - Database operations
// - Response formatting
//
// Uses multer with memory storage.
//
// ============================================================

import multer from "multer";

import ApiError from "../Utils/apiError.js";

// ============================================================
// Configuration
// ============================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_FILES = 1;

// ============================================================
// Memory Storage
// ============================================================
//
// Files are stored in memory as Buffer objects.
// No disk writes occur.
// ImageKit handles persistence.
// ============================================================

const storage = multer.memoryStorage();

// ============================================================
// File Filter
// ============================================================
//
// Rejects files that are not allowed image types.
// Uses strict MIME type checking.
// ============================================================

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(
            new ApiError(400, "Invalid file type. Only JPEG, PNG, and WebP are allowed.", {
                code: "INVALID_FILE_TYPE",
            }),
            false
        );
    }

    cb(null, true);
};

// ============================================================
// Multer Instance
// ============================================================

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES,
    },
    fileFilter,
});

// ============================================================
// Export
// ============================================================
//
// Use this middleware before resume update handlers:
//
//     router.post(
//         "/update/:resumeId",
//         protect,
//         uploadMiddleware,
//         resumeController.updateResume
//     );
//
// In the controller, access the file via req.file.
// ============================================================

export default upload.single("image");
