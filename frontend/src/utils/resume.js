import resumeDefaults from "../constants/resumeDefaults";
import resumeSections from "../constants/resumeSections";
import {
  VALID_FONT_FAMILIES,
  VALID_FONT_SIZES,
  VALID_HEADING_SCALES,
  VALID_LINE_HEIGHTS,
  DEFAULT_TYPOGRAPHY,
} from "./typography";
import { resolveLayout, resolveSpacing } from "./layoutSpacing";
import { resolveHeader, resolveFooter, resolvePhoto, resolveLinks } from "./designSettings";

// ============================================================
// DTO Transformer & Utilities
// ============================================================
// Converts legacy flat resume objects (e.g. from older components
// or AI output) into the canonical representation used by Mongoose.
// ============================================================

export const createClientId = (prefix = "item") => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

export const normalizeEntryOrder = (entries = []) => {
  return entries.map((entry, index) => ({
    ...entry,
    order: index,
  }));
};

export const normalizeSectionOrder = (sections = []) => {
  return sections.map((section, index) => ({
    ...section,
    order: index,
  }));
};

const isValidHexColor = (val) => typeof val === "string" && /^#([0-9A-Fa-f]{3}){1,2}$/.test(val.trim());

const isPlainObject = (val) =>
  val !== null && typeof val === "object" && !Array.isArray(val);

/**
 * Normalizes personalInfo.photo into the canonical
 * { url: String, fileId: String } shape.
 *
 * Accepts:
 *   - canonical object { url, fileId }
 *   - legacy string URL
 *   - legacy aliases (.image, .picture)
 *   - null / undefined
 */
const normalizePhoto = (value) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return { url: value.trim(), fileId: "" };
  }
  if (isPlainObject(value)) {
    const url = typeof value.url === "string" ? value.url.trim() : "";
    const fileId = typeof value.fileId === "string" ? value.fileId.trim() : "";
    return { url, fileId };
  }
  return { url: "", fileId: "" };
};

const mergeDesignDefaults = (design = {}) => {
  const defaultColors = resumeDefaults.design.colors;
  const userColors = design.colors || {};

  // Safely fallback malformed/invalid hex colors to default values
  const safeColors = {
    heading: isValidHexColor(userColors.heading) ? userColors.heading.trim() : defaultColors.heading,
    accent: isValidHexColor(userColors.accent) ? userColors.accent.trim() : (isValidHexColor(userColors.accentColor) ? userColors.accentColor.trim() : defaultColors.accent),
    text: isValidHexColor(userColors.text) ? userColors.text.trim() : defaultColors.text,
    muted: isValidHexColor(userColors.muted) ? userColors.muted.trim() : defaultColors.muted,
    border: isValidHexColor(userColors.border) ? userColors.border.trim() : defaultColors.border,
    background: isValidHexColor(userColors.background) ? userColors.background.trim() : defaultColors.background,
  };

  const userTypography = design.typography || {};
  const safeTypography = {
    fontFamily: VALID_FONT_FAMILIES.includes(userTypography.fontFamily) ? userTypography.fontFamily : DEFAULT_TYPOGRAPHY.fontFamily,
    fontSizeScale: VALID_FONT_SIZES.includes(userTypography.fontSizeScale) ? userTypography.fontSizeScale : DEFAULT_TYPOGRAPHY.fontSizeScale,
    headingScale: VALID_HEADING_SCALES.includes(userTypography.headingScale) ? userTypography.headingScale : DEFAULT_TYPOGRAPHY.headingScale,
    lineHeight: VALID_LINE_HEIGHTS.includes(userTypography.lineHeight) ? userTypography.lineHeight : DEFAULT_TYPOGRAPHY.lineHeight,
  };

  const userLayout = design.layout || {};
  const resolvedLayout = resolveLayout(userLayout);
  const safeLayout = {
    pageWidth: resolvedLayout.pageWidth,
    columns: resolvedLayout.columns,
    columnRatio: resolvedLayout.columnRatio,
    pageAlignment: resolvedLayout.pageAlignment,
  };

  const userSpacing = design.spacing || {};
  const resolvedSpacing = resolveSpacing(userSpacing);
  const safeSpacing = {
    density: resolvedSpacing.density,
    sectionSpacing: resolvedSpacing.sectionSpacing,
    entrySpacing: resolvedSpacing.entrySpacing,
  };

  const safeHeader = resolveHeader(design.header || {});
  const safeFooter = resolveFooter(design.footer || {});
  const safePhoto = resolvePhoto(design.photo || {});
  const safeLinks = resolveLinks(design.links || {});

  return {
    ...resumeDefaults.design,
    ...design,
    colors: safeColors,
    typography: safeTypography,
    spacing: safeSpacing,
    layout: safeLayout,
    header: safeHeader,
    footer: safeFooter,
    photo: safePhoto,
    links: safeLinks,
  };
};

