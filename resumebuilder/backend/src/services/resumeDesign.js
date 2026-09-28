/**
 * Developer context for resumebuilder/backend/src/services/resumeDesign.js.
 *
 * Purpose: provide the ONE server-side definition of the effective resume
 * design values (typography, spacing, colors, layout, header, footer, photo,
 * links) and of canonical section normalization (order, visibility, titles,
 * entries) that the PDF renderer consumes.
 *
 * Why here: the Resume Preview is the reference implementation of these rules.
 * Its resolvers live in resumebuilder/frontend/src/utils/* and its effective
 * value math lives in resumebuilder/frontend/src/components/ResumePreview.jsx.
 * The server workspace may not import that frontend source package (AGENTS.md
 * dependency rules: product packages are not shared packages, and deep imports
 * across workspaces are forbidden), so this module mirrors the preview rules
 * exactly. tests/unit/backend/services/resumeDesignParity.test.js imports the
 * real preview resolvers and normalizePreviewData and fails if this mirror ever
 * drifts, which keeps a single effective source of truth behind a tested
 * contract instead of two free-running implementations.
 *
 * The preview's CSS variable math is reproduced here verbatim:
 *   typeScale        = { small: 0.88, normal: 1, large: 1.12 }[fontSizeScale] || 1
 *   headingScale     = { small: 0.9,  normal: 1, large: 1.15 }[headingScale] || 1
 *   lineHeightBase   = { tight: 1.3, normal: 1.5, relaxed: 1.7 }[lineHeight] || 1.5
 *   lineHeight       = (Number(spacing.lineHeightMultiplier) || lineHeightBase)
 *                      * ({ tight: 0.9, normal: 1, relaxed: 1.08 }[lineHeight] || 1)
 *   pageMarginMm     = clamp(5, 20, Number(spacing.pageMarginMm) || 10)
 *   sectionSpacingMm = clamp(0, 15, (Number(spacing.sectionSpacingMm ?? 3))
 *                      + { tight: -1.5, normal: 0, spacious: 3 }[sectionSpacing])
 */

import resumeDefaults from "../constants/resumeDefaults.js";

// ============================================================
// Vocabulary mirrors (frontend/src/utils/typography.js)
// ============================================================

export const VALID_FONT_FAMILIES = Object.freeze([
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
]);

export const VALID_FONT_SIZES = Object.freeze(["small", "normal", "large"]);
export const VALID_HEADING_SCALES = Object.freeze(["small", "normal", "large"]);
export const VALID_LINE_HEIGHTS = Object.freeze(["tight", "normal", "relaxed"]);

/** CSS font-family strings — identical to the preview's FONT_FAMILY_MAP. */
export const FONT_FAMILY_MAP = Object.freeze({
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    inter: "'Inter', system-ui, sans-serif",
    roboto: "'Roboto', system-ui, sans-serif",
    "open-sans": "'Open Sans', system-ui, sans-serif",
    lato: "'Lato', system-ui, sans-serif",
    montserrat: "'Montserrat', system-ui, sans-serif",
    poppins: "'Poppins', system-ui, sans-serif",
    merriweather: "'Merriweather', Georgia, serif",
    "source-sans-3": "'Source Sans 3', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
});

/** ResumePreview.jsx previewStyle multipliers. */
export const TYPE_SCALE = Object.freeze({ small: 0.88, normal: 1, large: 1.12 });
export const HEADING_SCALE = Object.freeze({ small: 0.9, normal: 1, large: 1.15 });
export const LINE_HEIGHT_BASE = Object.freeze({ tight: 1.3, normal: 1.5, relaxed: 1.7 });
export const LINE_HEIGHT_FACTOR = Object.freeze({ tight: 0.9, normal: 1, relaxed: 1.08 });

// ============================================================
// Spacing mirrors (frontend/src/utils/layoutSpacing.js class values)
// ============================================================

/** ResumePreview section spacing offset added to sectionSpacingMm (mm). */
export const SECTION_SPACING_OFFSET_MM = Object.freeze({ tight: -1.5, normal: 0, spacious: 3 });

/** SECTION_SPACING_MAP: mb-3 / mb-6 / mb-10 (px). */
export const SECTION_SPACING_PX = Object.freeze({ tight: 12, normal: 24, spacious: 40 });

/** ENTRY_SPACING_MAP: space-y-2 / space-y-4 / space-y-6 (px). */
export const ENTRY_SPACING_PX = Object.freeze({ tight: 8, normal: 16, spacious: 24 });

