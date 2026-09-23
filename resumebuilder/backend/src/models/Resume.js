import mongoose from "mongoose";

import resumeSections from "./constants/resumeSections.js";
import resumeCustomization from "./constants/resumeCustomization.js";
import resumeDefaults from "./constants/resumeDefaults.js";
import limits from "./constants/limits.js";

// ============================================================
// CuratoCV Resume Model
// ============================================================
//
// Persistent architecture:
//
// Resume
// ├── userId
// ├── title
// ├── public
// ├── personalInfo
// ├── design
// └── sections[]
//      ├── type
//      ├── title
//      ├── order
//      ├── visible
//      ├── customization
//      └── entries[]
//           ├── order
//           ├── visible
//           ├── customization
//           └── data
//
// Responsibilities:
// - MongoDB persistence
// - Structural validation
// - Basic type constraints
// - Database-level safety boundaries
// - Timestamps
//
// NOT responsible for:
// - HTTP validation
// - Authentication
// - Authorization
// - Business workflows
// - AI
// - File processing
// - Frontend rendering
//
// Those responsibilities belong to Validators, Services,
// Controllers, and other appropriate layers.
// ============================================================

// ============================================================
// Reusable Schema Options
// ============================================================

const embeddedSchemaOptions = {
    _id: true,
    id: false,
    minimize: false,
};

// ============================================================
// Personal Information
// ============================================================

const personalInfoSchema =
    new mongoose.Schema(
        {
            fullName: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .fullName,
                trim: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .fullName
                        .maxLength,
            },

            profession: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .profession,
                trim: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .profession
                        .maxLength,
            },

            email: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .email,
                trim: true,
                lowercase: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .email
                        .maxLength,
            },

            phone: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .phone,
                trim: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .phone
                        .maxLength,
            },

            location: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .location,
                trim: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .location
                        .maxLength,
            },

            website: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .website,
                trim: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .website
                        .maxLength,
            },

            linkedin: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .linkedin,
                trim: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .linkedin
                        .maxLength,
            },

            github: {
                type: String,
                default:
                    resumeDefaults
                        .personalInfo
                        .github,
                trim: true,
                maxlength:
                    limits.resume
                        .personalInfo
                        .github
                        .maxLength,
            },

            photoBg: { type: Boolean, default: false },
            photo: {
                type: mongoose.Schema.Types.Mixed,
                default:
                    resumeDefaults
                        .personalInfo
                        .photo,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Document Settings
// ============================================================

const documentSchema =
    new mongoose.Schema(
        {
            language: {
                type: String,
                default: "en",
                enum:
                    resumeCustomization
                        .global
                        .document
                        .language,
            },

            dateFormat: {
                type: String,
                default: "MM/YYYY",
                enum:
                    resumeCustomization
                        .global
                        .document
                        .dateFormat,
            },

            pageFormat: {
                type: String,
                default: "A4",
                enum:
                    resumeCustomization
                        .global
                        .document
                        .pageFormat,
            },
        },
        embeddedSchemaOptions
    );

// ============================================================
// Colors
// ============================================================
//
// CuratoCV keeps semantic colors rather than forcing every
// interface element to use the same brand color.
//
// The primary brand accent remains:
//
//     #17375F
//
// Additional coordinated shades can be handled by the frontend
// theme system.
// ============================================================

const colorsSchema =
    new mongoose.Schema(
        {
            accent: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .colors
                        .accent,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .colorValue
                        .maxLength,
            },

            text: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .colors
                        .text,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .colorValue
                        .maxLength,
            },

            heading: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .colors
                        .heading,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .colorValue
                        .maxLength,
            },

            muted: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .colors
                        .muted,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .colorValue
                        .maxLength,
            },

            background: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .colors
                        .background,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .colorValue
                        .maxLength,
            },

            border: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .colors
                        .border,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .colorValue
                        .maxLength,
            },

            accentMode: {
                type: String,
                default: "theme",
                enum:
                    resumeCustomization
                        .global
                        .colors
                        .accentMode,
            },

            textMode: {
                type: String,
                default: "theme",
                enum:
                    resumeCustomization
                        .global
                        .colors
                        .textMode,
            },

            backgroundMode: {
                type: String,
                default: "white",
                enum:
                    resumeCustomization
                        .global
                        .colors
                        .backgroundMode,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Typography
// ============================================================

const typographySchema =
    new mongoose.Schema(
        {
            fontFamily: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .typography
                        .fontFamily,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .fontFamily
                        .maxLength,
            },

            fontSizeScale: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .typography
                        .fontSizeScale,
                enum:
                    resumeCustomization
                        .global
                        .typography
                        .fontSizeScale,
            },

            headingScale: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .typography
                        .headingScale,
                enum:
                    resumeCustomization
                        .global
                        .typography
                        .headingScale,
            },

            lineHeight: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .typography
                        .lineHeight,
                enum:
                    resumeCustomization
                        .global
                        .typography
                        .lineHeight,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Spacing
