import Resume from "../models/Resume.js";
import resumeService from "../services/resumeService.js";
import resumeSections from "../constants/resumeSections.js";
import imageService from "../services/imageService.js";
import { validateSafeImage, validatePhotoObject } from "../utils/imageValidation.js";
import logger from "@curatocv/platform-backend/configs/logger";
import { generateResumePdf } from "../services/pdfService.js";
import { renderResumeHtml } from "../services/resumeHtmlRenderer.js";

// ============================================================
// Configuration
// ============================================================

const MAX_RESUME_TITLE_LENGTH = 120;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const MAX_RESUME_DATA_BYTES = 200 * 1024;

// ============================================================
// Helpers
// ============================================================

const isPlainObject = (value) => {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
};

const isValidObjectId = (value) => {
    return (
        typeof value === "string" &&
        /^[a-fA-F0-9]{24}$/.test(value)
    );
};

const isTrue = (value) => {
    return (
        value === true ||
        value === "true" ||
        value === "1"
    );
};

const sanitizeString = (
    value,
    maxLength
) => {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .trim()
        .slice(0, maxLength);
};

const parseResumeData = (value) => {
    if (
        typeof value === "string"
    ) {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    return value;
};

const validateResumeTitle = (title) => {
    if (
        typeof title !== "string"
    ) {
        return null;
    }

    const normalizedTitle =
        title.trim();

    if (
        !normalizedTitle ||
        normalizedTitle.length >
            MAX_RESUME_TITLE_LENGTH
    ) {
        return null;
    }

    return normalizedTitle;
};

// ============================================================
// Resume data sanitization
// ============================================================
//
// Accepts both canonical DTO format (personalInfo, design, sections)
// and legacy flat format (personal_info, professional_summary, etc.),
// normalizing all input into the canonical schema required by Mongoose.
// ============================================================

const normalizePhoto = (value) => {
    // Legacy plain URL string → mark as legacy without a fileId.
    // Must pass through validatePhotoObject later; a bare string URL
    // will be rejected because it is not a canonical object.
    if (typeof value === "string" && value.trim().length > 0) {
        return { url: value.trim(), fileId: "" };
    }
    // Canonical object
    if (isPlainObject(value)) {
        const url = typeof value.url === "string" ? value.url.trim() : "";
        const fileId = typeof value.fileId === "string" ? value.fileId.trim() : "";
        return { url, fileId };
    }
    // Null / undefined / empty
    return { url: "", fileId: "" };
};

const sanitizePersonalInfo = (
    personalInfo
) => {
    if (
        !isPlainObject(personalInfo)
    ) {
        return {};
    }

    return {
        fullName:
            sanitizeString(
                personalInfo.fullName || personalInfo.full_name,
                150
            ),

        profession:
            sanitizeString(
                personalInfo.profession,
                150
            ),

        email:
            sanitizeString(
                personalInfo.email,
                254
            ),

        phone:
            sanitizeString(
                personalInfo.phone,
                50
            ),

        location:
            sanitizeString(
                personalInfo.location,
                200
            ),

        linkedin:
            sanitizeString(
                personalInfo.linkedin,
                500
            ),

        website:
            sanitizeString(
                personalInfo.website,
                500
            ),

        github:
            sanitizeString(
                personalInfo.github,
                500
            ),

        photoBg:
            Boolean(personalInfo.photoBg),

        photo:
            validatePhotoObject(
                normalizePhoto(
                    personalInfo.photo ||
                        personalInfo.image ||
                        personalInfo.picture
                )
            ) || { url: "", fileId: "" },
    };
};

const sanitizeEntry = (entry, index) => {
    if (!isPlainObject(entry)) {
        return null;
    }

    return {
        _id: entry._id,
        order: typeof entry.order === "number" ? entry.order : index,
        visible: entry.visible !== false,
        customization: isPlainObject(entry.customization) ? entry.customization : {},
        data: isPlainObject(entry.data) ? entry.data : (isPlainObject(entry) ? { ...entry } : {}),
    };
};

const normalizeSectionType = (type) => {
    if (typeof type !== "string") return "";
    const lower = type.toLowerCase().trim();

    // If it's already a valid type as is, return it
    if (resumeSections.isValidType(lower)) return lower;

    // Try stripping trailing 's'
    const withoutS = lower.replace(/(s)$/, "");
    if (resumeSections.isValidType(withoutS)) return withoutS;

    // Return original if nothing matches
    return lower;
};

const sanitizeSection = (section, defaultOrder = 0) => {
    if (!isPlainObject(section)) {
        return null;
    }

    const type = normalizeSectionType(sanitizeString(section.type, 50));
    if (!resumeSections.isValidType(type)) {
        return null;
    }

    const title =
        sanitizeString(section.title, 120) ||
        resumeSections.getDefinition(type)?.defaultTitle ||
        "Untitled Section";

    const order = typeof section.order === "number" ? section.order : defaultOrder;
    const visible = section.visible !== false;
    const customization = isPlainObject(section.customization) ? section.customization : {};

    const entries = Array.isArray(section.entries)
        ? section.entries.map((e, idx) => sanitizeEntry(e, idx)).filter(Boolean)
        : [];

    return {
        _id: section._id,
        type,
        title,
        order,
        visible,
        customization,
        entries,
    };
};

const convertLegacyToCanonicalSections = (legacyData) => {
    const sections = [];

    const addSection = (type, defaultTitle, entries = []) => {
        sections.push({
            type,
            title: defaultTitle,
            order: sections.length,
            visible: true,
            customization: {},
            entries: entries.map((data, index) => ({
                order: index,
                visible: true,
                customization: {},
                data: isPlainObject(data) ? data : { description: String(data) },
            })),
        });
    };

    // Professional Summary
    const summaryContent = legacyData.professional_summary || legacyData.summary || "";
    if (summaryContent) {
        addSection(
            resumeSections.types.SUMMARY,
            resumeSections.definitions[resumeSections.types.SUMMARY]?.defaultTitle || "Professional Summary",
            [{ description: summaryContent }]
        );
    }

    // Experience
    if (Array.isArray(legacyData.experience) && legacyData.experience.length > 0) {
        const experienceEntries = legacyData.experience.map((e) => ({
            company: e.company || "",
            position: e.position || "",
            location: e.location || "",
            startDate: e.start_date || e.startDate || "",
            endDate: e.end_date || e.endDate || "",
            isCurrent: Boolean(e.is_current || e.isCurrent),
            description: e.description || "",
        }));
        addSection(
            resumeSections.types.EXPERIENCE,
            resumeSections.definitions[resumeSections.types.EXPERIENCE]?.defaultTitle || "Experience",
            experienceEntries
        );
    }

    // Education
    if (Array.isArray(legacyData.education) && legacyData.education.length > 0) {
        const educationEntries = legacyData.education.map((e) => ({
            institution: e.institution || "",
            degree: e.degree || "",
            field: e.field || "",
            graduationDate: e.graduation_date || e.graduationDate || "",
            gpa: e.gpa || "",
        }));
        addSection(
            resumeSections.types.EDUCATION,
            resumeSections.definitions[resumeSections.types.EDUCATION]?.defaultTitle || "Education",
            educationEntries
        );
    }

    // Skills
    if (Array.isArray(legacyData.skills) && legacyData.skills.length > 0) {
        const skillsEntries = legacyData.skills.map((s) => (typeof s === "string" ? { name: s } : s));
        addSection(
            resumeSections.types.SKILLS,
            resumeSections.definitions[resumeSections.types.SKILLS]?.defaultTitle || "Skills",
            skillsEntries
        );
    }

    // Projects
    const projectsArray = legacyData.projects || legacyData.project;
    if (Array.isArray(projectsArray) && projectsArray.length > 0) {
        const projectsEntries = projectsArray.map((p) => ({
            name: p.name || "",
            description: p.description || "",
            url: p.url || p.link || "",
            technologies: p.technologies || p.type || "",
        }));
        addSection(
            resumeSections.types.PROJECTS,
            resumeSections.definitions[resumeSections.types.PROJECTS]?.defaultTitle || "Projects",
            projectsEntries
        );
    }

    return sections;
};

const sanitizeResumeData = (
    resumeData
) => {
    if (
        !isPlainObject(resumeData)
    ) {
        return null;
    }

    const sanitized = {};

    if (
        Object.prototype.hasOwnProperty.call(
            resumeData,
            "title"
        )
    ) {
        const title =
            validateResumeTitle(
                resumeData.title
            );

        if (title === null) {
            return null;
        }

        sanitized.title =
            title;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            resumeData,
            "public"
        )
    ) {
        sanitized.public =
            resumeData.public === true;
    }

    if (resumeData.personalInfo || resumeData.personal_info) {
        sanitized.personalInfo = sanitizePersonalInfo(
            resumeData.personalInfo || resumeData.personal_info
        );
    }

    if (isPlainObject(resumeData.design)) {
        sanitized.design = resumeData.design;
    }

    if (isPlainObject(resumeData.document)) {
        sanitized.document = resumeData.document;
    }

    if (Array.isArray(resumeData.sections)) {
        sanitized.sections = resumeData.sections
            .map((s, idx) => sanitizeSection(s, idx))
            .filter(Boolean);
    } else {
        const legacySections = convertLegacyToCanonicalSections(resumeData);
        if (legacySections.length > 0) {
            sanitized.sections = legacySections;
        }
    }

    return sanitized;
};

