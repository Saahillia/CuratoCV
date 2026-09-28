/**
 * Developer context for resumebuilder/frontend/src/utils/footerResolver.js.
 * Purpose: resolve or normalize Resume Builder footer Resolver data for the UI.
 * Why here: resume-specific transformations stay in the product rather than generic shared packages.
 */
import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveFooter = (footerConfig) => {
    return {
        ...DEFAULT_DESIGN.footer,
        ...(footerConfig || {}),
    };
};
