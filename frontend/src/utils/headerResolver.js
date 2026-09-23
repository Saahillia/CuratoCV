import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveHeader = (header) => {
    return {
        ...DEFAULT_DESIGN.header,
        ...(header || {}),
    };
};
