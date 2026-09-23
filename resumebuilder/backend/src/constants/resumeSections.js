// ============================================================
// CuratoCV Resume Section Registry
// ============================================================
//
// Single source of truth for the section types supported by
// the CuratoCV resume editor.
//
// IMPORTANT:
// ------------------------------------------------------------
// This file contains DOMAIN DEFINITIONS only.
//
// It does NOT:
// - access MongoDB
// - contain Mongoose schemas
// - render React components
// - contain controllers/services
// - modify resume data
// - validate HTTP requests
//
// Validators, services, and the frontend section system can
// reference these definitions rather than maintaining their
// own independent list of section types.
// ============================================================

// ============================================================
// Section Type Identifiers
// ============================================================
//
// These identifiers are stored in Resume.sections[].type.
//
// IMPORTANT:
// Once resumes exist in production, changing these identifiers
// becomes a data-migration concern. Keep them stable.
// ============================================================

const SECTION_TYPES = Object.freeze({
    SUMMARY: "summary",
    EXPERIENCE: "experience",
    EDUCATION: "education",
    SKILLS: "skills",
    PROJECTS: "projects",

    CERTIFICATES: "certificates",
    COURSES: "courses",
    AWARDS: "awards",
    LANGUAGES: "languages",
    INTERESTS: "interests",
    ORGANISATIONS: "organisations",
    PUBLICATIONS: "publications",
    REFERENCES: "references",
    DECLARATION: "declaration",

    CUSTOM: "custom",
});

// ============================================================
// Section Definitions
// ============================================================
//
// These definitions describe what each section represents.
//
// They are metadata, not rendering instructions.
//
// The frontend renderer remains responsible for visual
// presentation.
// ============================================================