export const toCanonicalResume = (legacyData = {}) => {
  // If we already have sections, assume it's somewhat canonical. We should still
  // merge missing properties and ensure client IDs exist.
  const isCanonical = Array.isArray(legacyData.sections);

  if (isCanonical) {
    const rawPersonalInfo = legacyData.personalInfo || legacyData.personal_info || {};
    const rawDocument = legacyData.document || {};
    return {
      _id: legacyData._id || "",
      title: legacyData.title || "Untitled Resume",
      public: Boolean(legacyData.public),
      personalInfo: {
        ...resumeDefaults.personalInfo,
        ...rawPersonalInfo,
        photo: normalizePhoto(rawPersonalInfo.photo || rawPersonalInfo.image || rawPersonalInfo.picture),
      },
      document: {
        ...resumeDefaults.document,
        ...rawDocument,
      },
      design: mergeDesignDefaults(legacyData.design || {}),
      sections: (legacyData.sections || []).map((section, sIdx) => ({
        ...section,
        _id: section._id || createClientId("sec"),
        order: typeof section.order === "number" ? section.order : sIdx,
        entries: (section.entries || []).map((entry, eIdx) => ({
          ...entry,
          _id: entry._id || createClientId("entry"),
          order: typeof entry.order === "number" ? entry.order : eIdx,
        })),
      })),
    };
  }

  // Transform legacy structure
  const rawPersonalInfo = legacyData.personalInfo || legacyData.personal_info || {};
  const personalInfo = {
    ...resumeDefaults.personalInfo,
    ...rawPersonalInfo,
    photo: normalizePhoto(rawPersonalInfo.photo || rawPersonalInfo.image || rawPersonalInfo.picture),
  };

  const design = mergeDesignDefaults(legacyData.design || {});

  const sections = [];

  // Default section order definition
  const addSection = (type, defaultTitle, entries = [], visible = true) => {
    sections.push({
      _id: createClientId("sec"),
      type,
      title: defaultTitle,
      order: sections.length,
      visible,
      customization: {},
      entries: entries.map((data, index) => ({
        _id: createClientId("entry"),
        order: index,
        visible: true,
        customization: {},
        data: typeof data === "object" && data !== null ? data : { description: String(data) },
      })),
    });
  };

  // Professional Summary
  const summaryContent =
    legacyData.professional_summary || legacyData.summary || "";
  if (summaryContent) {
    addSection(
      resumeSections.types.SUMMARY,
      resumeSections.definitions[resumeSections.types.SUMMARY]?.defaultTitle || "Professional Summary",
      [{ description: summaryContent }]
    );
  } else {
    // We add empty core sections anyway to match default creation behaviour
    addSection(
      resumeSections.types.SUMMARY,
      resumeSections.definitions[resumeSections.types.SUMMARY]?.defaultTitle || "Professional Summary",
      []
    );
  }

  // Experience
  const experienceEntries = Array.isArray(legacyData.experience)
    ? legacyData.experience.map((e) => ({
        company: e.company || "",
        position: e.position || "",
        location: e.location || "",
        startDate: e.start_date || e.startDate || "",
        endDate: e.end_date || e.endDate || "",
        isCurrent: e.is_current || e.isCurrent || false,
        description: e.description || "",
      }))
    : [];
  addSection(
    resumeSections.types.EXPERIENCE,
    resumeSections.definitions[resumeSections.types.EXPERIENCE]?.defaultTitle || "Experience",
    experienceEntries
  );

  // Education
  const educationEntries = Array.isArray(legacyData.education)
    ? legacyData.education.map((e) => ({
        institution: e.institution || "",
        degree: e.degree || "",
        field: e.field || "",
        graduationDate: e.graduation_date || e.graduationDate || "",
        gpa: e.gpa || "",
      }))
    : [];
  addSection(
    resumeSections.types.EDUCATION,
    resumeSections.definitions[resumeSections.types.EDUCATION]?.defaultTitle || "Education",
    educationEntries
  );

  // Skills
  const buildSkillsEntries = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) {
      return skills.map((s) => {
        if (typeof s === "string") return { category: s, skills: [] };
        if (s && typeof s === "object" && s.category) {
          return {
            category: s.category,
            skills: Array.isArray(s.skills) ? s.skills : (s.skills ? [String(s.skills)] : []),
          };
        }
        return { category: s.name || s.title || "", skills: [] };
      });
    }
    return [{ category: String(skills), skills: [] }];
  };
  addSection(
    resumeSections.types.SKILLS,
    resumeSections.definitions[resumeSections.types.SKILLS]?.defaultTitle || "Skills",
    buildSkillsEntries(legacyData.skills)
  );

  // Projects
  const projectsEntries = Array.isArray(legacyData.projects || legacyData.project)
    ? (legacyData.projects || legacyData.project).map((p) => ({
        name: p.name || "",
        description: p.description || "",
        url: p.url || p.link || "",
        technologies: p.type || p.technologies || "", // mapping from legacy type to technologies
      }))
    : [];
  addSection(
    resumeSections.types.PROJECTS,
    resumeSections.definitions[resumeSections.types.PROJECTS]?.defaultTitle || "Projects",
    projectsEntries
  );

  const rawDocument = legacyData.document || {};
  const document = {
    ...resumeDefaults.document,
    ...rawDocument,
  };

  return {
    _id: legacyData._id || legacyData.id || "",
    title: legacyData.title || "Untitled Resume",
    public: Boolean(legacyData.public),
    personalInfo,
    document,
    design,
    sections,
  };
};