// ============================================================
// Create Resume
// POST /api/resumes/create
// ============================================================

export const createResume = async (
    req,
    res
) => {
    try {
        const userId =
            req.userId;

        const title =
            validateResumeTitle(
                req.body?.title
            );

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Unauthorized.",
                },
            });
        }

        if (!title) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "A valid resume title is required.",
                },
            });
        }

        const newResume =
            await resumeService.createResume(
                userId,
                { title }
            );

        return res.status(201).json({
            success: true,
            data: {
                resume: newResume,
                message: "Resume created successfully.",
            },
        });
    } catch (error) {
        // ----------------------------------------------------
        // Handle ApiError from service
        // ----------------------------------------------------

        if (error?.name === "ApiError") {
            return res
                .status(error.statusCode)
                .json({
                    success: false,
                    error: {
                        code: error.code || "APPLICATION_ERROR",
                        message: error.message,
                    },
                });
        }

        logger.error(
            "Create resume error:",
            {
                name: error?.name,
                message: error?.message,
                code: error?.code,
            }
        );

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to create resume.",
            },
        });
    }
};

// ============================================================
// Delete Resume
// DELETE /api/resumes/delete/:resumeId
// ============================================================

export const deleteResume = async (
    req,
    res
) => {
    try {
        const userId =
            req.userId;

        const { resumeId } =
            req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Unauthorized.",
                },
            });
        }

        if (
            !isValidObjectId(
                resumeId
            )
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ID",
                    message: "Invalid resume ID.",
                },
            });
        }

        await resumeService.deleteResume(
            resumeId,
            userId
        );

        return res.status(200).json({
            success: true,
            data: {
                message: "Resume deleted successfully.",
            },
        });
    } catch (error) {
        // ----------------------------------------------------
        // Handle ApiError from service
        // ----------------------------------------------------

        if (error?.name === "ApiError") {
            return res
                .status(error.statusCode)
                .json({
                    success: false,
                    error: {
                        code: error.code || "APPLICATION_ERROR",
                        message: error.message,
                    },
                });
        }

        logger.error(
            "Delete resume error:",
            {
                name: error?.name,
                message: error?.message,
                code: error?.code,
            }
        );

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to delete resume.",
            },
        });
    }
};

