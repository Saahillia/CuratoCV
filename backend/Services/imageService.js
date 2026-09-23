import imageKit from "../Configs/imageKit.js";
import logger from "../../platform/backend/src/configs/logger.js";

// ============================================================
// CuratoCV Image Service
// ============================================================
// Responsible for:
// - Image upload processing
// - ImageKit communication
// - Image storage
// - Returning safe image metadata
//
// Current provider:
// - ImageKit
//
// Future provider:
// - CuratoCV's own image-processing pipeline
//   (background removal / face focus / optimization)
//
// NOT responsible for:
// - Authentication
// - Authorization
// - HTTP responses
// - Multipart parsing
// - Initial file validation
// - Database persistence
//
// ============================================================

// ============================================================
// Configuration
// ============================================================

const IMAGEKIT_FOLDER =
    process.env.IMAGEKIT_FOLDER?.trim() ||
    "curatocv/resumes";

// ============================================================
// Helpers
// ============================================================

const isValidBuffer = (
    buffer
) => {
    return (
        Buffer.isBuffer(buffer) &&
        buffer.length > 0
    );
};

const normalizeFileName = (
    fileName
) => {
    if (
        typeof fileName !== "string" ||
        !fileName.trim()
    ) {
        return `resume-photo-${Date.now()}`;
    }

    return fileName
        .trim()
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .slice(0, 120);
};

const withProfileImageTransformation = (url, removeBackground) => {
    if (!removeBackground || typeof url !== "string") {
        return url;
    }

    const transformedUrl = new URL(url);
    transformedUrl.searchParams.set(
        "tr",
        "e-bgremove,w-300,h-300,fo-face,z-0.8,q-85"
    );
    return transformedUrl.toString();
};

// ============================================================
// Upload Image
// ============================================================
// Expected input:
// {
//     buffer: Buffer,
//     fileName: "profile-photo.png"
// }
// `buffer` should come from Multer memoryStorage().
// ============================================================

const uploadImage = async ({
    buffer,
    fileName,
    folder =
        IMAGEKIT_FOLDER,
}) => {
    if (
        !isValidBuffer(
            buffer
        )
    ) {
        throw new Error(
            "A valid image buffer is required."
        );
    }

    const safeFileName =
        normalizeFileName(
            fileName
        );

    const safeFolder =
        typeof folder === "string" &&
        folder.trim()
            ? folder.trim()
            : IMAGEKIT_FOLDER;

    try {
        const result =
            await imageKit.files.upload({
                file: buffer.toString("base64"),

                fileName:
                    safeFileName,

                folder:
                    safeFolder,

                useUniqueFileName:
                    true,
            });

        if (
            !result?.url
        ) {
            throw new Error(
                "Image provider did not return an image URL."
            );
        }

        return {
            fileId:
                result.fileId ||
                null,

            url:
                result.url,

            thumbnailUrl:
                result.thumbnailUrl ||
                null,

            name:
                result.name ||
                safeFileName,

            width:
                result.width ||
                null,

            height:
                result.height ||
                null,

            filePath:
                result.filePath ||
                null,
        };
    } catch (error) {
        logger.error(
            "Image upload failed:",
            {
                name:
                    error?.name,

                message:
                    error?.message,

                statusCode:
                    error?.statusCode,
            }
        );

        throw new Error(
            "Failed to upload image."
        );
    }
};

// ============================================================
// Delete Image
// ============================================================
// Used when a user replaces/removes an existing profile image.
// The file ID should come from the stored image metadata rather
// than being supplied blindly by the client.
// ============================================================

const deleteImage = async (
    fileId
) => {
    if (
        typeof fileId !==
            "string" ||
        !fileId.trim()
    ) {
        throw new Error(
            "A valid image file ID is required."
        );
    }

    try {
        await imageKit.files.delete(
            fileId.trim()
        );

        return true;
    } catch (error) {
        logger.error(
            "Image deletion failed:",
            {
                name:
                    error?.name,

                message:
                    error?.message,

                statusCode:
                    error?.statusCode,
            }
        );

        throw new Error(
            "Failed to delete image."
        );
    }
};