// ============================================================

const spacingSchema =
    new mongoose.Schema(
        {
            density: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .spacing
                        .density,
                enum:
                    resumeCustomization
                        .global
                        .spacing
                        .density,
            },

            sectionSpacing: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .spacing
                        .sectionSpacing,
                enum:
                    resumeCustomization
                        .global
                        .spacing
                        .sectionSpacing,
            },

            entrySpacing: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .spacing
                        .entrySpacing,
                enum:
                    resumeCustomization
                        .global
                        .spacing
                        .entrySpacing,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Layout
// ============================================================

const layoutSchema =
    new mongoose.Schema(
        {
            pageWidth: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .layout
                        .pageWidth,
                enum:
                    resumeCustomization
                        .global
                        .layout
                        .pageWidth,
            },

            columns: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .layout
                        .columns,
                enum:
                    resumeCustomization
                        .global
                        .layout
                        .columns,
            },

            columnRatio: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .layout
                        .columnRatio,
                enum:
                    resumeCustomization
                        .global
                        .layout
                        .columnRatio,
            },

            pageAlignment: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .layout
                        .pageAlignment,
                enum:
                    resumeCustomization
                        .global
                        .layout
                        .pageAlignment,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Header
// ============================================================

const headerSchema =
    new mongoose.Schema(
        {
            alignment: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .header
                        .alignment,
                enum:
                    resumeCustomization
                        .global
                        .header
                        .alignment,
            },

            layout: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .header
                        .layout,
                enum:
                    resumeCustomization
                        .global
                        .header
                        .layout,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Footer
// ============================================================

const footerSchema =
    new mongoose.Schema(
        {
            visibility: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .footer
                        .visibility,
                enum:
                    resumeCustomization
                        .global
                        .footer
                        .visibility,
            },

            alignment: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .footer
                        .alignment,
                enum:
                    resumeCustomization
                        .global
                        .footer
                        .alignment,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Photo
// ============================================================

const photoSchema =
    new mongoose.Schema(
        {
            visibility: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .photo
                        .visibility,
                enum:
                    resumeCustomization
                        .global
                        .photo
                        .visibility,
            },

            shape: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .photo
                        .shape,
                enum:
                    resumeCustomization
                        .global
                        .photo
                        .shape,
            },

            position: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .photo
                        .position,
                enum:
                    resumeCustomization
                        .global
                        .photo
                        .position,
            },

            size: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .photo
                        .size,
                enum:
                    resumeCustomization
                        .global
                        .photo
                        .size,
            },

            fit: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .photo
                        .fit,
                enum:
                    resumeCustomization
                        .global
                        .photo
                        .fit,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Links
// ============================================================