export const createResumeEntry = (data = {}, order = 0) => ({
  _id: createClientId("entry"),
  order,
  visible: true,
  customization: {},
  data,
});

export const updateEntryData = (entries = [], entryId, updatedData) =>
  entries.map((entry) =>
    String(entry._id) === String(entryId)
      ? {
          ...entry,
          data: {
            ...(entry.data || {}),
            ...updatedData,
          },
        }
      : entry
  );

export const replaceEntryData = (entries = [], entryId, data) =>
  entries.map((entry) =>
    String(entry._id) === String(entryId)
      ? {
          ...entry,
          data,
        }
      : entry
  );

export const setEntryVisibility = (entries = [], entryId, visible) =>
  entries.map((entry) =>
    String(entry._id) === String(entryId)
      ? {
          ...entry,
          visible: Boolean(visible),
        }
      : entry
  );

export const getSectionEntries = (sections = [], type) => {
  if (!Array.isArray(sections)) return [];
  const section = sections.find((s) => s.type === type);
  return section?.entries || [];
};

// ============================================================
// SCOPED RESET UTILITIES (Step 5H)
// ============================================================
//
// All reset functions are NON-DESTRUCTIVE:
// - Each call returns a NEW object created via spread.
// - The frozen default objects in `resumeDefaults` are never
//   returned directly, so a caller mutating the result cannot
//   corrupt shared default state.
// - Reset operations target ONLY the customization container
//   they advertise. Personal info, section/entry content, IDs,
//   ordering, and unrelated design fields are preserved.
//
// "Reset All Customization" explicitly preserves design.template
// and all resume content/metadata.
// ============================================================

const VALID_DESIGN_CATEGORIES = Object.freeze([
  "colors",
  "typography",
  "spacing",
  "layout",
  "header",
  "footer",
  "photo",
  "links",
]);

export const isValidDesignCategory = (category) =>
  VALID_DESIGN_CATEGORIES.includes(category);

/**
 * Resets ONE design category to its default values.
 * Preserves all other design fields including design.template.
 *
 * @param {Object} design - Current design object
 * @param {string} category - One of: colors, typography, spacing,
 *   layout, header, footer, photo, links
 * @returns {Object} New design object with category reset to defaults
 */
export const resetDesignCategory = (design, category) => {
  const safeDesign = design && typeof design === "object" ? design : {};

  if (!isValidDesignCategory(category)) {
    return { ...safeDesign };
  }

  const defaultCategory = resumeDefaults.design?.[category];
  if (!defaultCategory || typeof defaultCategory !== "object") {
    return { ...safeDesign };
  }

  return {
    ...safeDesign,
    [category]: { ...defaultCategory },
  };
};

/**
 * Resets a section's customization to default values.
 * Preserves: section._id, type, title, order, visible, entries.
 * Only section.customization is replaced.
 */
export const resetSectionCustomization = (section) => {
  const safeSection =
    section && typeof section === "object" ? section : {};

  return {
    ...safeSection,
    customization: { ...resumeDefaults.sectionCustomization },
  };
};

/**
 * Resets an entry's customization to default values.
 * Preserves: entry._id, order, visible, data.
 * Only entry.customization is replaced.
 */
export const resetEntryCustomization = (entry) => {
  const safeEntry = entry && typeof entry === "object" ? entry : {};

  return {
    ...safeEntry,
    customization: { ...resumeDefaults.entryCustomization },
  };
};

/**
 * Resets ALL supported design customization categories.
 * Preserves: design.template, all other design fields, all
 * resume content, personalInfo, sections, entries, ordering, IDs.
 */
export const resetAllCustomization = (design) => {
  const safeDesign = design && typeof design === "object" ? design : {};
  const result = { ...safeDesign };

  // Explicitly preserve template
  if ("template" in safeDesign) {
    result.template = safeDesign.template;
  }

  for (const category of VALID_DESIGN_CATEGORIES) {
    const defaultCategory = resumeDefaults.design?.[category];
    if (defaultCategory && typeof defaultCategory === "object") {
      result[category] = { ...defaultCategory };
    }
  }

  return result;
};

export default {
  createClientId,
  normalizeEntryOrder,
  normalizeSectionOrder,
  toCanonicalResume,
  getSectionEntries,
  isValidDesignCategory,
  resetDesignCategory,
  resetSectionCustomization,
  resetEntryCustomization,
  resetAllCustomization,
};
