/**
 * Developer context for resumebuilder/frontend/src/constants/resumePage.js.
 * Purpose: define the Resume Builder resume Page vocabulary/configuration consumed by its UI.
 * Why here: canonical product choices should be owned by Resume Builder, not duplicated in the application shell.
 */
export const A4_DIMENSIONS = {
  WIDTH_MM: 210,
  HEIGHT_MM: 297,
};

// CSS representation for rendering
export const A4_CSS = {
  width: `${A4_DIMENSIONS.WIDTH_MM}mm`,
  height: `${A4_DIMENSIONS.HEIGHT_MM}mm`,
  minHeight: `${A4_DIMENSIONS.HEIGHT_MM}mm`,
  maxHeight: `${A4_DIMENSIONS.HEIGHT_MM}mm`,
};

// Provide a small tolerance for height differences due to rounding
export const PAGE_HEIGHT_TOLERANCE_PX = 5;
