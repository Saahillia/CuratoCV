import resumeRepository from "../Repositories/resumeRepository.js";
import billingService from "../platform/backend/src/services/billingService.js";
import imageService from "./imageService.js";

import resumeDefaults from "../Constants/resumeDefaults.js";
import resumeSections from "../Constants/resumeSections.js";
import limits from "../Constants/limits.js";

import ApiError from "../../platform/backend/src/utils/apiError.js";
import logger from "../../platform/backend/src/configs/logger.js";
import { isValidObjectId } from "../../platform/backend/src/utils/objectId.js";

// ============================================================
// CuratoCV Resume Service
// ============================================================
//
// Business-logic layer for resumes.
//
// Responsibilities:
// - Create resumes
// - Retrieve resumes
// - Update resume metadata
// - Manage sections
// - Manage section entries
// - Manage visibility
// - Manage customization
// - Enforce ownership
// - Enforce resume-domain limits
// - Prepare data before persistence
//
// NOT responsible for:
// - HTTP req/res
// - JWT authentication
// - Express middleware
// - MongoDB queries directly
// - Frontend rendering
// - AI implementation
// - PDF rendering
//
// Controllers call this service.
// This service calls resumeRepository.
// ============================================================

// ============================================================
// Helpers
// ============================================================

const assertValidResumeId = (resumeId) => {
    if (!isValidObjectId(resumeId)) {
        throw new ApiError(
            400,
            "Invalid resume ID."
        );
    }
};

const assertValidUserId = (userId) => {
    if (!isValidObjectId(userId)) {
        throw new ApiError(
            400,
            "Invalid user ID."
        );
    }
};

const normalizeTitle = (title) => {
    if (
        typeof title !== "string"
    ) {
        return title;
    }

    return title.trim();
};

const cloneDefaultResumeData = () => {
    return resumeDefaults
        .createDefaultResumeData();
};

// ============================================================
// Section Helpers
// ============================================================

const findSection = (
    resume,
    sectionId
) => {
    if (
        !resume ||
        !Array.isArray(
            resume.sections
        )
    ) {
        return null;
    }

    return resume.sections.find(
        (section) =>
            section._id?.toString() ===
            sectionId.toString()
    );
};

const findSectionOrThrow = (
    resume,
    sectionId
) => {
    const section =
        findSection(
            resume,
            sectionId
        );

    if (!section) {
        throw new ApiError(
            404,
            "Resume section not found."
        );
    }

    return section;
};

const findEntry = (
    section,
    entryId
) => {
    if (
        !section ||
        !Array.isArray(
            section.entries
        )
    ) {
        return null;
    }

    return section.entries.find(
        (entry) =>
            entry._id?.toString() ===
            entryId.toString()
    );
};

const findEntryOrThrow = (
    section,
    entryId
) => {
    const entry =
        findEntry(
            section,
            entryId
        );

    if (!entry) {
        throw new ApiError(
            404,
            "Resume entry not found."
        );
    }

    return entry;
};

// ============================================================
// Section Type Validation
// ============================================================

const assertValidSectionType = (
    type
) => {
    if (
        typeof type !==
        "string"
    ) {
        throw new ApiError(
            400,
            "Section type is required."
        );
    }

    if (
        !resumeSections.all.includes(
            type
        )
    ) {
        throw new ApiError(
            400,
            "Invalid resume section type."
        );
    }
};

// ============================================================
// Section Count
// ============================================================

const assertSectionCapacity = (
    resume
) => {
    const sectionCount =
        Array.isArray(
            resume.sections
        )
            ? resume.sections.length
            : 0;

    if (
        sectionCount >=
        limits.resume.sections
            .maxCount
    ) {
        throw new ApiError(
            400,
            `A resume cannot contain more than ${limits.resume.sections.maxCount} sections.`
        );
    }
};

// ============================================================
// Entry Capacity
// ============================================================

const assertEntryCapacity = (
    resume,
    section
) => {
    const sectionEntryCount =
        Array.isArray(
            section.entries
        )
            ? section.entries.length
            : 0;

    if (
        sectionEntryCount >=
        limits.resume.entries
            .maxPerSection
    ) {
        throw new ApiError(
            400,
            `A section cannot contain more than ${limits.resume.entries.maxPerSection} entries.`
        );
    }

    const totalEntries =
        Array.isArray(
            resume.sections
        )
            ? resume.sections.reduce(
                  (
                      total,
                      currentSection
                  ) =>
                      total +
                      (
                          Array.isArray(
                              currentSection.entries
                          )
                              ? currentSection
                                  .entries
                                  .length
                              : 0
                      ),
                  0
              )
            : 0;

    if (
        totalEntries >=
        limits.derived
            .maxTotalEntries
    ) {
        throw new ApiError(
            400,
            `A resume cannot contain more than ${limits.derived.maxTotalEntries} total entries.`
        );
    }
};

