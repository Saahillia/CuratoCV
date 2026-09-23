import { DEFAULT_DESIGN } from "../constants/resumeDefaults";

export const resolvePhoto = (photoConfig) => {
    return {
        ...DEFAULT_DESIGN.photo,
        ...(photoConfig || {}),
    };
};
