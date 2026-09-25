import Resume from "../models/Resume.js";

// ============================================================
// CuratoCV Resume Repository
// ============================================================
//
// Database-access layer for Resume documents.
//
// Responsibilities:
// - Create Resume documents
// - Find Resume documents
// - Update Resume documents
// - Delete Resume documents
// - Count Resume documents
// - Perform ownership-aware database queries
//
// NOT responsible for:
// - Authentication
// - Authorization decisions
// - HTTP req/res
// - Request validation
// - Business workflows
// - AI operations
// - PDF generation
// - Image processing
// - Response formatting
//
// Services decide WHAT should happen.
// Repositories decide HOW MongoDB is accessed.
// ============================================================

// ============================================================
// Create
// ============================================================

/**
 * Create a new resume.
 *
 * @param {Object} resumeData
 * @returns {Promise<Object>}
 */
const create = async (
    resumeData
) => {
    const resume =
        await Resume.create(
            resumeData
        );

    return resume;
};

// ============================================================
// Find by ID
// ============================================================
//
// Kept for internal database operations where ownership has
// already been established elsewhere.
//
// User-facing service operations should prefer
// findByIdAndUserId().
// ============================================================

/**
 * Find a resume by MongoDB ObjectId.
 *
 * @param {string|ObjectId} resumeId
 * @returns {Promise<Object|null>}
 */
const findById = async (
    resumeId
) => {
    return Resume.findById(
        resumeId
    );
};

// ============================================================
// Find by ID with Owner
// ============================================================

/**
 * Find a resume belonging to a specific user.
 *
 * @param {string|ObjectId} resumeId
 * @param {string|ObjectId} userId
 * @returns {Promise<Object|null>}
 */
const findByIdAndUserId = async (
    resumeId,
    userId
) => {
    return Resume.findOne({
        _id: resumeId,
        userId,
    });
};

// ============================================================
// Find all resumes for a user
// ============================================================

/**
 * Retrieve all resumes owned by a user.
 *
 * Most recently updated resumes are returned first.
 *
 * `lean()` is used because the service only needs plain
 * document data for list responses.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Array>}
 */
const findAllByUserId = async (
    userId
) => {
    return Resume.find({
        userId,
    })
        .sort({
            updatedAt: -1,
        })
        .lean();
};

// ============================================================
// Find public resume
// ============================================================
//
// Public access is intentionally separated from authenticated
// owner access.
//
// Later we can introduce a public slug/identifier without
// changing the rest of the repository contract.
// ============================================================

/**
 * Find a public resume by ID.
 *
 * @param {string|ObjectId} resumeId
 * @returns {Promise<Object|null>}
 */
const findPublicById = async (
    resumeId
) => {
    return Resume.findOne({
        _id: resumeId,
        public: true,
    }).lean();
};

// ============================================================
// Update by ID
// ============================================================
//
// This method is intentionally available for trusted internal
// operations.
//
// User-facing operations should normally use
// updateByIdAndUserId().
// ============================================================

/**
 * Update a resume by ID.
 *
 * Mongoose schema validation is executed during the update.
 *
 * @param {string|ObjectId} resumeId
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
const updateById = async (
    resumeId,
    updateData
) => {
    return Resume.findByIdAndUpdate(
        resumeId,
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

// ============================================================
// Update by ID and User
// ============================================================

/**
 * Update a resume belonging to a specific user with optimistic concurrency control.
 *
 * The ownership condition is part of the MongoDB query itself.
 * If `expectedVersion` is provided (number), it enforces that the stored `__v` matches.
 *
 * @param {string|ObjectId} resumeId
 * @param {string|ObjectId} userId
 * @param {Object} updateData
 * @param {number} [expectedVersion]
 * @returns {Promise<Object|null>}
 */
const updateByIdAndUserId = async (
    resumeId,
    userId,
    updateData,
    expectedVersion
) => {
    const query = {
        _id: resumeId,
        userId,
    };

    if (typeof expectedVersion === "number") {
        query.__v = expectedVersion;
    }

    const updateDoc = {
        $set: updateData,
        $inc: { __v: 1 },
    };

    return Resume.findOneAndUpdate(
        query,
        updateDoc,
        {
            new: true,
            runValidators: true,
        }
    );
};

// ============================================================
// Delete by ID
// ============================================================

/**
 * Delete a resume by ID.
 *
 * Intended for trusted internal operations.
 *
 * @param {string|ObjectId} resumeId
 * @returns {Promise<Object|null>}
 */
const deleteById = async (
    resumeId
) => {
    return Resume.findByIdAndDelete(
        resumeId
    );
};

// ============================================================
// Delete by ID and User
// ============================================================

