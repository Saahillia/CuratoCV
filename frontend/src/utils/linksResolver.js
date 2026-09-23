import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveLinks = (linksConfig) => {
    return {
        ...DEFAULT_DESIGN.links,
        ...(linksConfig || {}),
    };
};
