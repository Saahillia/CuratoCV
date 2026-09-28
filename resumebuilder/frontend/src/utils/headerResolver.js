/**
 * Developer context for resumebuilder/frontend/src/utils/headerResolver.js.
 * Purpose: resolve or normalize Resume Builder header Resolver data for the UI.
 * Why here: resume-specific transformations stay in the product rather than generic shared packages.
 */
import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveHeader = (header) => {
    return {
        ...DEFAULT_DESIGN.header,
        ...(header || {}),
    };
};
