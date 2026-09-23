const TYPES = {
    SUMMARY: "summary",
    EXPERIENCE: "experience",
    EDUCATION: "education",
    SKILLS: "skills",
    PROJECTS: "projects",
    CERTIFICATES: "certificates",
    COURSES: "courses",
    AWARDS: "awards",
    LANGUAGES: "languages",
    INTERESTS: "interests",
    ORGANISATIONS: "organisations",
    PUBLICATIONS: "publications",
    REFERENCES: "references",
    DECLARATION: "declaration",
    CUSTOM: "custom",
};

const DEFINITIONS = {
    summary: { defaultTitle: "Professional Summary", category: "core", supportsEntries: false, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    experience: { defaultTitle: "Experience", category: "core", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    education: { defaultTitle: "Education", category: "core", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    skills: { defaultTitle: "Skills", category: "core", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    projects: { defaultTitle: "Projects", category: "core", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    certificates: { defaultTitle: "Certificates", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    courses: { defaultTitle: "Courses", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    awards: { defaultTitle: "Awards", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    languages: { defaultTitle: "Languages", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    interests: { defaultTitle: "Interests", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    organisations: { defaultTitle: "Organisations", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    publications: { defaultTitle: "Publications", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    references: { defaultTitle: "References", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    declaration: { defaultTitle: "Declaration", category: "additional", supportsEntries: true, supportsCustomization: true, supportsMultiple: false, userCanRemove: true },
    custom: { defaultTitle: "Custom Section", category: "custom", supportsEntries: true, supportsCustomization: true, supportsMultiple: true, userCanRemove: true },
};

const CATEGORIES = { CORE: "core", ADDITIONAL: "additional", CUSTOM: "custom" };

const ALL = Object.values(TYPES);
const CORE = Object.entries(DEFINITIONS).filter(([_, def]) => def.category === "core").map(([k]) => k);
const ADDITIONAL = Object.entries(DEFINITIONS).filter(([_, def]) => def.category === "additional").map(([k]) => k);

export const resumeSections = {
    types: TYPES,
    categories: CATEGORIES,
    definitions: DEFINITIONS,
    defaultOrder: ["summary", "experience", "education", "skills", "projects"],
    addable: ALL,
    all: ALL,
    core: CORE,
    additional: ADDITIONAL,
    isValidType: (sectionType) => typeof sectionType === "string" && ALL.includes(sectionType),
    getDefinition: (sectionType) => DEFINITIONS[sectionType] || null,
};

export default resumeSections;