// ============================================================
// Section Order
// ============================================================

const getNextSectionOrder = (
    resume
) => {
    if (
        !Array.isArray(
            resume.sections
        ) ||
        resume.sections.length === 0
    ) {
        return 0;
    }

    return (
        Math.max(
            ...resume.sections.map(
                (section) =>
                    Number(
                        section.order
                    ) || 0
            )
        ) + 1
    );
};

// ============================================================
// Entry Order
// ============================================================

const getNextEntryOrder = (
    section
) => {
    if (
        !Array.isArray(
            section.entries
        ) ||
        section.entries.length === 0
    ) {
        return 0;
    }

    return (
        Math.max(
            ...section.entries.map(
                (entry) =>
                    Number(
                        entry.order
                    ) || 0
            )
        ) + 1
    );
};

// ============================================================
// Ownership
// ============================================================

const getOwnedResume =
    async (
        resumeId,
        userId
    ) => {
        assertValidResumeId(
            resumeId
        );

        assertValidUserId(
            userId
        );

        const resume =
            await resumeRepository
                .findByIdAndUserId(
                    resumeId,
                    userId
                );

        if (!resume) {
            throw new ApiError(
                404,
                "Resume not found."
            );
        }

        return resume;
    };

// ============================================================
// Create Resume
// ============================================================

/**
 * Create a new resume for a user.
 *
 * Enforces resume creation entitlements from the billing service.
 *
 * The default resume structure comes from
 * resumeDefaults.js.
 *
 * IMPORTANT:
 * - Backend is authoritative for all resource limits
 * - The service owns creation of the initial sections
 * - The Mongoose model does not decide which sections
 *   a new resume receives
 * - User subscription limits are verified before creation
 */
const createResume = async (
    userId,
    resumeInput = {}
) => {
    assertValidUserId(
        userId
    );

    // ------------------------------------------------
    // Verify resume limit from billing service
    // ------------------------------------------------

    let resumeLimit;
    let currentResumeCount;

    try {
        resumeLimit =
            await billingService
                .getResumeLimit(userId);

        currentResumeCount =
            await resumeRepository
                .countByUserId(userId);
    } catch (error) {
        logger.error(
            "Failed to check resume entitlements.",
            {
                userId,
                errorCode: error?.code,
                errorMessage: error?.message,
            }
        );

        throw new ApiError(
            500,
            "Unable to verify resume entitlements."
        );
    }

    // ------------------------------------------------
    // Enforce resume limit
    // ------------------------------------------------

    // null limit means unlimited (PRO_PLUS)
    if (
        resumeLimit !== null &&
        currentResumeCount >=
            resumeLimit
    ) {
        logger.info(
            "Resume creation rejected: limit reached.",
            {
                userId,
                currentCount: currentResumeCount,
                limit: resumeLimit,
            }
        );

        throw new ApiError(
            403,
            "Resume limit reached for your subscription tier."
        );
    }

    // ------------------------------------------------
    // Prepare resume data
    // ------------------------------------------------

    const defaults =
        cloneDefaultResumeData();

    const title =
        normalizeTitle(
            resumeInput.title
        ) ||
        defaults.title;

    const resumeData = {
        userId,

        title,

        public:
            typeof resumeInput.public ===
            "boolean"
                ? resumeInput.public
                : defaults.public,

        personalInfo: {
            ...defaults.personalInfo,
            ...(resumeInput.personalInfo ||
                {}),
        },

        design: {
            ...defaults.design,

            ...(resumeInput.design ||
                {}),

            colors: {
                ...defaults.design.colors,
                ...(
                    resumeInput.design
                        ?.colors || {}
                ),
            },

            typography: {
                ...defaults.design.typography,
                ...(
                    resumeInput.design
                        ?.typography || {}
                ),
            },

            spacing: {
                ...defaults.design.spacing,
                ...(
                    resumeInput.design
                        ?.spacing || {}
                ),
            },

            layout: {
                ...defaults.design.layout,
                ...(
                    resumeInput.design
                        ?.layout || {}
                ),
            },

            header: {
                ...defaults.design.header,
                ...(
                    resumeInput.design
                        ?.header || {}
                ),
            },

            footer: {
                ...defaults.design.footer,
                ...(
                    resumeInput.design
                        ?.footer || {}
                ),
            },

            photo: {
                ...defaults.design.photo,
                ...(
                    resumeInput.design
                        ?.photo || {}
                ),
            },

            links: {
                ...defaults.design.links,
                ...(
                    resumeInput.design
                        ?.links || {}
                ),
            },
        },

        /*
         * The default section factory already creates fresh
         * section objects.
         */
        sections:
            defaults.sections,
    };

    // ------------------------------------------------
    // Create resume
    // ------------------------------------------------

    /*
     * We intentionally do not allow arbitrary client-provided
     * sections during initial creation.
     *
     * Sections should be created through the dedicated
     * section operations so limits/order/customization remain
     * controlled.
     */
    const resume =
        await resumeRepository.create(
            resumeData
        );

    // ------------------------------------------------
    // Audit logging
    // ------------------------------------------------

    logger.info(
        "Resume created successfully.",
        {
            userId,
            resumeId: resume._id,
            title: resume.title,
        }
    );

    return resume;
};

