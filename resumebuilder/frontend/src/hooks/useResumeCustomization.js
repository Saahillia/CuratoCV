// ============================================================
// CuratoCV Resume Customization Hook
// ============================================================
//
// Hook for managing resume design customization state:
// theme colors, font selections, layout preferences, etc.
// ============================================================

import { useState } from "react";

/**
 * Initial default customization values aligned with the backend
 * resumeCustomization constants.
 */
const defaultCustomization = {
    color: "#1e293b",          /* primary text */
    background: "#f8f9fa",     /* page bg */
    fontFamily: "Inter",       /* system font */
    fontSize: "14px",          /* base size */
    primaryAccent: "#3b82f6",  /* links/buttons */
};

export const useResumeCustomization = () => {
    const [theme, setTheme] = useState(defaultCustomization);
    const [isCustomizing, setIsCustomizing] = useState(false);

    const updateTheme = (updates) => {
        setTheme((prev) => ({ ...prev, ...updates }));
    };

    const resetTheme = () => {
        setTheme(defaultCustomization);
    };

    return {
        theme,
        setTheme: updateTheme,
        resetTheme,
        isCustomizing,
        setIsCustomizing,
    };
};

export default useResumeCustomization;