/**
 * Delete a resume belonging to a specific user.
 *
 * @param {string|ObjectId} resumeId
 * @param {string|ObjectId} userId
 * @returns {Promise<Object|null>}
 */
const deleteByIdAndUserId = async (
    resumeId,
    userId
) => {
    return Resume.findOneAndDelete({
        _id: resumeId,
        userId,
    });
};

// ============================================================
// Delete All Resumes for a User
// ============================================================

/**
 * Delete all resumes belonging to a user.
 *
 * Returns the deleted resume documents so callers can perform
 * post-deletion cleanup (e.g. removing associated ImageKit assets).
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Array>}  — the deleted resume documents
 */
const deleteAllByUserId = async (
    userId
) => {
    const resumes = await Resume.find({ userId }).lean();

    if (resumes.length > 0) {
        await Resume.deleteMany({ userId });
    }

    return resumes;
};

// ============================================================
// Count User Resumes
// ============================================================

/**
 * Count resumes owned by a user.
 *
 * The service layer decides what the maximum allowed number
 * of resumes should be.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<number>}
 */
const countByUserId = async (
    userId
) => {
    return Resume.countDocuments({
        userId,
    });
};

// ============================================================
// Update Public Status
// ============================================================

/**
 * Update the public visibility state of a resume.
 *
 * @param {string|ObjectId} resumeId
 * @param {string|ObjectId} userId
 * @param {boolean} isPublic
 * @returns {Promise<Object|null>}
 */
const updatePublicStatus = async (
    resumeId,
    userId,
    isPublic
) => {
    return Resume.findOneAndUpdate(
        {
            _id: resumeId,
            userId,
        },
        {
            $set: {
                public: isPublic,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

// ============================================================
// Duplicate Resume
// ============================================================
//
// Creates a completely independent copy of an existing resume.
//
// The new resume receives:
// - a new MongoDB _id
// - the same owner
// - copied resume data
// - a new title supplied by the service
//
// The service is responsible for deciding whether duplication
// is allowed and what the new title should be.
// ============================================================

/**
 * Duplicate an existing resume.
 *
 * @param {Object} sourceResume
 * @param {string} newTitle
 * @returns {Promise<Object>}
 */
const duplicate = async (
    sourceResume,
    newTitle
) => {
    if (
        !sourceResume ||
        typeof sourceResume !==
            "object"
    ) {
        throw new Error(
            "A source resume is required for duplication."
        );
    }

    const sourceData =
        typeof sourceResume.toObject ===
        "function"
            ? sourceResume.toObject()
            : {
                  ...sourceResume,
              };

    /*
     * Remove MongoDB-managed fields so Mongoose generates
     * completely new document identity/timestamps.
     */
    delete sourceData._id;
    delete sourceData.createdAt;
    delete sourceData.updatedAt;
    delete sourceData.__v;

    sourceData.title =
        newTitle;

    /*
     * The duplicated resume should not unexpectedly become
     * public.
     */
    sourceData.public =
        false;

    /*
     * Embedded section/entry IDs must also be regenerated.
     *
     * Removing `_id` recursively lets Mongoose generate fresh
     * IDs for the new document.
     */
    if (
        Array.isArray(
            sourceData.sections
        )
    ) {
        sourceData.sections =
            sourceData.sections.map(
                (section) => {
                    const copiedSection = {
                        ...section,
                    };

                    delete copiedSection._id;

                    if (
                        copiedSection.customization
                    ) {
                        copiedSection.customization =
                            {
                                ...copiedSection.customization,
                            };

                        delete copiedSection
                            .customization
                            ._id;
                    }

                    if (
                        Array.isArray(
                            copiedSection.entries
                        )
                    ) {
                        copiedSection.entries =
                            copiedSection.entries.map(
                                (entry) => {
                                    const copiedEntry =
                                        {
                                            ...entry,
                                        };

                                    delete copiedEntry
                                        ._id;

                                    if (
                                        copiedEntry.customization
                                    ) {
                                        copiedEntry.customization =
                                            {
                                                ...copiedEntry.customization,
                                            };

                                        delete copiedEntry
                                            .customization
                                            ._id;
                                    }

                                    return copiedEntry;
                                }
                            );
                    }

                    return copiedSection;
                }
            );
    }

    return create(
        sourceData
    );
};

// ============================================================
// Export
// ============================================================

const resumeRepository =
    Object.freeze({
        create,

        findById,

        findByIdAndUserId,

        findAllByUserId,

        findPublicById,

        updateById,

        updateByIdAndUserId,

        deleteById,

        deleteByIdAndUserId,

        deleteAllByUserId,

        countByUserId,

        updatePublicStatus,

        duplicate,
    });

export default resumeRepository;