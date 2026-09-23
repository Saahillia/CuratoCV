// ============================================================
// Layout & Spacing Utilities
// Canonical enum-to-CSS mapping and validation for resume design
// Matches backend Constants/resumeCustomization.js enums exactly
// ============================================================

// Layout enum mappings
export const PAGE_WIDTH_MAP = {
  compact: "max-w-3xl",
  standard: "max-w-4xl",
  wide: "max-w-5xl",
};

export const PAGE_ALIGNMENT_MAP = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

export const COLUMN_RATIO_MAP = {
  "50-50": "grid-cols-1 lg:grid-cols-2",
  "60-40": "grid-cols-1 lg:grid-cols-[60%_40%]",
  "40-60": "grid-cols-1 lg:grid-cols-[40%_60%]",
  "65-35": "grid-cols-1 lg:grid-cols-[65%_35%]",
  "35-65": "grid-cols-1 lg:grid-cols-[35%_65%]",
};

// Spacing enum mappings
export const DENSITY_MAP = {
  compact: "p-4",
  normal: "p-8",
  spacious: "p-12",
};

export const SECTION_SPACING_MAP = {
  tight: "mb-3",
  normal: "mb-6",
  spacious: "mb-10",
};

export const ENTRY_SPACING_MAP = {
  tight: "space-y-2",
  normal: "space-y-4",
  spacious: "space-y-6",
};

// Valid enum arrays for validation (must match backend exactly)
export const VALID_PAGE_WIDTHS = Object.keys(PAGE_WIDTH_MAP);
export const VALID_PAGE_ALIGNMENTS = Object.keys(PAGE_ALIGNMENT_MAP);
export const VALID_COLUMN_RATIOS = Object.keys(COLUMN_RATIO_MAP);
export const VALID_COLUMNS = ["single", "two"];

export const VALID_DENSITIES = Object.keys(DENSITY_MAP);
export const VALID_SECTION_SPACINGS = Object.keys(SECTION_SPACING_MAP);
export const VALID_ENTRY_SPACINGS = Object.keys(ENTRY_SPACING_MAP);

// Default values (must match backend Constants/resumeDefaults.js)
export const DEFAULT_LAYOUT = {
  pageWidth: "standard",
  columns: "single",
  columnRatio: "50-50",
  pageAlignment: "left",
};

export const DEFAULT_SPACING = {
  density: "normal",
  sectionSpacing: "normal",
  entrySpacing: "normal",
};

/**
 * Validates and resolves layout settings to CSS class names
 * @param {Object} layout - User layout settings
 * @returns {Object} Resolved layout with CSS classes and validated values
 */
export const resolveLayout = (layout = {}) => {
  const pageWidth = VALID_PAGE_WIDTHS.includes(layout.pageWidth)
    ? layout.pageWidth
    : DEFAULT_LAYOUT.pageWidth;

  const pageAlignment = VALID_PAGE_ALIGNMENTS.includes(layout.pageAlignment)
    ? layout.pageAlignment
    : DEFAULT_LAYOUT.pageAlignment;

  const columns = VALID_COLUMNS.includes(layout.columns)
    ? layout.columns
    : DEFAULT_LAYOUT.columns;

  const columnRatio = VALID_COLUMN_RATIOS.includes(layout.columnRatio)
    ? layout.columnRatio
    : DEFAULT_LAYOUT.columnRatio;

  return {
    // Validated enum values
    pageWidth,
    columns,
    columnRatio,
    pageAlignment,

    // CSS class names for direct use in templates
    pageWidthClass: PAGE_WIDTH_MAP[pageWidth],
    pageAlignmentClass: PAGE_ALIGNMENT_MAP[pageAlignment],
    columnRatioClass: COLUMN_RATIO_MAP[columnRatio],
  };
};

/**
 * Validates and resolves spacing settings to CSS class names
 * @param {Object} spacing - User spacing settings
 * @returns {Object} Resolved spacing with CSS classes and validated values
 */
export const resolveSpacing = (spacing = {}) => {
  const density = VALID_DENSITIES.includes(spacing.density)
    ? spacing.density
    : DEFAULT_SPACING.density;

  const sectionSpacing = VALID_SECTION_SPACINGS.includes(spacing.sectionSpacing)
    ? spacing.sectionSpacing
    : DEFAULT_SPACING.sectionSpacing;

  const entrySpacing = VALID_ENTRY_SPACINGS.includes(spacing.entrySpacing)
    ? spacing.entrySpacing
    : DEFAULT_SPACING.entrySpacing;

  return {
    // Validated enum values
    density,
    sectionSpacing,
    entrySpacing,

    // CSS class names for direct use in templates
    densityClass: DENSITY_MAP[density],
    sectionSpacingClass: SECTION_SPACING_MAP[sectionSpacing],
    entrySpacingClass: ENTRY_SPACING_MAP[entrySpacing],
  };
};
