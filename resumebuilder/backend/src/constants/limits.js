// ============================================================
// CuratoCV Resume Limits
// ============================================================
//
// Centralized limits for resume-domain data.
//
// These limits protect:
//   - MongoDB document size
//   - application memory
//   - API payload size
//   - editor abuse
//   - excessive nested resume data
//   - unexpectedly expensive rendering/export operations
//
// IMPORTANT:
// These are APPLICATION/DATA limits.
//
// They are intentionally separate from:
//   - HTTP request limits
//   - Multer upload limits
//   - rate limits
//   - MongoDB connection limits
//
// Those belong to their respective configuration layers.
// ============================================================

// ============================================================
// General Resume Limits
// ============================================================

const RESUME_LIMITS = Object.freeze({
    // --------------------------------------------------------
    // Resume metadata
    // --------------------------------------------------------

    title: {
        minLength: 1,
        maxLength: 120,
    },

    // --------------------------------------------------------
    // Personal information
    // --------------------------------------------------------

    personalInfo: {
        fullName: {
            maxLength: 120,
        },

        profession: {
            maxLength: 160,
        },

        email: {
            maxLength: 254,
        },

        phone: {
            maxLength: 40,
        },

        location: {
            maxLength: 160,
        },

        website: {
            maxLength: 2048,
        },

        linkedin: {
            maxLength: 2048,
        },

        github: {
            maxLength: 2048,
        },
    },

    // --------------------------------------------------------
    // Professional summary
    // --------------------------------------------------------

    professionalSummary: {
        minLength: 0,
        maxLength: 5000,
    },

    // --------------------------------------------------------
    // Sections
    // --------------------------------------------------------

    sections: {
        maxCount: 30,

        title: {
            minLength: 1,
            maxLength: 120,
        },

        /*
         * Custom section type names are intentionally limited
         * so a user cannot create extremely large section
         * metadata.
         */
        customTitle: {
            minLength: 1,
            maxLength: 120,
        },
    },

    // --------------------------------------------------------
    // Entries
    // --------------------------------------------------------

    entries: {
        /*
         * Maximum entries inside one section.
         */
        maxPerSection: 100,

        title: {
            maxLength: 200,
        },

        subtitle: {
            maxLength: 200,
        },

        description: {
            maxLength: 10000,
        },

        location: {
            maxLength: 200,
        },

        date: {
            maxLength: 100,
        },

        url: {
            maxLength: 2048,
        },
    },

    // --------------------------------------------------------
    // Skills
    // --------------------------------------------------------

    skills: {
        maxCategories: 30,

        categoryTitle: {
            maxLength: 120,
        },

        maxSkillsPerCategory: 50,

        skillName: {
            maxLength: 100,
        },
    },

    // --------------------------------------------------------
    // Projects
    // --------------------------------------------------------

    projects: {
        maxTechnologies: 50,

        technologyName: {
            maxLength: 100,
        },
    },

    // --------------------------------------------------------
    // Education
    // --------------------------------------------------------

    education: {
        maxEntries: 50,

        institution: {
            maxLength: 200,
        },

        degree: {
            maxLength: 200,
        },

        fieldOfStudy: {
            maxLength: 200,
        },
    },

    // --------------------------------------------------------
    // Experience
    // --------------------------------------------------------

    experience: {
        maxEntries: 50,

        company: {
            maxLength: 200,
        },

        position: {
            maxLength: 200,
        },

        responsibilities: {
            maxItems: 50,

            itemMaxLength: 2000,
        },
    },

    // --------------------------------------------------------
    // Links
    // --------------------------------------------------------

    links: {
        maxPerEntry: 20,

        label: {
            maxLength: 120,
        },

        url: {
            maxLength: 2048,
        },
    },

    // --------------------------------------------------------
    // Custom sections
    // --------------------------------------------------------

    customSections: {
        /*
         * This is intentionally lower than the global section
         * limit because custom sections can contain arbitrary
         * user-defined structures.
         */
        maxCount: 20,

        maxEntriesPerSection: 100,

        entryContentMaxLength: 10000,
    },

    // --------------------------------------------------------
    // Customization
    // --------------------------------------------------------

    customization: {
        /*
         * Limits the size of free-form customization values.
         *
         * Actual allowed values will be defined by:
         *
         * Constants/resumeCustomization.js
         *
         * and validated by:
         *
         * Validators/resumeValidator.js
         */
        maxStringValueLength: 200,

        maxCustomPropertiesPerConfiguration: 50,
    },

    // --------------------------------------------------------
    // Design metadata
    // --------------------------------------------------------

    design: {
        fontFamily: {
            maxLength: 120,
        },

        templateName: {
            maxLength: 80,
        },

        colorValue: {
            maxLength: 30,
        },

        numericSetting: {
            min: 0,
            max: 500,
        },
    },
});

// ============================================================
// Derived Limits
// ============================================================
//
// These values are useful to validators and services without
// duplicating calculations throughout the application.
// ============================================================

const DERIVED_LIMITS = Object.freeze({
    /*
     * Maximum number of total entries across the resume.
//
//     This is intentionally a reasonable upper bound to
//     prevent pathological documents containing thousands
//     of nested entries.
     */
    maxTotalEntries:
        RESUME_LIMITS.sections.maxCount * RESUME_LIMITS.entries.maxPerSection,

    /*
     * Maximum total skill entries.
     */
    maxTotalSkills:
        RESUME_LIMITS.skills.maxCategories *
        RESUME_LIMITS.skills.maxSkillsPerCategory,
});

// ============================================================
// Export
// ============================================================

const limits = Object.freeze({
    resume: RESUME_LIMITS,
    derived: DERIVED_LIMITS,
});

export default limits;