/** sectionCustomization ENTRY_SPACING_MAP: mb-2 / mb-4 / mb-6 (px). */
export const ENTRY_MARGIN_PX = Object.freeze({ tight: 8, normal: 16, spacious: 24 });

/** DENSITY_MAP: p-4 / p-8 / p-12 (px). */
export const DENSITY_PADDING_PX = Object.freeze({ compact: 16, normal: 32, spacious: 48 });

/** ResumePreview `--resume-content-width` per page width. */
export const CONTENT_WIDTH = Object.freeze({
    compact: "650px",
    standard: "100%",
    wide: "100%",
});

export const VALID_DENSITIES = Object.freeze(["compact", "normal", "spacious"]);
export const VALID_SECTION_SPACINGS = Object.freeze(["tight", "normal", "spacious"]);
export const VALID_ENTRY_SPACINGS = Object.freeze(["tight", "normal", "spacious"]);
export const VALID_PAGE_WIDTHS = Object.freeze(["compact", "standard", "wide"]);
export const VALID_PAGE_ALIGNMENTS = Object.freeze(["left", "center", "right"]);
export const VALID_COLUMNS = Object.freeze(["single", "two"]);
export const VALID_COLUMN_RATIOS = Object.freeze(["50-50", "60-40", "40-60", "65-35", "35-65"]);

// ============================================================
// Section vocabulary mirrors (constants/resumeSections.js + registry)
// ============================================================

export const SECTION_TYPE_ALIASES = Object.freeze({
    professional_summary: "summary",
    experiences: "experience",
    educations: "education",
    project: "projects",
});

/** Fallback titles used by getSectionTitle() in TemplateSections.jsx. */
export const SECTION_FALLBACK_TITLES = Object.freeze({
    summary: "Professional Summary",
    experience: "Professional Experience",
    projects: "Projects",
    education: "Education",
    skills: "Skills",
    certificates: "Certificates",
    courses: "Courses",
    awards: "Awards & Achievements",
    languages: "Languages",
    interests: "Interests",
    organisations: "Organisations",
    publications: "Publications",
    references: "References",
    declaration: "Declaration",
    custom: "Custom Section",
});

/** Title lookup type lists used by getSectionTitle() per renderer. */
export const SECTION_TITLE_TYPES = Object.freeze({
    summary: ["summary", "professional_summary"],
    experience: ["experience", "experiences"],
    projects: ["projects", "project"],
    education: ["education", "educations"],
    skills: ["skills"],
    certificates: ["certificates"],
    courses: ["courses"],
    awards: ["awards"],
    languages: ["languages"],
    interests: ["interests"],
    organisations: ["organisations"],
    publications: ["publications"],
    references: ["references"],
    declaration: ["declaration"],
    custom: ["custom"],
});

/**
 * Sections that ResumePreview.jsx renders as `supplementalSections` after the
 * Modern / Minimal / Minimal-Image template body (classic renders everything
 * itself, in saved order).
 */
export const SUPPLEMENTAL_SECTION_TYPES = Object.freeze([
    "certificates",
    "courses",
    "awards",
    "languages",
    "interests",
    "organisations",
    "publications",
    "references",
    "declaration",
    "custom",
]);

/** Section types rendered inline by the Modern / Minimal / Minimal-Image templates. */
export const CORE_SECTION_TYPES = Object.freeze([
    "summary",
    "experience",
    "projects",
    "education",
    "skills",
]);

// ============================================================
// Design resolution
// ============================================================

const defaults = resumeDefaults;

const enumOf = (value, valid, fallback) => (valid.includes(value) ? value : fallback);

/**
 * Resolve a stored design object into the effective values used at render
 * time. Mirrors resolveColors / resolveHeader / resolvePhoto / resolveLinks /
 * resolveFooter (spread of defaults) and ResumePreview's previewStyle math.
 */
