// ============================================================
// Resume Builder User Lifecycle Hooks Integration
// ============================================================

import { registerUserDeleteHook, registerResumeProvider } from "@curatocv/platform-backend/services/userServiceHooks";
import resumeRepository from "../repositories/resumeRepository.js";
import imageService from "../services/imageService.js";
import logger from "@curatocv/platform-backend/configs/logger";

// Register resume provider
registerResumeProvider(async (userId) => {
    return await resumeRepository.findAllByUserId(userId);
});

// Register user delete hook (cascade delete resumes and images)
registerUserDeleteHook(async (userId) => {
    try {
        const deletedResumes = await resumeRepository.deleteAllByUserId(userId);

        for (const resume of deletedResumes) {
            const photoFileId = resume.personalInfo?.photo?.fileId;
            if (photoFileId) {
                imageService.deleteImage(photoFileId).catch((error) => {
                    logger.warn("Failed to delete photo from external storage during account deletion.", {
                        userId,
                        resumeId: resume._id.toString(),
                        fileId: photoFileId,
                        error: error.message,
                    });
                });
            }
        }

        // Orphan Asset Cleanup
        try {
            const userFolder = `curatocv/resumes/${userId}`;
            const files = await imageService.listImages({
                path: userFolder,
            });

            if (files && Array.isArray(files)) {
                for (const file of files) {
                    await imageService.deleteImage(file.fileId).catch((error) => {
                        logger.warn("Failed to delete orphaned photo during account deletion.", {
                            userId,
                            fileId: file.fileId,
                            error: error.message,
                        });
                    });
                }
            }
        } catch (error) {
            logger.warn("Image reconciliation during account deletion failed.", {
                userId,
                error: error.message,
            });
        }
    } catch (error) {
        logger.error("Error during cascaded resume cleanup on account deletion:", {
            userId,
            error: error.message,
        });
        throw error;
    }
});

export default {};
