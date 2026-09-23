// ============================================================
// CuratoCV Resume Customization Definitions
// ============================================================
//
// This file defines the customization vocabulary supported by
// the resume system.
//
// IMPORTANT:
// ------------------------------------------------------------
// This is a DATA/CONFIGURATION module.
//
// It does NOT:
// - render UI
// - modify resumes
// - validate requests
// - access MongoDB
// - contain React components
// - contain business logic
//
// The frontend can use these definitions to build the editor,
// while the backend validators use them to reject unsupported
// customization values.
// ============================================================

// ============================================================
// Global Resume Customization
// ============================================================
//
// Applies to the entire resume.
// ============================================================

const GLOBAL_CUSTOMIZATION = Object.freeze({
    layout: Object.freeze({
        pageWidth: Object.freeze([
            "standard",
            "compact",
            "wide",
        ]),

        columns: Object.freeze([
            "single",
            "two",
        ]),

        columnRatio: Object.freeze([
            "50-50",
            "60-40",
            "40-60",
            "65-35",
            "35-65",
        ]),

        pageAlignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),
    }),

    typography: Object.freeze({
        fontFamily: Object.freeze([
            "system",
            "inter",
            "roboto",
            "open-sans",
            "lato",
            "montserrat",
            "poppins",
            "merriweather",
            "source-sans-3",
            "serif",
        ]),

        fontSizeScale: Object.freeze([
            "small",
            "normal",
            "large",
        ]),

        headingScale: Object.freeze([
            "small",
            "normal",
            "large",
        ]),

        lineHeight: Object.freeze([
            "tight",
            "normal",
            "relaxed",
        ]),
    }),

    spacing: Object.freeze({
        density: Object.freeze([
            "compact",
            "normal",
            "spacious",
        ]),

        sectionSpacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),

        entrySpacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),
    }),

    colors: Object.freeze({
        accentMode: Object.freeze([
            "theme",
            "custom",
        ]),

        textMode: Object.freeze([
            "theme",
            "custom",
        ]),

        backgroundMode: Object.freeze([
            "white",
            "custom",
        ]),
    }),

    header: Object.freeze({
        alignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),

        layout: Object.freeze([
            "standard",
            "compact",
            "split",
        ]),
    }),

    footer: Object.freeze({
        visibility: Object.freeze([
            "hidden",
            "visible",
        ]),

        alignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),
    }),

    photo: Object.freeze({
        visibility: Object.freeze([
            "hidden",
            "visible",
        ]),

        shape: Object.freeze([
            "square",
            "rounded",
            "circle",
        ]),

        position: Object.freeze([
            "left",
            "center",
            "right",
        ]),

        size: Object.freeze([
            "small",
            "medium",
            "large",
        ]),

        fit: Object.freeze([
            "cover",
            "contain",
        ]),
    }),

    links: Object.freeze({
        style: Object.freeze([
            "plain",
            "underline",
            "accent",
        ]),

        target: Object.freeze([
            "same-tab",
            "new-tab",
        ]),
    }),

    document: Object.freeze({
        language: Object.freeze([
            "en",
            "es",
            "fr",
            "de",
            "it",
            "pt",
        ]),

        dateFormat: Object.freeze([
            "MM/YYYY",
            "MMMM YYYY",
            "DD/MM/YYYY",
            "MM/DD/YYYY",
            "YYYY-MM-DD",
        ]),

        pageFormat: Object.freeze([
            "A4",
            "Letter",
            "Legal",
        ]),
    }),
});

// ============================================================
// Common Section Customization
// ============================================================
//
// These options can be used by multiple resume sections.
// ============================================================

const COMMON_SECTION_CUSTOMIZATION =
    Object.freeze({
        visibility: Object.freeze([
            "visible",
            "hidden",
        ]),

        alignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),

        headingStyle: Object.freeze([
            "standard",
            "bold",
            "uppercase",
            "accent",
            "minimal",
        ]),

        headingSize: Object.freeze([
            "small",
            "normal",
            "large",
        ]),

        spacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),

        divider: Object.freeze([
            "none",
            "line",
            "accent",
        ]),
    });

// ============================================================
// Skills Customization
// ============================================================
//
// Based on the Skills design requirements:
// - Grid
// - Rows
// - Compact
// - Bubble
// - Level
// - row spacing
// - bullets
// - sub-information separator
// ============================================================

const SKILLS_CUSTOMIZATION =
    Object.freeze({
        layout: Object.freeze([
            "grid",
            "rows",
            "compact",
            "bubble",
            "level",
        ]),

        rowSpacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),

        startRowsWithBullets:
            Object.freeze([
                "true",
                "false",
            ]),

        subinfoStyle: Object.freeze([
            "colon",
            "dash",
            "bracket",
            "none",
        ]),

        skillAlignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),
    });

// ============================================================
// Experience Customization
// ============================================================

const EXPERIENCE_CUSTOMIZATION =
    Object.freeze({
        layout: Object.freeze([
            "standard",
            "compact",
            "timeline",
        ]),

        datePosition: Object.freeze([
            "right",
            "left",
            "below-title",
            "inline",
        ]),

        locationPosition: Object.freeze([
            "inline",
            "below-title",
            "below-company",
        ]),

        descriptionStyle: Object.freeze([
            "bullets",
            "paragraph",
        ]),

        bulletStyle: Object.freeze([
            "none",
            "disc",
            "circle",
            "square",
            "dash",
        ]),

        bulletIndentation: Object.freeze([
            "compact",
            "normal",
            "spacious",
        ]),

        entrySpacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),
    });