export const resolveResumeDesign = (design = {}) => {
    const source = design || {};
    const typographySource = source.typography || {};
    const spacingSource = source.spacing || {};
    const layoutSource = source.layout || {};

    const colors = { ...defaults.design.colors, ...(source.colors || {}) };

    const fontFamilyKey = enumOf(typographySource.fontFamily, VALID_FONT_FAMILIES, defaults.design.typography.fontFamily);
    const fontSizeScale = enumOf(typographySource.fontSizeScale, VALID_FONT_SIZES, defaults.design.typography.fontSizeScale);
    const headingScaleKey = enumOf(typographySource.headingScale, VALID_HEADING_SCALES, defaults.design.typography.headingScale);
    const lineHeightKey = enumOf(typographySource.lineHeight, VALID_LINE_HEIGHTS, defaults.design.typography.lineHeight);

    const typeScale = TYPE_SCALE[fontSizeScale] || 1;
    const headingScale = HEADING_SCALE[headingScaleKey] || 1;
    const lineHeightBase = LINE_HEIGHT_BASE[lineHeightKey] || 1.5;
    const lineHeight = (Number(spacingSource.lineHeightMultiplier) || lineHeightBase) *
        (LINE_HEIGHT_FACTOR[lineHeightKey] || 1);

    const bodyPt = typographySource.fontSizePt ?? defaults.design.typography.fontSizePt;
    const namePt = typographySource.nameSizePt ?? defaults.design.typography.nameSizePt;
    const sectionPt = typographySource.sectionHeadingSizePt ?? defaults.design.typography.sectionHeadingSizePt;
    const entryPt = typographySource.entryHeadingSizePt ?? defaults.design.typography.entryHeadingSizePt;

    const density = enumOf(spacingSource.density, VALID_DENSITIES, defaults.design.spacing.density);
    const sectionSpacing = enumOf(spacingSource.sectionSpacing, VALID_SECTION_SPACINGS, defaults.design.spacing.sectionSpacing);
    const entrySpacing = enumOf(spacingSource.entrySpacing, VALID_ENTRY_SPACINGS, defaults.design.spacing.entrySpacing);

    const pageMarginMm = Math.max(5, Math.min(20, Number(spacingSource.pageMarginMm) || defaults.design.spacing.pageMarginMm));
    const sectionSpacingMm = Math.max(0, Math.min(15,
        (Number(spacingSource.sectionSpacingMm ?? defaults.design.spacing.sectionSpacingMm)) +
        (SECTION_SPACING_OFFSET_MM[sectionSpacing] || 0)
    ));

    const pageWidth = enumOf(layoutSource.pageWidth, VALID_PAGE_WIDTHS, defaults.design.layout.pageWidth);
    const pageAlignment = enumOf(layoutSource.pageAlignment, VALID_PAGE_ALIGNMENTS, defaults.design.layout.pageAlignment);
    const columns = enumOf(layoutSource.columns, VALID_COLUMNS, defaults.design.layout.columns);
    const columnRatio = enumOf(layoutSource.columnRatio, VALID_COLUMN_RATIOS, defaults.design.layout.columnRatio);

    const template = getTemplateName(source);

    // ResumePreview previewStyle — the CSS custom properties every effective
    // type size in the preview derives from. Values come from the RAW stored
    // design (the preview does not validate them before emitting the vars).
    const cssVars = {
        "--resume-font-family": FONT_FAMILY_MAP[typographySource.fontFamily] || FONT_FAMILY_MAP.system,
        "--resume-type-scale": typeScale,
        "--resume-heading-scale": headingScale,
        "--resume-body-size": `${typographySource.fontSizePt ?? 10.5}pt`,
        "--resume-name-size": `${typographySource.nameSizePt ?? 22}pt`,
        "--resume-section-size": `${typographySource.sectionHeadingSizePt ?? 13.5}pt`,
        "--resume-entry-size": `${typographySource.entryHeadingSizePt ?? 11.5}pt`,
        "--resume-line-height": lineHeight,
        "--resume-section-space": `${sectionSpacingMm}mm`,
    };

    // ResumePreview previewAttributes — data attributes that key layout rules
    // (header layout, two-column classic, content width/alignment). Read from
    // raw stored values with the preview's own fallbacks, which differ from the
    // validated model defaults (pageAlignment falls back to "center").
    const attributes = {
        pageWidth: layoutSource.pageWidth || "standard",
        pageAlignment: layoutSource.pageAlignment || "center",
        columns: layoutSource.columns || "single",
        headerLayout: (source.header || {}).layout || "standard",
    };

    return {
        template,
        cssVars,
        attributes,
        colors,
        typography: {
            fontFamilyKey,
            fontFamily: FONT_FAMILY_MAP[fontFamilyKey] || FONT_FAMILY_MAP.system,
            fontSizeScale,
            headingScaleKey,
            lineHeightKey,
            typeScale,
            headingScale,
            bodyPt,
            namePt,
            sectionPt,
            entryPt,
            bodySizeCss: `${bodyPt * typeScale}pt`,
            nameSizeCss: `${namePt * headingScale}pt`,
            sectionSizeCss: `${sectionPt * headingScale}pt`,
            entrySizeCss: `${entryPt}pt`,
            lineHeight,
        },
        spacing: {
            density,
            sectionSpacing,
            entrySpacing,
            pageMarginMm,
            sectionSpacingMm,
            sectionSpacingPx: SECTION_SPACING_PX[sectionSpacing],
            entrySpacingPx: ENTRY_SPACING_PX[entrySpacing],
            densityPaddingPx: DENSITY_PADDING_PX[density],
            lineHeight,
        },
        layout: {
            pageWidth,
            pageAlignment,
            columns,
            columnRatio,
            contentWidth: CONTENT_WIDTH[pageWidth],
        },
        // Spread mirrors keep unknown-but-stored settings (and their history)
        // intact, exactly like the preview resolvers do.
        header: { ...defaults.design.header, ...(source.header || {}) },
        footer: { ...defaults.design.footer, ...(source.footer || {}) },
        photo: { ...defaults.design.photo, ...(source.photo || {}) },
        links: { ...defaults.design.links, ...(source.links || {}) },
    };
};