// ============================================================
// Get Resume By ID
// GET /api/resumes/get/:resumeId
// ============================================================

export const getResumeById = async (
    req,
    res
) => {
    try {
        const userId =
            req.userId;

        const { resumeId } =
            req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Unauthorized.",
                },
            });
        }

        if (
            !isValidObjectId(
                resumeId
            )
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ID",
                    message: "Invalid resume ID.",
                },
            });
        }

        const resume =
            await resumeService.getResume(
                resumeId,
                userId
            );

        return res.status(200).json({
            success: true,
            data: { resume },
        });
    } catch (error) {
        // ----------------------------------------------------
        // Handle ApiError from service
        // ----------------------------------------------------

        if (error?.name === "ApiError") {
            return res
                .status(error.statusCode)
                .json({
                    success: false,
                    error: {
                        code: error.code || "APPLICATION_ERROR",
                        message: error.message,
                    },
                });
        }

        logger.error(
            "Get resume error:",
            {
                name: error?.name,
                message: error?.message,
                code: error?.code,
            }
        );

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to fetch resume.",
            },
        });
    }
};

// ============================================================
// Get Public Resume
// GET /api/resumes/public/:resumeId
// ============================================================

export const getPublicResumeById =
    async (req, res) => {
        try {
            const {
                resumeId,
            } = req.params;

            if (
                !isValidObjectId(
                    resumeId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_ID",
                        message: "Invalid resume ID.",
                    },
                });
            }

            const resume =
                await Resume.findOne({
                    public: true,
                    _id: resumeId,
                }).lean();

            if (!resume) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Resume not found.",
                    },
                });
            }

            return res.status(200).json({
                success: true,
                data: { resume },
            });
        } catch (error) {
            logger.error(
                "Get public resume error:",
                {
                    name: error?.name,
                    message:
                        error?.message,
                    code:
                        error?.code,
                }
            );

            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to fetch resume.",
                },
            });
        }
    };