// ============================================================
// Get Resume
// ============================================================

const getResume = async (
    resumeId,
    userId
) => {
    return getOwnedResume(
        resumeId,
        userId
    );
};

// ============================================================
// Get User Resumes
// ============================================================

const getUserResumes = async (
    userId
) => {
    assertValidUserId(
        userId
    );

    return resumeRepository
        .findAllByUserId(
            userId
        );
};

// ============================================================
// Get Public Resume
// ============================================================

const getPublicResume = async (
    resumeId
) => {
    assertValidResumeId(
        resumeId
    );

    const resume =
        await resumeRepository
            .findPublicById(
                resumeId
            );

    if (!resume) {
        throw new ApiError(
            404,
            "Public resume not found."
        );
    }

    return resume;
};

// ============================================================
// Update Resume
// ============================================================
//
// The controller is responsible for sanitizing the incoming
// resume data before calling this method.
//
// This service method enforces ownership and applies the
// sanitized update.
// ============================================================

const updateResume = async (
    resumeId,
    userId,
    updateData,
    expectedVersion
) => {
    // Verify ownership and resume existence.
    const existingResume =
        await getOwnedResume(
            resumeId,
            userId
        );

    if (
        !updateData ||
        typeof updateData !== "object" ||
        Array.isArray(updateData) ||
        Object.keys(updateData).length === 0
    ) {
        // Nothing to update; return the existing resume.
        return existingResume;
    }

    const updated =
        await resumeRepository
            .updateByIdAndUserId(
                resumeId,
                userId,
                updateData,
                expectedVersion
            );

    if (!updated) {
        if (typeof expectedVersion === "number") {
            throw new ApiError(
                409,
                "Resume was modified elsewhere. Concurrency conflict."
            );
        }
        throw new ApiError(
            404,
            "Resume not found."
        );
    }

    return updated;
};

// ============================================================
// Update Public Status
// ============================================================

const updatePublicStatus =
    async (
        resumeId,
        userId,
        isPublic
    ) => {
        if (
            typeof isPublic !==
            "boolean"
        ) {
            throw new ApiError(
                400,
                "Public status must be a boolean."
            );
        }

        await getOwnedResume(
            resumeId,
            userId
        );

        return resumeRepository
            .updatePublicStatus(
                resumeId,
                userId,
                isPublic
            );
    };

// ============================================================
// Add Section
// ============================================================

const addSection = async (
    resumeId,
    userId,
    sectionData
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    assertSectionCapacity(
        resume
    );

    assertValidSectionType(
        sectionData.type
    );

    const title =
        normalizeTitle(
            sectionData.title
        );

    if (!title) {
        throw new ApiError(
            400,
            "Section title is required."
        );
    }

    const section = {
        type:
            sectionData.type,

        title,

        order:
            getNextSectionOrder(
                resume
            ),

        visible:
            sectionData.visible ??
            true,

        customization: {
            ...resumeDefaults
                .sectionCustomization,

            ...(sectionData
                .customization ||
                {}),
        },

        entries: [],
    };

    const sections = [
        ...resume.sections,
        section,
    ];

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections,
            }
        );
};

// ============================================================
// Update Section
// ============================================================