const SECTION_DEFINITIONS = Object.freeze({
    [SECTION_TYPES.SUMMARY]: Object.freeze({
        type: SECTION_TYPES.SUMMARY,

        defaultTitle:
            "Professional Summary",

        category:
            "core",

        supportsEntries:
            false,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.EXPERIENCE]: Object.freeze({
        type: SECTION_TYPES.EXPERIENCE,

        defaultTitle:
            "Experience",

        category:
            "core",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.EDUCATION]: Object.freeze({
        type: SECTION_TYPES.EDUCATION,

        defaultTitle:
            "Education",

        category:
            "core",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.SKILLS]: Object.freeze({
        type: SECTION_TYPES.SKILLS,

        defaultTitle:
            "Skills",

        category:
            "core",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.PROJECTS]: Object.freeze({
        type: SECTION_TYPES.PROJECTS,

        defaultTitle:
            "Projects",

        category:
            "core",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.CERTIFICATES]: Object.freeze({
        type: SECTION_TYPES.CERTIFICATES,

        defaultTitle:
            "Certificates",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.COURSES]: Object.freeze({
        type: SECTION_TYPES.COURSES,

        defaultTitle:
            "Courses",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.AWARDS]: Object.freeze({
        type: SECTION_TYPES.AWARDS,

        defaultTitle:
            "Awards",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.LANGUAGES]: Object.freeze({
        type: SECTION_TYPES.LANGUAGES,

        defaultTitle:
            "Languages",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.INTERESTS]: Object.freeze({
        type: SECTION_TYPES.INTERESTS,

        defaultTitle:
            "Interests",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.ORGANISATIONS]: Object.freeze({
        type: SECTION_TYPES.ORGANISATIONS,

        defaultTitle:
            "Organisations",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.PUBLICATIONS]: Object.freeze({
        type: SECTION_TYPES.PUBLICATIONS,

        defaultTitle:
            "Publications",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.REFERENCES]: Object.freeze({
        type: SECTION_TYPES.REFERENCES,

        defaultTitle:
            "References",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.DECLARATION]: Object.freeze({
        type: SECTION_TYPES.DECLARATION,

        defaultTitle:
            "Declaration",

        category:
            "additional",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        supportsMultiple:
            false,

        userCanRemove:
            true,
    }),

    [SECTION_TYPES.CUSTOM]: Object.freeze({
        type: SECTION_TYPES.CUSTOM,

        defaultTitle:
            "Custom Section",

        category:
            "custom",

        supportsEntries:
            true,

        supportsCustomization:
            true,

        /*
         * Custom sections are intentionally allowed to exist
         * multiple times.
         */
        supportsMultiple:
            true,

        userCanRemove:
            true,
    }),
});

// ============================================================
// Section Categories
// ============================================================

const SECTION_CATEGORIES = Object.freeze({
    CORE: "core",
    ADDITIONAL: "additional",
    CUSTOM: "custom",
});

// ============================================================
// Default Section Order
// ============================================================
//
// This determines the initial order of sections when a new
// resume is created.
//
// It does NOT mean users are forced to keep this order.
// The editor can reorder sections later.
// ============================================================

const DEFAULT_SECTION_ORDER = Object.freeze([
    SECTION_TYPES.SUMMARY,
    SECTION_TYPES.EXPERIENCE,
    SECTION_TYPES.EDUCATION,
    SECTION_TYPES.SKILLS,
    SECTION_TYPES.PROJECTS,
]);

// ============================================================
// Add Content Registry
// ============================================================
//
// Used by the "Add Content" experience.
//
// This keeps available section choices centralized instead of
// hard-coding them inside AddContent.jsx.
// ============================================================

const ADDABLE_SECTION_TYPES = Object.freeze([
    SECTION_TYPES.SUMMARY,
    SECTION_TYPES.EXPERIENCE,
    SECTION_TYPES.EDUCATION,
    SECTION_TYPES.SKILLS,
    SECTION_TYPES.PROJECTS,

    SECTION_TYPES.CERTIFICATES,
    SECTION_TYPES.COURSES,
    SECTION_TYPES.AWARDS,
    SECTION_TYPES.LANGUAGES,
    SECTION_TYPES.INTERESTS,
    SECTION_TYPES.ORGANISATIONS,
    SECTION_TYPES.PUBLICATIONS,
    SECTION_TYPES.REFERENCES,
    SECTION_TYPES.DECLARATION,

    SECTION_TYPES.CUSTOM,
]);

// ============================================================
// Derived Lists
// ============================================================

const ALL_SECTION_TYPES = Object.freeze(
    Object.values(
        SECTION_TYPES
    )
);

const CORE_SECTION_TYPES = Object.freeze(
    Object.values(
        SECTION_DEFINITIONS
    )
        .filter(
            (section) =>
                section.category ===
                SECTION_CATEGORIES.CORE
        )
        .map(
            (section) =>
                section.type
        )
);

const ADDITIONAL_SECTION_TYPES =
    Object.freeze(
        Object.values(
            SECTION_DEFINITIONS
        )
            .filter(
                (section) =>
                    section.category ===
                    SECTION_CATEGORIES.ADDITIONAL
            )
            .map(
                (section) =>
                    section.type
            )
    );

// ============================================================
// Helper Functions
// ============================================================

const isValidSectionType = (
    sectionType
) =>
    typeof sectionType ===
        "string" &&
    ALL_SECTION_TYPES.includes(
        sectionType
    );

const getSectionDefinition = (
    sectionType
) => {
    if (
        !isValidSectionType(
            sectionType
        )
    ) {
        return null;
    }

    return (
        SECTION_DEFINITIONS[
            sectionType
        ] || null
    );
};

// ============================================================
// Export
// ============================================================

const resumeSections = Object.freeze({
    types:
        SECTION_TYPES,

    categories:
        SECTION_CATEGORIES,

    definitions:
        SECTION_DEFINITIONS,

    defaultOrder:
        DEFAULT_SECTION_ORDER,

    addable:
        ADDABLE_SECTION_TYPES,

    all:
        ALL_SECTION_TYPES,

    core:
        CORE_SECTION_TYPES,

    additional:
        ADDITIONAL_SECTION_TYPES,

    isValidType:
        isValidSectionType,

    getDefinition:
        getSectionDefinition,
});

export default resumeSections;