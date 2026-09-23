import resumeSections from "./resumeSections.js";

// ============================================================
// CuratoCV Resume Defaults
// ============================================================
//
// Defines the initial state of a newly created resume.
//
// IMPORTANT:
// ------------------------------------------------------------
// This file contains DEFAULT DATA only.
//
// It does NOT:
// - access MongoDB
// - create Mongoose documents
// - validate HTTP requests
// - render UI
// - contain controllers/services
// - contain user-specific data
//
// The resume service will use these defaults when creating a
// new resume and will generate unique IDs for sections/entries.
// ============================================================

// ============================================================
// Default Personal Information
// ============================================================

const DEFAULT_PERSONAL_INFO = Object.freeze({
    fullName: "",
    profession: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    photo: Object.freeze({ url: "", fileId: "" }),
});

// ============================================================
// Default Document Settings
// ============================================================

const DEFAULT_DOCUMENT = Object.freeze({
    language: "en",
    dateFormat: "MM/YYYY",
    pageFormat: "A4",
});

// ============================================================
// Default Resume Design
// ============================================================
//
// Values are semantic rather than CSS-specific.
//
// The frontend/PDF rendering layers are responsible for
// converting these values into actual visual styles.
// ============================================================

const DEFAULT_DESIGN = Object.freeze({
    template: "classic",

    colors: Object.freeze({
        heading: "#17375F",
        accent: "#0353A4",
        text: "#102A43",
        muted: "#627D98",
        border: "#90C2E7",
        background: "#FFFFFF",
    }),

    typography: Object.freeze({
        fontFamily: "system",
        fontSizeScale: "normal",
        headingScale: "normal",
        lineHeight: "normal",
    }),

    spacing: Object.freeze({
        density: "normal",
        sectionSpacing: "normal",
        entrySpacing: "normal",
    }),

    layout: Object.freeze({
        pageWidth: "standard",
        columns: "single",
        columnRatio: "50-50",
        pageAlignment: "left",
    }),

    header: Object.freeze({
        alignment: "left",
        layout: "standard",
    }),

    footer: Object.freeze({
        visibility: "hidden",
        alignment: "center",
    }),

    photo: Object.freeze({
        visibility: "hidden",
        shape: "circle",
        position: "right",
        size: "medium",
        fit: "cover",
    }),

    links: Object.freeze({
        style: "accent",
        target: "new-tab",
    }),
});

// ============================================================
// Default Section Customization
// ============================================================
//
// These values represent the baseline customization shared by
// resume sections.
//
// Section-specific customization options are defined in:
//
//     Constants/resumeCustomization.js
//
// This object only contains defaults, not validation rules.
// ============================================================

const DEFAULT_SECTION_CUSTOMIZATION =
    Object.freeze({
        visibility: "visible",
        alignment: "left",
        headingStyle: "standard",
        headingSize: "normal",
        spacing: "normal",
        divider: "none",
    });

// ============================================================
// Default Entry Customization
// ============================================================

const DEFAULT_ENTRY_CUSTOMIZATION =
    Object.freeze({
        visibility: "visible",
        alignment: "left",
        emphasis: "normal",
        spacing: "normal",
        titleStyle: "bold",
        subtitleStyle: "normal",
        dateStyle: "subtle",
    });

// ============================================================
// Default Section Factory
// ============================================================
//
// IDs are intentionally NOT generated here.
//
// The resume service will generate unique section/entry IDs
// before the document is persisted.
//
// This factory creates plain JavaScript data only.
// ============================================================

const createDefaultSection = ({
    type,
    title,
    order,
    entries = [],
    customization = {},
}) => {
    if (
        !resumeSections.isValidType(
            type
        )
    ) {
        throw new Error(
            `Invalid default resume section type: ${type}`
        );
    }

    const definition =
        resumeSections.getDefinition(
            type
        );

    return {
        type,

        title:
            title ||
            definition.defaultTitle,

        order,

        visible: true,

        customization: {
            ...DEFAULT_SECTION_CUSTOMIZATION,
            ...customization,
        },

        entries: entries.map(
            (entry, index) => ({
                ...entry,

                order:
                    entry.order ??
                    index,

                visible:
                    entry.visible ??
                    true,

                customization: {
                    ...DEFAULT_ENTRY_CUSTOMIZATION,
                    ...(entry.customization ||
                        {}),
                },
            })
        ),
    };
};

// ============================================================
// Default Sections
// ============================================================
//
// A new resume starts with the core sections defined by the
// canonical section registry.
//
// Optional sections remain available through "Add Content".
// ============================================================

const createDefaultSections = () =>
    resumeSections.defaultOrder.map(
        (type, index) =>
            createDefaultSection({
                type,

                title:
                    resumeSections
                        .getDefinition(
                            type
                        )
                        ?.defaultTitle,

                order: index,
            })
    );

// ============================================================
// Default Resume Factory
// ============================================================
//
// Creates a NEW plain JavaScript object every time it is called.
//
// It does not access MongoDB.
//
// Unique IDs should be assigned by the resume service before
// persistence.
// ============================================================

const createDefaultResumeData = () => ({
    title: "Untitled Resume",

    public: false,

    personalInfo: {
        ...DEFAULT_PERSONAL_INFO,
    },

    document: {
        ...DEFAULT_DOCUMENT,
    },

    sections:
        createDefaultSections(),

    design: {
        template:
            DEFAULT_DESIGN.template,

        colors: {
            ...DEFAULT_DESIGN.colors,
        },

        typography: {
            ...DEFAULT_DESIGN.typography,
        },

        spacing: {
            ...DEFAULT_DESIGN.spacing,
        },

        layout: {
            ...DEFAULT_DESIGN.layout,
        },

        header: {
            ...DEFAULT_DESIGN.header,
        },

        footer: {
            ...DEFAULT_DESIGN.footer,
        },

        photo: {
            ...DEFAULT_DESIGN.photo,
        },

        links: {
            ...DEFAULT_DESIGN.links,
        },
    },
});

// ============================================================
// Export
// ============================================================

const resumeDefaults = Object.freeze({
    personalInfo:
        DEFAULT_PERSONAL_INFO,

    document:
        DEFAULT_DOCUMENT,

    design:
        DEFAULT_DESIGN,

    sectionCustomization:
        DEFAULT_SECTION_CUSTOMIZATION,

    entryCustomization:
        DEFAULT_ENTRY_CUSTOMIZATION,

    createDefaultSection,

    createDefaultSections,

    createDefaultResumeData,
});

export default resumeDefaults;