/**
 * Mirror of ResumePreview's template switch: exact (case-sensitive) match on
 * the raw stored value, anything else falls through to the Classic renderer.
 */
export const getTemplateName = (design = {}) => {
    const template = String(design?.template || "");
    if (template === "modern") return "modern";
    if (template === "minimal") return "minimal";
    if (template === "minimal-image") return "minimal-image";
    return "classic";
};

// ============================================================
// Section & entry customization (frontend/src/utils/sectionCustomization.js)
// ============================================================

const SECTION_FIELDS = Object.freeze({
    visibility: ["visible", "hidden"],
    alignment: ["left", "center", "right"],
    headingStyle: ["standard", "bold", "uppercase", "accent", "minimal"],
    headingSize: ["small", "normal", "large"],
    spacing: ["tight", "normal", "spacious"],
    divider: ["none", "line", "accent"],
});

const ENTRY_FIELDS = Object.freeze({
    visibility: ["visible", "hidden"],
    alignment: ["left", "center", "right"],
    emphasis: ["normal", "subtle", "strong"],
    spacing: ["tight", "normal", "spacious"],
    titleStyle: ["normal", "bold", "uppercase", "accent"],
    subtitleStyle: ["normal", "bold", "italic", "accent"],
    dateStyle: ["normal", "bold", "subtle", "accent"],
});

/** Mirrors resolveSectionCustomization() — validated enums, preview defaults. */
export const resolveSectionCustomization = (customization = {}) => {
    const source = customization || {};
    const fallbacks = defaults.sectionCustomization;
    const value = (key) => enumOf(source[key], SECTION_FIELDS[key], fallbacks[key]);
    return {
        visibility: value("visibility"),
        alignment: value("alignment"),
        headingStyle: value("headingStyle"),
        headingSize: value("headingSize"),
        spacing: value("spacing"),
        divider: value("divider"),
        sectionSpecific: source.sectionSpecific || {},
    };
};

/** Mirrors resolveEntryCustomization() — validated enums, preview defaults. */
export const resolveEntryCustomization = (customization = {}) => {
    const source = customization || {};
    const fallbacks = defaults.entryCustomization;
    const value = (key) => enumOf(source[key], ENTRY_FIELDS[key], fallbacks[key]);
    return {
        visibility: value("visibility"),
        alignment: value("alignment"),
        emphasis: value("emphasis"),
        spacing: value("spacing"),
        titleStyle: value("titleStyle"),
        subtitleStyle: value("subtitleStyle"),
        dateStyle: value("dateStyle"),
    };
};

// ============================================================
// Data normalization (mirrors normalizePreviewData in ResumePreview.jsx)
// ============================================================

const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Resolve the stored photo value (canonical { url, fileId }, legacy string or
 * legacy image/picture fields) into a URL the renderer can emit.
 * The preview additionally supports unsaved File objects; those never reach
 * the server, so their branch normalizes to "" here and to "" there too.
 */
const resolvePhotoUrl = (rawPersonalInfo) => {
    const photoValue = rawPersonalInfo.photo;
    let photoUrl = "";
    if (typeof photoValue === "string" && photoValue.trim()) photoUrl = photoValue;
    else if (isPlainObject(photoValue)) photoUrl = photoValue.url || "";

    const legacyImageUrl =
        (typeof rawPersonalInfo.image === "string" && rawPersonalInfo.image.trim()
            ? rawPersonalInfo.image
            : rawPersonalInfo.picture) || "";

    return photoUrl || legacyImageUrl || "";
};

