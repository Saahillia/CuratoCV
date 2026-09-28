/**
 * Developer context for resumebuilder/frontend/src/utils/photoResolver.js.
 * Purpose: resolve or normalize Resume Builder photo Resolver data for the UI.
 * Why here: resume-specific transformations stay in the product rather than generic shared packages.
 */
import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolvePhoto = (photoConfig) => {
    return {
        ...DEFAULT_DESIGN.photo,
        ...(photoConfig || {}),
    };
};
