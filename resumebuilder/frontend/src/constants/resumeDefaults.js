/**
 * Developer context for resumebuilder/frontend/src/constants/resumeDefaults.js.
 * Purpose: define the Resume Builder resume Defaults vocabulary/configuration consumed by its UI.
 * Why here: canonical product choices should be owned by Resume Builder, not duplicated in the application shell.
 */
import resumeSections from "./resumeSections.js";

export const DEFAULT_PERSONAL_INFO = {
    fullName: "",
    profession: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    photo: { url: "", fileId: "" },
};

export const DEFAULT_DOCUMENT = {
    language: "en",
    dateFormat: "MM/YYYY",
    pageFormat: "A4",
};

export const DEFAULT_DESIGN = {
    template: "classic",
    colors: { heading: "#17375F", accent: "#0353A4", text: "#102A43", muted: "#627D98", border: "#90C2E7", background: "#FFFFFF" },
    typography: { fontFamily: "system", fontSizeScale: "normal", headingScale: "normal", lineHeight: "normal", fontSizePt: 10.5, nameSizePt: 22, sectionHeadingSizePt: 13.5, entryHeadingSizePt: 11.5 },
    spacing: { density: "normal", sectionSpacing: "normal", entrySpacing: "normal", lineHeightMultiplier: 1.25, sectionSpacingMm: 3, pageMarginMm: 10 },
    layout: { pageWidth: "standard", columns: "single", columnRatio: "50-50", pageAlignment: "left" },
    header: { alignment: "left", layout: "standard" },
    footer: { visibility: "hidden", alignment: "center" },
    photo: { visibility: "hidden", shape: "circle", position: "right", size: "medium", fit: "cover" },
    links: { style: "accent", target: "new-tab" },
};

export const DEFAULT_SECTION_CUSTOMIZATION = { visibility: "visible", alignment: "left", headingStyle: "standard", headingSize: "normal", spacing: "normal", divider: "none" };
export const DEFAULT_ENTRY_CUSTOMIZATION = { visibility: "visible", alignment: "left", emphasis: "normal", spacing: "normal", titleStyle: "bold", subtitleStyle: "normal", dateStyle: "subtle" };

const createDefaultSection = ({ type, title, order, entries = [], customization = {} }) => {
    const definition = resumeSections.getDefinition(type);
    return {
        type,
        title: title || definition?.defaultTitle || "Untitled",
        order,
        visible: true,
        customization: { ...DEFAULT_SECTION_CUSTOMIZATION, ...customization },
        entries: entries.map((entry, index) => ({
            ...entry,
            order: entry.order ?? index,
            visible: entry.visible ?? true,
            customization: { ...DEFAULT_ENTRY_CUSTOMIZATION, ...(entry.customization || {}) },
        })),
    };
};

const createDefaultSections = () =>
    resumeSections.defaultOrder.map((type, index) =>
        createDefaultSection({
            type,
            title: resumeSections.getDefinition(type)?.defaultTitle,
            order: index,
        })
    );

const createDefaultResumeData = () => ({
    title: "Untitled Resume",
    public: false,
    personalInfo: { ...DEFAULT_PERSONAL_INFO },
    document: { ...DEFAULT_DOCUMENT },
    sections: createDefaultSections(),
    design: { ...DEFAULT_DESIGN },
});

export const resumeDefaults = {
    personalInfo: DEFAULT_PERSONAL_INFO,
    document: DEFAULT_DOCUMENT,
    design: DEFAULT_DESIGN,
    sectionCustomization: DEFAULT_SECTION_CUSTOMIZATION,
    entryCustomization: DEFAULT_ENTRY_CUSTOMIZATION,
    createDefaultSection,
    createDefaultSections,
    createDefaultResumeData,
};

export default resumeDefaults;