const canonicalType = (rawType) => SECTION_TYPE_ALIASES[rawType] || rawType;

/**
 * Normalize a stored resume into the shape both rendering paths consume:
 * personal info, legacy top-level content arrays (hidden sections zeroed),
 * and `sections` filtered to visible entries, sorted by saved order, with
 * canonical types, titles and per-entry customization preserved.
 */
export const normalizeResumeData = (data = {}) => {
    const rawPersonalInfo = data.personalInfo || data.personal_info || {};

    const personal_info = {
        full_name:
            rawPersonalInfo.fullName ||
            rawPersonalInfo.full_name ||
            rawPersonalInfo.name ||
            data.title ||
            "Your Name",
        email: rawPersonalInfo.email || "",
        phone: rawPersonalInfo.phone || "",
        location: rawPersonalInfo.location || "",
        profession: rawPersonalInfo.profession || "",
        linkedin: rawPersonalInfo.linkedin || "",
        website: rawPersonalInfo.website || "",
        image: resolvePhotoUrl(rawPersonalInfo),
    };

    const professional_summary = data.professional_summary || data.summary || "";
    const experience = Array.isArray(data.experience) ? data.experience : Array.isArray(data.experiences) ? data.experiences : [];
    const education = Array.isArray(data.education) ? data.education : Array.isArray(data.educations) ? data.educations : [];
    const projects = Array.isArray(data.projects)
        ? data.projects
        : Array.isArray(data.project)
            ? data.project
            : [];
    const skills = Array.isArray(data.skills) ? data.skills : [];

    const sectionsData = {};
    const orderedSections = [];
    const hiddenSectionTypes = new Set(
        (data.sections || []).filter((section) => section.visible === false).map((section) => section.type?.toLowerCase())
    );

    const processedSections = [];

    if (Array.isArray(data.sections) && data.sections.length > 0) {
        const activeSections = data.sections
            .filter((section) => section.visible !== false)
            .sort((sectionA, sectionB) => (sectionA.order || 0) - (sectionB.order || 0));

        activeSections.forEach((section) => {
            const type = canonicalType(section.type?.toLowerCase());
            orderedSections.push(type);

            const processedEntries = (section.entries || [])
                .filter((entry) => entry.visible !== false)
                .map((entry) => ({
                    data: entry.data || {},
                    customization: entry.customization || {},
                    _id: entry._id,
                }));

            processedSections.push({
                _id: section._id,
                type,
                title: section.title,
                order: section.order,
                visible: section.visible,
                customization: section.customization || {},
                entries: processedEntries,
            });

            if (type === "summary") {
                sectionsData.summary = section.entries?.[0]?.data?.description || "";
            } else if (type === "experience" || type === "work") {
                sectionsData.experience = processedEntries.map(({ data: item }) => ({
                    company: item.company || "",
                    position: item.position || item.title || item.jobTitle || "",
                    start_date: item.startDate || item.start_date || "",
                    end_date: item.endDate || item.end_date || "",
                    description: item.description || "",
                    is_current: item.isCurrent || item.currentlyWorking || false,
                    location: item.location || "",
                }));
            } else if (type === "education") {
                sectionsData.education = processedEntries.map(({ data: item }) => ({
                    institution: item.institution || item.school || "",
                    degree: item.degree || "",
                    field: item.field || item.major || "",
                    graduation_date: item.graduationDate || item.graduation_date || item.endDate || "",
                    gpa: item.gpa || "",
                }));
            } else if (type === "skills") {
                sectionsData.skills = processedEntries
                    .map(({ data: item }) => {
                        if (typeof item === "string") return item.trim();
                        const category = String(item.category || item.name || item.title || "").trim();
                        const values = Array.isArray(item.skills)
                            ? item.skills
                            : typeof item.skills === "string"
                                ? item.skills.split(",")
                                : item.skill ? [item.skill] : [];
                        const skillsText = values.map((value) => String(value).trim()).filter(Boolean).join(", ");
                        if (category && skillsText) return `${category}: ${skillsText}`;
                        return category || skillsText || String(item.description || "").trim();
                    })
                    .filter(Boolean)
                    .map((value) => String(value).trim());
            } else if (type === "projects") {
                sectionsData.projects = processedEntries.map(({ data: item }) => ({
                    name: item.name || item.title || "",
                    description: item.description || "",
                    url: item.url || item.link || "",
                    technologies: item.technologies || item.techStack || "",
                }));
            } else if (
                ["certificates", "courses", "awards", "languages", "interests", "organisations", "publications", "references", "declaration"].includes(type) ||
                type === "custom"
            ) {
                sectionsData[type] = [...(sectionsData[type] || []), ...processedEntries.map(({ data: item }) => item || {})];
            }
        });
    } else {
        // Legacy polyfill for data with no sections array.
        let orderBase = 0;
        if (professional_summary) {
            processedSections.push({ type: "summary", title: "Professional Summary", order: orderBase++, visible: true, customization: {}, entries: [{ data: { description: professional_summary } }] });
        }
        if (experience.length > 0) {
            processedSections.push({ type: "experience", title: "Experience", order: orderBase++, visible: true, customization: {}, entries: experience.map((entry) => ({ data: entry })) });
        }
        if (projects.length > 0) {
            processedSections.push({ type: "projects", title: "Projects", order: orderBase++, visible: true, customization: {}, entries: projects.map((project) => ({ data: project })) });
        }
        if (education.length > 0) {
            processedSections.push({ type: "education", title: "Education", order: orderBase++, visible: true, customization: {}, entries: education.map((entry) => ({ data: entry })) });
        }
        if (skills.length > 0) {
            processedSections.push({ type: "skills", title: "Skills", order: orderBase++, visible: true, customization: {}, entries: skills.map((skill) => ({ data: skill })) });
        }
    }

    const content = {
        ...data,
        personal_info,
        personalInfo: personal_info,
        professional_summary: hiddenSectionTypes.has("summary") || hiddenSectionTypes.has("professional_summary") ? "" : sectionsData.summary ?? professional_summary,
        experience: hiddenSectionTypes.has("experience") || hiddenSectionTypes.has("work") ? [] : sectionsData.experience ?? experience,
        education: hiddenSectionTypes.has("education") ? [] : sectionsData.education ?? education,
        projects: hiddenSectionTypes.has("projects") ? [] : sectionsData.projects ?? projects,
        project: hiddenSectionTypes.has("projects") ? [] : sectionsData.projects ?? projects,
        skills: hiddenSectionTypes.has("skills") ? [] : sectionsData.skills ?? skills,
        sectionsData,
        orderedSections,
        sections: processedSections.length > 0 ? processedSections : data.sections || [],
        certificates: sectionsData.certificates || [],
        courses: sectionsData.courses || [],
        awards: sectionsData.awards || [],
        languages: sectionsData.languages || [],
        interests: sectionsData.interests || [],
        organisations: sectionsData.organisations || [],
        publications: sectionsData.publications || [],
        references: sectionsData.references || [],
        declaration: sectionsData.declaration || [],
        custom: sectionsData.custom || [],
    };

    return content;
};

