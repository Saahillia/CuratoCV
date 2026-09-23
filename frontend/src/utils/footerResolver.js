import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveFooter = (footerConfig) => {
    return {
        ...DEFAULT_DESIGN.footer,
        ...(footerConfig || {}),
    };
};
