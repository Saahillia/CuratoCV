/**
 * Developer context for resumebuilder/frontend/src/utils/linksResolver.js.
 * Purpose: resolve or normalize Resume Builder links Resolver data for the UI.
 * Why here: resume-specific transformations stay in the product rather than generic shared packages.
 */
import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveLinks = (linksConfig) => {
    return {
        ...DEFAULT_DESIGN.links,
        ...(linksConfig || {}),
    };
};
