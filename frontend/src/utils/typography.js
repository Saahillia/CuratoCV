/**
 * Typography utilities for resume customization.
 * Maps canonical enum values from resumeCustomization.js to CSS styles.
 */

// Canonical enum values (mirrors backend/Constants/resumeCustomization.js)
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

// Human-readable labels for UI
export const FONT_FAMILY_LABELS = Object.freeze({
  system: "System UI",
  inter: "Inter",
  roboto: "Roboto",
  "open-sans": "Open Sans",
  lato: "Lato",
  montserrat: "Montserrat",
  poppins: "Poppins",
  merriweather: "Merriweather",
  "source-sans-3": "Source Sans 3",
  serif: "Serif",
});

// CSS font-family strings
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

// Base font size in pixels
export const FONT_SIZE_MAP = Object.freeze({
  small: "13px",
  normal: "15px",
  large: "17px",
});

// Heading scale multiplier (applied to base font size)
export const HEADING_SCALE_MAP = Object.freeze({
  small: 1.3,
  normal: 1.5,
  large: 1.8,
});

// Line height multiplier
export const LINE_HEIGHT_MAP = Object.freeze({
  tight: 1.3,
  normal: 1.5,
  relaxed: 1.7,
});

// Default typography values
export const DEFAULT_TYPOGRAPHY = Object.freeze({
  fontFamily: "system",
  fontSizeScale: "normal",
  headingScale: "normal",
  lineHeight: "normal",
});

/**
 * Validates a typography value against allowed enums, falls back to default.
 */
function validateEnum(value, validValues, defaultValue) {
  if (validValues.includes(value)) return value;
  return defaultValue;
}

/**
 * Resolves canonical typography enum values to CSS styles.
 * @param {Object} typography - The typography object from resumeData.design.typography
 * @returns {Object} Resolved CSS styles: { fontFamily, fontSize, headingScale, lineHeight }
 */
export function resolveTypography(typography = {}) {
  const t = typography || {};

  const fontFamily = validateEnum(t.fontFamily, VALID_FONT_FAMILIES, DEFAULT_TYPOGRAPHY.fontFamily);
  const fontSizeScale = validateEnum(t.fontSizeScale, VALID_FONT_SIZES, DEFAULT_TYPOGRAPHY.fontSizeScale);
  const headingScale = validateEnum(t.headingScale, VALID_HEADING_SCALES, DEFAULT_TYPOGRAPHY.headingScale);
  const lineHeight = validateEnum(t.lineHeight, VALID_LINE_HEIGHTS, DEFAULT_TYPOGRAPHY.lineHeight);

  return {
    fontFamily: FONT_FAMILY_MAP[fontFamily],
    fontSize: FONT_SIZE_MAP[fontSizeScale],
    headingScale: HEADING_SCALE_MAP[headingScale],
    lineHeight: LINE_HEIGHT_MAP[lineHeight],
    // Also return raw enum values for validation display
    _raw: { fontFamily, fontSizeScale, headingScale, lineHeight },
  };
}

/**
 * Computes heading font size based on base font size and heading scale.
 * @param {string} baseFontSize - e.g. "15px"
 * @param {number} headingScale - e.g. 1.5
 * @returns {string} Computed heading size in px
 */
export function computeHeadingSize(baseFontSize, headingScale) {
  const base = parseFloat(baseFontSize);
  return `${base * headingScale}px`;
}