// ============================================================
// Update Resume
// PUT /api/resumes/update/:resumeId
// ============================================================

export const updateResume = async (
    req,
    res
) => {
    try {
        const userId =
            req.userId;

        const { resumeId } =
            req.params;

        const image =
            req.file;

        const {
            resumeData,
            removeBackground,
        } = req.body;

        let expectedVersion = req.body.expectedVersion;
        if (typeof expectedVersion === "string" && expectedVersion.trim() !== "") {
            const parsed = parseInt(expectedVersion, 10);
            if (!isNaN(parsed)) {
                expectedVersion = parsed;
            }
        }

        // ------------------------------------------------------
        // Authentication
        // ------------------------------------------------------

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Unauthorized.",
                },
            });
        }

        // ------------------------------------------------------
        // Resume ID
        // ------------------------------------------------------

        if (
            !isValidObjectId(
                resumeId
            )
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ID",
                    message: "Invalid resume ID.",
                },
            });
        }

        // ------------------------------------------------------
        // Resume data
        // ------------------------------------------------------

        if (
            resumeData === undefined ||
            resumeData === null
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Resume data is required.",
                },
            });
        }

        const parsedResumeData =
            parseResumeData(
                resumeData
            );

        if (
            !isPlainObject(
                parsedResumeData
            )
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid resume data.",
                },
            });
        }

        const serializedResumeData =
            JSON.stringify(
                parsedResumeData
            );

        if (
            Buffer.byteLength(
                serializedResumeData,
                "utf8"
            ) >
            MAX_RESUME_DATA_BYTES
        ) {
            return res.status(413).json({
                success: false,
                error: {
                    code: "REQUEST_TOO_LARGE",
                    message: "Resume data is too large.",
                },
            });
        }

        const sanitizedResumeData =
            sanitizeResumeData(
                parsedResumeData
            );

        if (
            !sanitizedResumeData
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid resume data.",
                },
            });
        }

        // ------------------------------------------------------
        // Image validation
        // ------------------------------------------------------
        //
        // Step 6F-3 (Atomic Photo Replacement):
        //   1. Capture the existing photo's fileId BEFORE any
        //      new upload. The DB is the authority on which
        //      image is currently ACTIVE.
        //   2. Upload + validate the NEW photo (with rollback
        //      on failure, established in 6F-2).
        //   3. Persist the NEW { url, fileId } to MongoDB.
        //   4. Only after the DB write succeeds, schedule the
        //      safe cleanup of the OLD ImageKit asset.
        //
        // The OLD image is never deleted before the NEW one
        // is durably stored — preventing permanent data loss
        // on network failure.
        // ------------------------------------------------------

        let imageUrl = null;
        let newlyUploadedFileId = null;

        // Existing photo's fileId from the current resume in DB.
        // Read BEFORE the new upload so we still know what to
        // clean up if the new upload itself fails.
        let previousPhotoFileId = null;
        try {
            const existingForReplacement =
                await resumeService.getResume(
                    resumeId,
                    userId
                );
            const existingPhoto = normalizePhoto(
                existingForReplacement?.personalInfo?.photo
            );
            if (existingPhoto.fileId) {
                previousPhotoFileId = existingPhoto.fileId;
            }
        } catch (existingLookupError) {
            /*
             * If we cannot read the current resume, we cannot
             * safely identify an "old" photo for replacement.
             *
             * Surface a controlled error rather than risking
             * deleting an asset we cannot confirm exists.
             */
            logger.error(
                "Failed to read existing resume before photo replacement",
                {
                    resumeId,
                    name: existingLookupError?.name,
                    message: existingLookupError?.message,
                }
            );
            if (existingLookupError?.name === "ApiError") {
                return res.status(existingLookupError.statusCode || 404).json({
                    success: false,
                    error: {
                        code: existingLookupError.code || "APPLICATION_ERROR",
                        message: existingLookupError.message,
                    },
                });
            }
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to process photo replacement. Please try again.",
                },
            });
        }

        if (image) {
            if (
                !ALLOWED_IMAGE_TYPES.has(
                    image.mimetype
                )
            ) {
                return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_IMAGE_TYPE",
                    message: "Invalid image type. Only JPG, PNG, and WebP images are allowed.",
                },
            });
            }

            if (
                !image.buffer ||
                !Buffer.isBuffer(
                    image.buffer
                )
            ) {
                return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_IMAGE",
                    message: "Uploaded image could not be processed.",
                },
            });
            }

            if (
                image.size >
                MAX_IMAGE_SIZE
            ) {
                return res.status(400).json({
                success: false,
                error: {
                    code: "REQUEST_TOO_LARGE",
                    message: "Image is too large. Maximum allowed size is 5 MB.",
                },
            });
            }

            if (
                image.buffer.length === 0
            ) {
                return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_IMAGE",
                    message: "Uploaded image is empty.",
                },
            });
            }

            // --------------------------------------------------
            // Magic-byte + Sharp decode validation (6D)
            // --------------------------------------------------

            let imageMetadata;
            try {
                imageMetadata = await validateSafeImage(
                    image.buffer,
                    image.mimetype
                );
            } catch (validationError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: validationError.code || "INVALID_IMAGE",
                        message: "Uploaded image failed validation.",
                    },
                });
            }

            // --------------------------------------------------
            // Delegate to imageService for ImageKit upload
            // --------------------------------------------------

            const shouldRemoveBackground = isTrue(removeBackground);

            logger.info("Processing profile image", {
                mimeType: image.mimetype,
                size: image.size,
                removeBackground: shouldRemoveBackground,
            });

            let uploadResult;
            try {
                uploadResult = await imageService.processProfileImage({
                    buffer: image.buffer,
                    fileName: image.originalname,
                    removeBackground: shouldRemoveBackground,
                });
            } catch (imageError) {
                logger.error("Profile image processing error", {
                    name: imageError?.name,
                    message: imageError?.message,
                    code: imageError?.code,
                    status: imageError?.status,
                });

                return res.status(502).json({
                    success: false,
                    error: {
                        code: "IMAGE_PROCESSING_ERROR",
                        message: "Unable to process profile image. Please try again.",
                    },
                });
            }

            imageUrl = uploadResult.url;
            const fileId = uploadResult.fileId || "";
            newlyUploadedFileId = fileId || null;

            logger.info("Profile image uploaded successfully", {
                format: imageMetadata.format,
                width: imageMetadata.width,
                height: imageMetadata.height,
            });

            // --------------------------------------------------
            // Set server-generated image URL
            // --------------------------------------------------

            sanitizedResumeData.personalInfo =
                sanitizedResumeData.personalInfo ||
                {};

            sanitizedResumeData.personalInfo.photo =
                normalizePhoto({
                    url: imageUrl,
                    fileId: fileId || "",
                });
        }

        // ------------------------------------------------------
        // Update only the authenticated user's resume
        // Using resumeService for ownership enforcement
        // ------------------------------------------------------

        let resume;
        try {
            resume =
                await resumeService.updateResume(
                    resumeId,
                    userId,
                    sanitizedResumeData,
                    typeof expectedVersion === "number"
                        ? expectedVersion
                        : undefined
                );
        } catch (dbError) {
            if (newlyUploadedFileId) {
                logger.info("MongoDB save failed, rolling back newly uploaded image", { fileId: newlyUploadedFileId });
                try {
                    await imageService.deleteImage(newlyUploadedFileId);
                } catch (rollbackError) {
                    logger.error("Failed to rollback newly uploaded image", {
                        fileId: newlyUploadedFileId,
                        error: rollbackError?.message,
                    });
                }
            }
            throw dbError;
        }

        if (!resume) {
            if (newlyUploadedFileId) {
                logger.info("Resume not found, rolling back newly uploaded image", { fileId: newlyUploadedFileId });
                try {
                    await imageService.deleteImage(newlyUploadedFileId);
                } catch (rollbackError) {
                    logger.error("Failed to rollback newly uploaded image", {
                        fileId: newlyUploadedFileId,
                        error: rollbackError?.message,
                    });
                }
            }

            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Resume not found.",
                },
            });
        }

        // ------------------------------------------------------
        // Step 6F-3 & 6F-4: Safe post-persistence cleanup of photo
        // ------------------------------------------------------
        // Case A (Step 6F-3: Atomic Replacement):
        //   A new image was uploaded & saved to DB AND a previous
        //   photo existed (with a different fileId). Clean up the
        //   old ImageKit file.
        //
        // Case B (Step 6F-4: Explicit Removal):
        //   No new image was uploaded, but the client explicitly
        //   cleared personalInfo.photo ({ url: "", fileId: "" })
        //   while a previous photo existed in DB with a fileId.
        //   Clean up the removed ImageKit file.
        //
        // In both cases:
        // 1. DB persistence is complete and authoritative before
        //    ImageKit deletion is attempted.
        // 2. Failure of ImageKit deletion logs a warning and does
        //    NOT fail the client's HTTP response.
        // ------------------------------------------------------

        const isExplicitPhotoRemoval =
            !image &&
            parsedResumeData &&
            (parsedResumeData.personalInfo || parsedResumeData.personal_info) &&
            previousPhotoFileId &&
            sanitizedResumeData.personalInfo?.photo?.fileId === "" &&
            sanitizedResumeData.personalInfo?.photo?.url === "";

        const shouldCleanupPreviousPhoto =
            (newlyUploadedFileId && previousPhotoFileId && previousPhotoFileId !== newlyUploadedFileId) ||
            isExplicitPhotoRemoval;

        if (shouldCleanupPreviousPhoto) {
            logger.info("Cleaning up replaced or removed profile image from ImageKit", {
                oldFileId: previousPhotoFileId,
                newFileId: newlyUploadedFileId || null,
                isExplicitRemoval: Boolean(isExplicitPhotoRemoval),
            });

            try {
                await imageService.deleteImage(previousPhotoFileId);
            } catch (cleanupError) {
                /*
                 * Cleanup failure of an old file MUST NOT fail a
                 * successful resume update response or roll back
                 * the already-cleared database reference.
                 *
                 * Log as warning so orphan reconciliation can handle it.
                 */
                logger.warn("Failed to delete profile image from ImageKit", {
                    oldFileId: previousPhotoFileId,
                    newFileId: newlyUploadedFileId || null,
                    error: cleanupError?.message,
                });
            }
        }

        // ------------------------------------------------------
        // Response
        // ------------------------------------------------------

        return res.status(200).json({
            success: true,
            data: {
                resume,
                message: image
                    ? "Resume and profile image updated successfully."
                    : "Resume updated successfully.",
            },
        });
    } catch (error) {
        // ----------------------------------------------------
        // Handle ApiError from service
        // ----------------------------------------------------

        if (error?.name === "ApiError") {
            return res
                .status(error.statusCode)
                .json({
                    success: false,
                    error: {
                        code: error.code || "APPLICATION_ERROR",
                        message: error.message,
                    },
                });
        }

        logger.error(
            "Update resume error:",
            {
                name: error?.name,
                message: error?.message,
                code: error?.code,
            }
        );

        return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to update resume. Please try again.",
                },
            });
    }
};

// ============================================================
// Download Resume PDF
// ============================================================

export const downloadResumePdf = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const userId = req.userId;

        if (!isValidObjectId(resumeId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_RESUME_ID",
                    message: "Invalid resume ID.",
                },
            });
        }

        const resume = await Resume.findOne({ _id: resumeId, userId });

        if (!resume) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "RESUME_NOT_FOUND",
                    message: "Resume not found or access denied.",
                },
            });
        }

        const html = renderResumeHtml(resume.toObject ? resume.toObject() : resume);
        const { buffer, filename } = await generateResumePdf({
            html,
            resumeTitle: resume.title || "Resume",
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );
        res.setHeader("Cache-Control", "private, no-store");

        return res.send(buffer);
    } catch (error) {
        logger.error("PDF generation endpoint error:", {
            name: error?.name,
            message: error?.message,
        });

        return res.status(500).json({
            success: false,
            error: {
                code: "PDF_GENERATION_FAILED",
                message: "Unable to generate PDF document. Please try again.",
            },
        });
    }
};