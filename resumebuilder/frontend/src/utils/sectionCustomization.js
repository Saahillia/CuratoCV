// ============================================================
// Section & Entry Customization Utilities
// Canonical enum-to-CSS mapping and validation for section
// and entry customization. Matches backend
// Constants/resumeCustomization.js exactly.
// ============================================================

import {
  DEFAULT_SECTION_CUSTOMIZATION,
  DEFAULT_ENTRY_CUSTOMIZATION,
} from "../constants/resumeDefaults";

// ============================================================
// SECTION CUSTOMIZATION MAPS
// ============================================================

export const HEADING_STYLE_MAP = {
  standard: "",        // no extra class
  bold: "font-bold",
  uppercase: "uppercase tracking-widest",
  accent: "text-accent font-semibold",
  minimal: "font-normal text-slate-500",
};

export const HEADING_SIZE_MAP = {
  small: "text-sm",
  normal: "text-base",
  large: "text-lg",
};

export const SECTION_ALIGNMENT_MAP = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const SECTION_SPACING_MAP = {
  tight: "mb-3",
  normal: "mb-6",
  spacious: "mb-10",
};

export const DIVIDER_MAP = {
  none: "",
  line: "border-b border-slate-200 pb-2",
  accent: "border-b-2 pb-2",
};

export const SECTION_CUSTOMIZATION_FIELDS = Object.freeze({
  visibility: ["visible", "hidden"],
  alignment: ["left", "center", "right"],
  headingStyle: ["standard", "bold", "uppercase", "accent", "minimal"],
  headingSize: ["small", "normal", "large"],
  spacing: ["tight", "normal", "spacious"],
  divider: ["none", "line", "accent"],
});

const isValidEnum = (value, validValues) =>
  validValues.includes(value);

// ============================================================
// ENTRY CUSTOMIZATION MAPS
// ============================================================

export const ENTRY_ALIGNMENT_MAP = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const ENTRY_EMPHASIS_MAP = {
  normal: "opacity-100",
  subtle: "opacity-75",
  strong: "opacity-100 font-semibold",
};

export const ENTRY_SPACING_MAP = {
  tight: "mb-2",
  normal: "mb-4",
  spacious: "mb-6",
};

export const TITLE_STYLE_MAP = {
  normal: "font-medium",
  bold: "font-bold",
  uppercase: "uppercase tracking-wide",
  accent: "font-semibold text-accent",
};

export const SUBTITLE_STYLE_MAP = {
  normal: "font-normal",
  bold: "font-semibold",
  italic: "italic",
  accent: "text-accent font-medium",
};

export const DATE_STYLE_MAP = {
  normal: "text-sm",
  bold: "text-sm font-semibold",
  subtle: "text-sm text-slate-400",
  accent: "text-sm text-accent font-medium",
};

export const ENTRY_CUSTOMIZATION_FIELDS = Object.freeze({
  visibility: ["visible", "hidden"],
  alignment: ["left", "center", "right"],
  emphasis: ["normal", "subtle", "strong"],
  spacing: ["tight", "normal", "spacious"],
  titleStyle: ["normal", "bold", "uppercase", "accent"],
  subtitleStyle: ["normal", "bold", "italic", "accent"],
  dateStyle: ["normal", "bold", "subtle", "accent"],
});

// ============================================================
// RESOLVE SECTION CUSTOMIZATION
// ============================================================

/**
 * Validates and resolves section customization with safe defaults.
 * @param {Object} customization - Section customization object
 * @returns {Object} Resolved customization with validated values + CSS classes
 */
export const resolveSectionCustomization = (customization = {}) => {
  const {
    visibility = DEFAULT_SECTION_CUSTOMIZATION.visibility,
    alignment = DEFAULT_SECTION_CUSTOMIZATION.alignment,
    headingStyle = DEFAULT_SECTION_CUSTOMIZATION.headingStyle,
    headingSize = DEFAULT_SECTION_CUSTOMIZATION.headingSize,
    spacing = DEFAULT_SECTION_CUSTOMIZATION.spacing,
    divider = DEFAULT_SECTION_CUSTOMIZATION.divider,
    sectionSpecific = {},
  } = customization;

  const safeVisibility = isValidEnum(visibility, SECTION_CUSTOMIZATION_FIELDS.visibility)
    ? visibility
    : DEFAULT_SECTION_CUSTOMIZATION.visibility;

  const safeAlignment = isValidEnum(alignment, SECTION_CUSTOMIZATION_FIELDS.alignment)
    ? alignment
    : DEFAULT_SECTION_CUSTOMIZATION.alignment;

  const safeHeadingStyle = isValidEnum(headingStyle, SECTION_CUSTOMIZATION_FIELDS.headingStyle)
    ? headingStyle
    : DEFAULT_SECTION_CUSTOMIZATION.headingStyle;

  const safeHeadingSize = isValidEnum(headingSize, SECTION_CUSTOMIZATION_FIELDS.headingSize)
    ? headingSize
    : DEFAULT_SECTION_CUSTOMIZATION.headingSize;

  const safeSpacing = isValidEnum(spacing, SECTION_CUSTOMIZATION_FIELDS.spacing)
    ? spacing
    : DEFAULT_SECTION_CUSTOMIZATION.spacing;

  const safeDivider = isValidEnum(divider, SECTION_CUSTOMIZATION_FIELDS.divider)
    ? divider
    : DEFAULT_SECTION_CUSTOMIZATION.divider;

  return {
    // Validated enum values
    visibility: safeVisibility,
    alignment: safeAlignment,
    headingStyle: safeHeadingStyle,
    headingSize: safeHeadingSize,
    spacing: safeSpacing,
    divider: safeDivider,

    // sectionSpecific is Mixed — pass through as-is
    sectionSpecific: sectionSpecific || {},

    // CSS class names
    alignmentClass: SECTION_ALIGNMENT_MAP[safeAlignment] || "text-left",
    headingStyleClass: HEADING_STYLE_MAP[safeHeadingStyle] || "",
    headingSizeClass: HEADING_SIZE_MAP[safeHeadingSize] || "text-base",
    spacingClass: SECTION_SPACING_MAP[safeSpacing] || "mb-6",
    dividerClass: DIVIDER_MAP[safeDivider] || "",
  };
};