const updateSection = async (
    resumeId,
    userId,
    sectionId,
    updateData
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    const section =
        findSectionOrThrow(
            resume,
            sectionId
        );

    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "type"
        )
    ) {
        assertValidSectionType(
            updateData.type
        );

        section.type =
            updateData.type;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "title"
        )
    ) {
        const title =
            normalizeTitle(
                updateData.title
            );

        if (!title) {
            throw new ApiError(
                400,
                "Section title cannot be empty."
            );
        }

        section.title =
            title;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "visible"
        )
    ) {
        section.visible =
            Boolean(
                updateData.visible
            );
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "customization"
        )
    ) {
        section.customization =
            {
                ...section.customization?.toObject?.() ||
                    section.customization ||
                    {},

                ...updateData.customization,
            };
    }

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections:
                    resume.sections,
            }
        );
};

// ============================================================
// Delete Section
// ============================================================

const deleteSection = async (
    resumeId,
    userId,
    sectionId
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    findSectionOrThrow(
        resume,
        sectionId
    );

    const sections =
        resume.sections
            .filter(
                (section) =>
                    section._id
                        .toString() !==
                    sectionId.toString()
            )
            .map(
                (
                    section,
                    index
                ) => {
                    section.order =
                        index;

                    return section;
                }
            );

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections,
            }
        );
};

// ============================================================
// Reorder Sections
// ============================================================

const reorderSections = async (
    resumeId,
    userId,
    sectionIds
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    if (
        !Array.isArray(
            sectionIds
        )
    ) {
        throw new ApiError(
            400,
            "sectionIds must be an array."
        );
    }

    if (
        sectionIds.length !==
        resume.sections.length
    ) {
        throw new ApiError(
            400,
            "All resume sections must be included when reordering."
        );
    }

    const sectionIdSet =
        new Set(
            resume.sections.map(
                (section) =>
                    section._id.toString()
            )
        );

    const requestedIdSet =
        new Set(
            sectionIds.map(
                (id) =>
                    id.toString()
            )
        );

    if (
        sectionIdSet.size !==
        requestedIdSet.size
    ) {
        throw new ApiError(
            400,
            "Invalid section ordering."
        );
    }

    for (
        const sectionId of
            sectionIds
    ) {
        if (
            !sectionIdSet.has(
                sectionId.toString()
            )
        ) {
            throw new ApiError(
                400,
                "Invalid section ID in ordering."
            );
        }
    }

    const sections =
        sectionIds.map(
            (
                sectionId,
                index
            ) => {
                const section =
                    resume.sections.find(
                        (
                            currentSection
                        ) =>
                            currentSection
                                ._id
                                .toString() ===
                            sectionId.toString()
                    );

                section.order =
                    index;

                return section;
            }
        );

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections,
            }
        );
};

// ============================================================
// Add Entry
// ============================================================

const addEntry = async (
    resumeId,
    userId,
    sectionId,
    entryData = {}
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    const section =
        findSectionOrThrow(
            resume,
            sectionId
        );

    assertEntryCapacity(
        resume,
        section
    );

    const entry = {
        order:
            getNextEntryOrder(
                section
            ),

        visible:
            entryData.visible ??
            true,

        customization: {
            ...resumeDefaults
                .entryCustomization,

            ...(entryData
                .customization ||
                {}),
        },

        data:
            entryData.data ||
            {},
    };

    section.entries.push(
        entry
    );

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections:
                    resume.sections,
            }
        );
};

// ============================================================
// Update Entry
// ============================================================

const updateEntry = async (
    resumeId,
    userId,
    sectionId,
    entryId,
    updateData
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    const section =
        findSectionOrThrow(
            resume,
            sectionId
        );

    const entry =
        findEntryOrThrow(
            section,
            entryId
        );

    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "visible"
        )
    ) {
        entry.visible =
            Boolean(
                updateData.visible
            );
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "data"
        )
    ) {
        entry.data =
            updateData.data;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "customization"
        )
    ) {
        entry.customization =
            {
                ...entry.customization?.toObject?.() ||
                    entry.customization ||
                    {},

                ...updateData.customization,
            };
    }

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections:
                    resume.sections,
            }
        );
};

// ============================================================
// Delete Entry
// ============================================================

const deleteEntry = async (
    resumeId,
    userId,
    sectionId,
    entryId
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    const section =
        findSectionOrThrow(
            resume,
            sectionId
        );

    findEntryOrThrow(
        section,
        entryId
    );

    section.entries =
        section.entries
            .filter(
                (entry) =>
                    entry._id
                        .toString() !==
                    entryId.toString()
            )
            .map(
                (
                    entry,
                    index
                ) => {
                    entry.order =
                        index;

                    return entry;
                }
            );

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections:
                    resume.sections,
            }
        );
};