// ============================================================
// Replace Image
// ============================================================
// Upload the new image first.
// Only after successful upload should the old image be deleted.
// This ordering prevents accidental loss of the existing image
// if the replacement upload fails.
// ============================================================

const replaceImage = async ({
    buffer,
    fileName,
    previousFileId = null,
    folder =
        IMAGEKIT_FOLDER,
}) => {
    const uploadedImage =
        await uploadImage({
            buffer,
            fileName,
            folder,
        });

    if (
        previousFileId
    ) {
        try {
            await deleteImage(
                previousFileId
            );
        } catch (error) {
            /*
             * Do not invalidate a successful new upload because
             * cleanup of the previous image failed.
             *
             * The caller can log/monitor the orphaned previous
             * image for later cleanup.
             */
            logger.warn(
                "New image uploaded, but previous image cleanup failed.",
                { previousFileId }
            );
        }
    }

    return uploadedImage;
};

// ============================================================
// Image Processing Placeholder
// ============================================================
// This abstraction is intentional.
//
// Today:
//   processProfileImage()
//       ↓
//   ImageKit storage
//
// Later:
//   processProfileImage()
//       ↓
//   CuratoCV image pipeline
//       ├── background removal
//       ├── face detection
//       ├── face focus/cropping
//       ├── resize
//       ├── compression
//       └── final storage
//
// The rest of the application should call this abstraction
// rather than directly depending on ImageKit processing.
// ============================================================

const processProfileImage = async ({
    buffer,
    fileName,
    folder =
        IMAGEKIT_FOLDER,
    removeBackground = false,
}) => {
    if (
        !isValidBuffer(
            buffer
        )
    ) {
        throw new Error(
            "A valid image buffer is required."
        );
    }

    const safeFileName =
        normalizeFileName(
            fileName
        );

    const safeFolder =
        typeof folder === "string" &&
        folder.trim()
            ? folder.trim()
            : IMAGEKIT_FOLDER;

    /*
     * Keep ImageKit's face-focused transformation
     * for the current development/testing phase.
     *
     * Background removal will later move into our
     * own image-processing service.
     */
    const transformation = [
        "w-300",
        "h-300",
        "fo-face",
        "z-0.8",
        "q-85",
    ].join(",");

    const uploadOptions = {
        file: buffer.toString("base64"),
        fileName: safeFileName,
        folder: safeFolder,
        useUniqueFileName: true,
        transformation: {
            pre: transformation,
        },
        responseFields: ["metadata"],
    };

    try {
        const result = await imageKit.files.upload(uploadOptions);

        if (!result?.url) {
            throw new Error("Image provider did not return an image URL.");
        }

        return {
            fileId: result.fileId || null,
            url: withProfileImageTransformation(result.url, removeBackground),
            thumbnailUrl: result.thumbnailUrl
                ? withProfileImageTransformation(result.thumbnailUrl, removeBackground)
                : null,
            name: result.name || safeFileName,
            width: result.width || null,
            height: result.height || null,
            filePath: result.filePath || null,
        };
    } catch (error) {
        logger.error(
            "Profile image processing failed:",
            {
                name: error?.name,
                message: error?.message,
                statusCode: error?.statusCode,
            }
        );

        throw new Error("Failed to process and upload profile image.");
    }
};

// ============================================================
// List Images
// ============================================================

const listImages = async (
    options = {}
) => {
    try {
        const result = await imageKit.listFiles(options);
        return result;
    } catch (error) {
        logger.error(
            "Failed to list images from ImageKit:",
            {
                name: error?.name,
                message: error?.message,
                statusCode: error?.statusCode,
            }
        );
        throw new Error("Failed to list images.");
    }
};

// ============================================================
// Exports
// ============================================================

export {
    uploadImage,
    deleteImage,
    replaceImage,
    processProfileImage,
    listImages,
};


export default {
    uploadImage,
    deleteImage,
    replaceImage,
    processProfileImage,
    listImages,
};