/**
 * Find the first stored section of a given canonical type (mirrors
 * findSectionCustomization() in TemplateSections.jsx).
 */
export const findSection = (data, sectionType) =>
    (data?.sections || []).find(
        (section) => section.type?.toLowerCase() === sectionType?.toLowerCase(),
    ) || undefined;

/**
 * Section title for a renderer type (mirrors getSectionTitle()).
 */
export const getSectionTitle = (data, sectionType, fallback) => {
    const types = SECTION_TITLE_TYPES[sectionType] || [sectionType];
    const section = (data?.sections || []).find((candidate) =>
        types.includes(candidate.type?.toLowerCase()),
    );
    return section?.title?.trim() || fallback || SECTION_FALLBACK_TITLES[sectionType] || sectionType;
};

/**
 * Entry customization for a rendered entry (mirrors findEntryCustomization():
 * match by stored entry data reference first, then by index).
 */
export const findEntryCustomization = (sectionEntries, entryData, fallbackIndex) => {
    if (!Array.isArray(sectionEntries) || sectionEntries.length === 0) return {};
    if (entryData && typeof entryData === "object") {
        const match = sectionEntries.find((entry) => entry.data === entryData);
        if (match) return match.customization || {};
    }
    return sectionEntries[fallbackIndex]?.customization || {};
};

export default {
    resolveResumeDesign,
    normalizeResumeData,
    resolveSectionCustomization,
    resolveEntryCustomization,
    getTemplateName,
    getSectionTitle,
    findSection,
    findEntryCustomization,
};