// ============================================================
// RESOLVE ENTRY CUSTOMIZATION
// ============================================================

/**
 * Validates and resolves entry customization with safe defaults.
 * @param {Object} customization - Entry customization object
 * @returns {Object} Resolved customization with validated values + CSS classes
 */
export const resolveEntryCustomization = (customization = {}) => {
  const {
    visibility = DEFAULT_ENTRY_CUSTOMIZATION.visibility,
    alignment = DEFAULT_ENTRY_CUSTOMIZATION.alignment,
    emphasis = DEFAULT_ENTRY_CUSTOMIZATION.emphasis,
    spacing = DEFAULT_ENTRY_CUSTOMIZATION.spacing,
    titleStyle = DEFAULT_ENTRY_CUSTOMIZATION.titleStyle,
    subtitleStyle = DEFAULT_ENTRY_CUSTOMIZATION.subtitleStyle,
    dateStyle = DEFAULT_ENTRY_CUSTOMIZATION.dateStyle,
  } = customization;

  const safeVisibility = isValidEnum(visibility, ENTRY_CUSTOMIZATION_FIELDS.visibility)
    ? visibility
    : DEFAULT_ENTRY_CUSTOMIZATION.visibility;

  const safeAlignment = isValidEnum(alignment, ENTRY_CUSTOMIZATION_FIELDS.alignment)
    ? alignment
    : DEFAULT_ENTRY_CUSTOMIZATION.alignment;

  const safeEmphasis = isValidEnum(emphasis, ENTRY_CUSTOMIZATION_FIELDS.emphasis)
    ? emphasis
    : DEFAULT_ENTRY_CUSTOMIZATION.emphasis;

  const safeSpacing = isValidEnum(spacing, ENTRY_CUSTOMIZATION_FIELDS.spacing)
    ? spacing
    : DEFAULT_ENTRY_CUSTOMIZATION.spacing;

  const safeTitleStyle = isValidEnum(titleStyle, ENTRY_CUSTOMIZATION_FIELDS.titleStyle)
    ? titleStyle
    : DEFAULT_ENTRY_CUSTOMIZATION.titleStyle;

  const safeSubtitleStyle = isValidEnum(subtitleStyle, ENTRY_CUSTOMIZATION_FIELDS.subtitleStyle)
    ? subtitleStyle
    : DEFAULT_ENTRY_CUSTOMIZATION.subtitleStyle;

  const safeDateStyle = isValidEnum(dateStyle, ENTRY_CUSTOMIZATION_FIELDS.dateStyle)
    ? dateStyle
    : DEFAULT_ENTRY_CUSTOMIZATION.dateStyle;

  return {
    // Validated enum values
    visibility: safeVisibility,
    alignment: safeAlignment,
    emphasis: safeEmphasis,
    spacing: safeSpacing,
    titleStyle: safeTitleStyle,
    subtitleStyle: safeSubtitleStyle,
    dateStyle: safeDateStyle,

    // CSS class names
    alignmentClass: ENTRY_ALIGNMENT_MAP[safeAlignment] || "text-left",
    emphasisClass: ENTRY_EMPHASIS_MAP[safeEmphasis] || "opacity-100",
    spacingClass: ENTRY_SPACING_MAP[safeSpacing] || "mb-4",
    titleStyleClass: TITLE_STYLE_MAP[safeTitleStyle] || "font-medium",
    subtitleStyleClass: SUBTITLE_STYLE_MAP[safeSubtitleStyle] || "font-normal",
    dateStyleClass: DATE_STYLE_MAP[safeDateStyle] || "text-sm",
  };
};

// ============================================================
// UPDATE HELPERS (non-destructive)
// ============================================================

/**
 * Non-destructively update a section's customization.
 * Preserves all sibling fields and all other section properties.
 */
export const updateSectionCustomization = (section, patch) => {
  const current = section.customization || {};
  return {
    ...section,
    customization: {
      ...DEFAULT_SECTION_CUSTOMIZATION,
      ...current,
      ...patch,
    },
  };
};

/**
 * Non-destructively update a section-specific customization field.
 */
export const updateSectionSpecific = (section, key, value) => {
  const current = section.customization?.sectionSpecific || {};
  return updateSectionCustomization(section, {
    sectionSpecific: {
      ...current,
      [key]: value,
    },
  });
};

/**
 * Non-destructively update an entry's customization.
 * Preserves all sibling fields and all other entry properties.
 */
export const updateEntryCustomization = (entry, patch) => {
  const current = entry.customization || {};
  return {
    ...entry,
    customization: {
      ...DEFAULT_ENTRY_CUSTOMIZATION,
      ...current,
      ...patch,
    },
  };
};