// ============================================================
// Education Customization
// ============================================================

const EDUCATION_CUSTOMIZATION =
    Object.freeze({
        layout: Object.freeze([
            "standard",
            "compact",
            "timeline",
        ]),

        datePosition: Object.freeze([
            "right",
            "left",
            "below-title",
            "inline",
        ]),

        institutionStyle: Object.freeze([
            "normal",
            "bold",
            "accent",
        ]),

        degreeStyle: Object.freeze([
            "normal",
            "bold",
            "italic",
        ]),

        fieldStyle: Object.freeze([
            "normal",
            "italic",
        ]),

        entrySpacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),
    });

// ============================================================
// Projects Customization
// ============================================================

const PROJECTS_CUSTOMIZATION =
    Object.freeze({
        layout: Object.freeze([
            "standard",
            "compact",
            "grid",
        ]),

        datePosition: Object.freeze([
            "right",
            "left",
            "below-title",
            "hidden",
        ]),

        technologyStyle: Object.freeze([
            "plain",
            "comma",
            "bullet",
            "bubble",
        ]),

        descriptionStyle: Object.freeze([
            "bullets",
            "paragraph",
        ]),

        linkStyle: Object.freeze([
            "plain",
            "accent",
            "underline",
        ]),

        entrySpacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),
    });

// ============================================================
// Summary Customization
// ============================================================

const SUMMARY_CUSTOMIZATION =
    Object.freeze({
        alignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),

        textStyle: Object.freeze([
            "normal",
            "compact",
            "large",
        ]),

        paragraphSpacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),
    });

// ============================================================
// Generic List Customization
// ============================================================
//
// Used by sections such as:
// - Certificates
// - Courses
// - Awards
// - Organisations
// - Publications
// - Interests
// - Languages
// - References
// ============================================================

const LIST_SECTION_CUSTOMIZATION =
    Object.freeze({
        layout: Object.freeze([
            "list",
            "grid",
            "compact",
        ]),

        itemStyle: Object.freeze([
            "plain",
            "bullet",
            "numbered",
        ]),

        bulletStyle: Object.freeze([
            "disc",
            "circle",
            "square",
            "dash",
        ]),

        spacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),
    });

// ============================================================
// Custom Section Customization
// ============================================================
//
// Custom sections must remain flexible, but the available
// presentation options are still explicitly controlled.
// ============================================================

const CUSTOM_SECTION_CUSTOMIZATION =
    Object.freeze({
        layout: Object.freeze([
            "standard",
            "list",
            "grid",
            "compact",
        ]),

        itemStyle: Object.freeze([
            "plain",
            "bullet",
            "numbered",
        ]),

        alignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),

        spacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),

        bulletStyle: Object.freeze([
            "none",
            "disc",
            "circle",
            "square",
            "dash",
        ]),
    });

// ============================================================
// Entry Customization
// ============================================================
//
// Common controls available to individual entries.
// ============================================================

const ENTRY_CUSTOMIZATION =
    Object.freeze({
        visibility: Object.freeze([
            "visible",
            "hidden",
        ]),

        alignment: Object.freeze([
            "left",
            "center",
            "right",
        ]),

        emphasis: Object.freeze([
            "normal",
            "subtle",
            "strong",
        ]),

        spacing: Object.freeze([
            "tight",
            "normal",
            "spacious",
        ]),

        titleStyle: Object.freeze([
            "normal",
            "bold",
            "uppercase",
            "accent",
        ]),

        subtitleStyle: Object.freeze([
            "normal",
            "bold",
            "italic",
            "accent",
        ]),

        dateStyle: Object.freeze([
            "normal",
            "bold",
            "subtle",
            "accent",
        ]),
    });

// ============================================================
// Section Customization Registry
// ============================================================
//
// This provides a single source of truth for which
// customization options belong to which section type.
//
// The frontend can use this registry to build the appropriate
// customization UI.
//
// The backend validator can use it to reject unsupported
// customization keys.
// ============================================================

const SECTION_CUSTOMIZATION =
    Object.freeze({
        summary:
            SUMMARY_CUSTOMIZATION,

        skills:
            SKILLS_CUSTOMIZATION,

        experience:
            EXPERIENCE_CUSTOMIZATION,

        education:
            EDUCATION_CUSTOMIZATION,

        projects:
            PROJECTS_CUSTOMIZATION,

        certificates:
            LIST_SECTION_CUSTOMIZATION,

        languages:
            LIST_SECTION_CUSTOMIZATION,

        interests:
            LIST_SECTION_CUSTOMIZATION,

        courses:
            LIST_SECTION_CUSTOMIZATION,

        awards:
            LIST_SECTION_CUSTOMIZATION,

        organisations:
            LIST_SECTION_CUSTOMIZATION,

        publications:
            LIST_SECTION_CUSTOMIZATION,

        references:
            LIST_SECTION_CUSTOMIZATION,

        declaration:
            LIST_SECTION_CUSTOMIZATION,

        custom:
            CUSTOM_SECTION_CUSTOMIZATION,
    });

// ============================================================
// Complete Customization Definition
// ============================================================

const resumeCustomization =
    Object.freeze({
        global:
            GLOBAL_CUSTOMIZATION,

        commonSection:
            COMMON_SECTION_CUSTOMIZATION,

        section:
            SECTION_CUSTOMIZATION,

        entry:
            ENTRY_CUSTOMIZATION,
    });

// ============================================================
// Export
// ============================================================

export default resumeCustomization;