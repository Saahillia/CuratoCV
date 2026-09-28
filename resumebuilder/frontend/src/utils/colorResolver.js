/**
 * Developer context for resumebuilder/frontend/src/utils/colorResolver.js.
 * Purpose: resolve or normalize Resume Builder color Resolver data for the UI.
 * Why here: resume-specific transformations stay in the product rather than generic shared packages.
 */
import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveColors = (colors) => {
    return {
        ...DEFAULT_DESIGN.colors,
        ...(colors || {}),
    };
};
