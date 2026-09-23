import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolveColors = (colors) => {
    return {
        ...DEFAULT_DESIGN.colors,
        ...(colors || {}),
    };
};