const linksSchema =
    new mongoose.Schema(
        {
            style: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .links
                        .style,
                enum:
                    resumeCustomization
                        .global
                        .links
                        .style,
            },

            target: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .links
                        .target,
                enum:
                    resumeCustomization
                        .global
                        .links
                        .target,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Complete Design
// ============================================================

const designSchema =
    new mongoose.Schema(
        {
            template: {
                type: String,
                default:
                    resumeDefaults
                        .design
                        .template,
                trim: true,
                maxlength:
                    limits.resume
                        .design
                        .templateName
                        .maxLength,
            },

            colors: {
                type:
                    colorsSchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .colors,

                    accentMode:
                        "theme",

                    textMode:
                        "theme",

                    backgroundMode:
                        "white",
                }),
            },

            typography: {
                type:
                    typographySchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .typography,
                }),
            },

            spacing: {
                type:
                    spacingSchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .spacing,
                }),
            },

            layout: {
                type:
                    layoutSchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .layout,
                }),
            },

            header: {
                type:
                    headerSchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .header,
                }),
            },

            footer: {
                type:
                    footerSchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .footer,
                }),
            },

            photo: {
                type:
                    photoSchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .photo,
                }),
            },

            links: {
                type:
                    linksSchema,

                default: () => ({
                    ...resumeDefaults
                        .design
                        .links,
                }),
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Section Customization
// ============================================================

const sectionCustomizationSchema =
    new mongoose.Schema(
        {
            visibility: {
                type: String,

                default:
                    resumeDefaults
                        .sectionCustomization
                        .visibility,

                enum:
                    resumeCustomization
                        .commonSection
                        .visibility,
            },

            alignment: {
                type: String,

                default:
                    resumeDefaults
                        .sectionCustomization
                        .alignment,

                enum:
                    resumeCustomization
                        .commonSection
                        .alignment,
            },

            headingStyle: {
                type: String,

                default:
                    resumeDefaults
                        .sectionCustomization
                        .headingStyle,

                enum:
                    resumeCustomization
                        .commonSection
                        .headingStyle,
            },

            headingSize: {
                type: String,

                default:
                    resumeDefaults
                        .sectionCustomization
                        .headingSize,

                enum:
                    resumeCustomization
                        .commonSection
                        .headingSize,
            },

            spacing: {
                type: String,

                default:
                    resumeDefaults
                        .sectionCustomization
                        .spacing,

                enum:
                    resumeCustomization
                        .commonSection
                        .spacing,
            },

            divider: {
                type: String,

                default:
                    resumeDefaults
                        .sectionCustomization
                        .divider,

                enum:
                    resumeCustomization
                        .commonSection
                        .divider,
            },

            /*
             * Section-specific customization is intentionally
             * flexible because different sections require
             * different controls.
             *
             * Example:
             *
             * skills:
             * {
             *     layout: "grid",
             *     skillAlignment: "left"
             * }
             */
            sectionSpecific: {
                type:
                    mongoose.Schema.Types
                        .Mixed,

                default: () => ({}),
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Entry Customization
// ============================================================

const entryCustomizationSchema =
    new mongoose.Schema(
        {
            visibility: {
                type: String,

                default:
                    resumeDefaults
                        .entryCustomization
                        .visibility,

                enum:
                    resumeCustomization
                        .entry
                        .visibility,
            },

            alignment: {
                type: String,

                default:
                    resumeDefaults
                        .entryCustomization
                        .alignment,

                enum:
                    resumeCustomization
                        .entry
                        .alignment,
            },

            emphasis: {
                type: String,

                default:
                    resumeDefaults
                        .entryCustomization
                        .emphasis,

                enum:
                    resumeCustomization
                        .entry
                        .emphasis,
            },

            spacing: {
                type: String,

                default:
                    resumeDefaults
                        .entryCustomization
                        .spacing,

                enum:
                    resumeCustomization
                        .entry
                        .spacing,
            },

            titleStyle: {
                type: String,

                default:
                    resumeDefaults
                        .entryCustomization
                        .titleStyle,

                enum:
                    resumeCustomization
                        .entry
                        .titleStyle,
            },

            subtitleStyle: {
                type: String,

                default:
                    resumeDefaults
                        .entryCustomization
                        .subtitleStyle,

                enum:
                    resumeCustomization
                        .entry
                        .subtitleStyle,
            },

            dateStyle: {
                type: String,

                default:
                    resumeDefaults
                        .entryCustomization
                        .dateStyle,

                enum:
                    resumeCustomization
                        .entry
                        .dateStyle,
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Resume Entry
// ============================================================
//
// Every entry has:
// - its own MongoDB _id
// - order
// - visibility
// - customization
// - section-specific data
//
// This allows individual entries to be customized without
// affecting the entire section.
// ============================================================

const resumeEntrySchema =
    new mongoose.Schema(
        {
            _id: {
                type: String,
                default: () => new mongoose.Types.ObjectId().toHexString(),
            },

            order: {
                type: Number,

                required: true,

                min: 0,

                max:
                    limits.resume
                        .entries
                        .maxPerSection,
            },

            visible: {
                type: Boolean,

                default: true,
            },

            customization: {
                type:
                    entryCustomizationSchema,

                default: () => ({
                    ...resumeDefaults
                        .entryCustomization,
                }),
            },

            data: {
                type:
                    mongoose.Schema.Types
                        .Mixed,

                default: () => ({}),
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Resume Section
// ============================================================

const resumeSectionSchema =
    new mongoose.Schema(
        {
            _id: {
                type: String,
                default: () => new mongoose.Types.ObjectId().toHexString(),
            },

            type: {
                type: String,

                required: true,

                enum:
                    resumeSections.all,
            },

            title: {
                type: String,

                required: true,

                trim: true,

                minlength:
                    limits.resume
                        .sections
                        .title
                        .minLength,

                maxlength:
                    limits.resume
                        .sections
                        .title
                        .maxLength,
            },

            order: {
                type: Number,

                required: true,

                min: 0,

                max:
                    limits.resume
                        .sections
                        .maxCount,
            },

            visible: {
                type: Boolean,

                default: true,
            },

            customization: {
                type:
                    sectionCustomizationSchema,

                default: () => ({
                    ...resumeDefaults
                        .sectionCustomization,
                }),
            },

            entries: {
                type: [
                    resumeEntrySchema,
                ],

                default: [],
            },
        },

        embeddedSchemaOptions
    );

// ============================================================
// Resume Schema
// ============================================================

const resumeSchema =
    new mongoose.Schema(
        {
            // ------------------------------------------------
            // Owner
            // ------------------------------------------------

            userId: {
                type:
                    mongoose.Schema.Types
                        .ObjectId,

                ref: "User",

                required: true,

                index: true,
            },

            // ------------------------------------------------
            // Resume Title
            // ------------------------------------------------
            //
            // IMPORTANT:
            //
            // This is the title chosen by the user.
            //
            // It will later be used by the PDF/export layer
            // when generating:
            //
            //     <resume-title>_CuratoCV.pdf
            //
            // The filename utility/service will sanitize the
            // title before creating the actual file name.
            // ------------------------------------------------

            title: {
                type: String,

                required: true,

                default:
                    resumeDefaults
                        .createDefaultResumeData()
                        .title,

                trim: true,

                minlength:
                    limits.resume
                        .title
                        .minLength,

                maxlength:
                    limits.resume
                        .title
                        .maxLength,
            },

            // ------------------------------------------------
            // Public Status
            // ------------------------------------------------

            public: {
                type: Boolean,

                default:
                    resumeDefaults
                        .createDefaultResumeData()
                        .public,

                index: true,
            },

            // ------------------------------------------------
            // Personal Information
            // ------------------------------------------------

            personalInfo: {
                type:
                    personalInfoSchema,

                default: () => ({
                    ...resumeDefaults
                        .personalInfo,
                }),
            },

            // ------------------------------------------------
            // Document Settings
            // ------------------------------------------------

            document: {
                type:
                    documentSchema,

                default: () => ({
                    language: "en",
                    dateFormat: "MM/YYYY",
                    pageFormat: "A4",
                }),
            },

            // ------------------------------------------------
            // Design
            // ------------------------------------------------

            design: {
                type:
                    designSchema,

                default: () => ({
                    ...resumeDefaults
                        .createDefaultResumeData()
                        .design,
                }),
            },

            // ------------------------------------------------
            // Sections
            // ------------------------------------------------
            //
            // The service creates the initial sections from
            // resumeDefaults.createDefaultResumeData().
            //
            // The model itself does not decide which sections
            // a newly created resume should contain.
            // ------------------------------------------------

            sections: {
                type: [
                    resumeSectionSchema,
                ],

                default: [],
            },
        },

        {
            timestamps: true,

            minimize: false,

            strict: true,

            versionKey: "__v",
        }
    );

// ============================================================
// Indexes
// ============================================================

resumeSchema.index({
    userId: 1,
    updatedAt: -1,
});

resumeSchema.index({
    userId: 1,
    createdAt: -1,
});

// Title search within a user's resumes

resumeSchema.index(
    {
        title: 1,
    },
    {
        name: "resume_title",
    }
);

// ============================================================
// Structural Validation
// ============================================================

resumeSchema.pre(
    "validate",
    function (next) {
        next = typeof next === "function" ? next : (err) => { if (err) throw err; };
        if (
            !Array.isArray(
                this.sections
            )
        ) {
            return next();
        }

        // ----------------------------------------------------
        // Maximum section count
        // ----------------------------------------------------

        const maxSections =
            limits.resume
                .sections
                .maxCount;

        if (
            this.sections.length >
            maxSections
        ) {
            return next(
                new mongoose.Error.ValidationError(
                    new mongoose.Error.ValidatorError(
                        {
                            path:
                                "sections",

                            message:
                                `A resume cannot contain more than ${maxSections} sections.`,
                        }
                    )
                )
            );
        }

        // ----------------------------------------------------
        // Section order uniqueness
        // ----------------------------------------------------

        const sectionOrders =
            new Set();

        // ----------------------------------------------------
        // Total entry count
        // ----------------------------------------------------

        let totalEntries = 0;

        for (
            const section of
                this.sections
        ) {
            if (
                sectionOrders.has(
                    section.order
                )
            ) {
                return next(
                    new mongoose.Error.ValidationError(
                        new mongoose.Error.ValidatorError(
                            {
                                path:
                                    "sections",

                                message:
                                    "Resume section order values must be unique.",
                            }
                        )
                    )
                );
            }

            sectionOrders.add(
                section.order
            );

            const entries =
                Array.isArray(
                    section.entries
                )
                    ? section.entries
                    : [];

            // ------------------------------------------------
            // Maximum entries per section
            // ------------------------------------------------

            const maxEntries =
                limits.resume
                    .entries
                    .maxPerSection;

            if (
                entries.length >
                maxEntries
            ) {
                return next(
                    new mongoose.Error.ValidationError(
                        new mongoose.Error.ValidatorError(
                            {
                                path:
                                    "sections",

                                message:
                                    `A section cannot contain more than ${maxEntries} entries.`,
                            }
                        )
                    )
                );
            }

            totalEntries +=
                entries.length;

            // ------------------------------------------------
            // Entry order uniqueness
            // ------------------------------------------------

            const entryOrders =
                new Set();

            for (
                const entry of
                    entries
            ) {
                if (
                    entryOrders.has(
                        entry.order
                    )
                ) {
                    return next(
                        new mongoose.Error.ValidationError(
                            new mongoose.Error.ValidatorError(
                                {
                                    path:
                                        "sections",

                                    message:
                                        "Resume entry order values must be unique within each section.",
                                }
                            )
                        )
                    );
                }

                entryOrders.add(
                    entry.order
                );
            }
        }

        // ----------------------------------------------------
        // Maximum total entries
        // ----------------------------------------------------

        if (
            totalEntries >
            limits.derived
                .maxTotalEntries
        ) {
            return next(
                new mongoose.Error.ValidationError(
                    new mongoose.Error.ValidatorError(
                        {
                            path:
                                "sections",

                            message:
                                `A resume cannot contain more than ${limits.derived.maxTotalEntries} total entries.`,
                        }
                    )
                )
            );
        }

        return next();
    }
);

// ============================================================
// Model
// ============================================================

const Resume =
    mongoose.models.Resume ||
    mongoose.model(
        "Resume",
        resumeSchema
    );

export default Resume;