// ============================================================
// Reorder Entries
// ============================================================

const reorderEntries = async (
    resumeId,
    userId,
    sectionId,
    entryIds
) => {
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    const section =
        findSectionOrThrow(
            resume,
            sectionId
        );

    if (
        !Array.isArray(
            entryIds
        )
    ) {
        throw new ApiError(
            400,
            "entryIds must be an array."
        );
    }

    if (
        entryIds.length !==
        section.entries.length
    ) {
        throw new ApiError(
            400,
            "All section entries must be included when reordering."
        );
    }

    const existingIds =
        new Set(
            section.entries.map(
                (entry) =>
                    entry._id.toString()
            )
        );

    const requestedIds =
        new Set(
            entryIds.map(
                (id) =>
                    id.toString()
            )
        );

    if (
        existingIds.size !==
        requestedIds.size
    ) {
        throw new ApiError(
            400,
            "Invalid entry ordering."
        );
    }

    for (
        const entryId of
            entryIds
    ) {
        if (
            !existingIds.has(
                entryId.toString()
            )
        ) {
            throw new ApiError(
                400,
                "Invalid entry ID in ordering."
            );
        }
    }

    section.entries =
        entryIds.map(
            (
                entryId,
                index
            ) => {
                const entry =
                    section.entries.find(
                        (
                            currentEntry
                        ) =>
                            currentEntry
                                ._id
                                .toString() ===
                            entryId.toString()
                    );

                entry.order =
                    index;

                return entry;
            }
        );

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                sections:
                    resume.sections,
            }
        );
};

// ============================================================
// Update Resume Design
// ============================================================

const updateDesign = async (
    resumeId,
    userId,
    design
) => {
    await getOwnedResume(
        resumeId,
        userId
    );

    if (
        !design ||
        typeof design !==
            "object" ||
        Array.isArray(design)
    ) {
        throw new ApiError(
            400,
            "Design must be an object."
        );
    }

    return resumeRepository
        .updateByIdAndUserId(
            resumeId,
            userId,
            {
                design,
            }
        );
};

// ============================================================
// Update Personal Information
// ============================================================

const updatePersonalInfo =
    async (
        resumeId,
        userId,
        personalInfo
    ) => {
        await getOwnedResume(
            resumeId,
            userId
        );

        if (
            !personalInfo ||
            typeof personalInfo !==
                "object" ||
            Array.isArray(
                personalInfo
            )
        ) {
            throw new ApiError(
                400,
                "Personal information must be an object."
            );
        }

        return resumeRepository
            .updateByIdAndUserId(
                resumeId,
                userId,
                {
                    personalInfo,
                }
            );
    };

// ============================================================
// Delete Resume
// ============================================================

const deleteResume = async (
    resumeId,
    userId
) => {
    // Verify ownership and resume exists
    const resume =
        await getOwnedResume(
            resumeId,
            userId
        );

    // Extract photo references before deletion
    const photoFileId = resume.personalInfo?.photo?.fileId;

    const deleted =
        await resumeRepository
            .deleteByIdAndUserId(
                resumeId,
                userId
            );

    if (!deleted) {
        throw new ApiError(
            404,
            "Resume not found."
        );
    }

    // Step 6F-5: Post-persistence asset cleanup
    if (photoFileId) {
        try {
            await imageService.deleteImage(photoFileId);
            logger.info("Associated photo successfully deleted from external storage.", {
                resumeId,
                fileId: photoFileId,
            });
        } catch (error) {
            logger.warn("Failed to delete photo from external storage during resume deletion. Orphaned asset may require manual cleanup.", {
                resumeId,
                fileId: photoFileId,
                error: error.message,
            });
        }
    }

    // Audit logging
    logger.info(
        "Resume deleted successfully.",
        {
            userId,
            resumeId: resume._id,
            title: resume.title,
        }
    );

    return deleted;
};

// ============================================================
// Export
// ============================================================

const resumeService =
    Object.freeze({
        createResume,
        getResume,
        getUserResumes,
        getPublicResume,
        updateResume,
        updatePublicStatus,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        addEntry,
        updateEntry,
        deleteEntry,
        reorderEntries,
        updateDesign,
        updatePersonalInfo,
        deleteResume,
    });

export default resumeService;