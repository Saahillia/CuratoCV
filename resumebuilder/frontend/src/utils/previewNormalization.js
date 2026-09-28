/**
 * Developer context for resumebuilder/frontend/src/utils/previewNormalization.js.
 * Purpose: hold normalizePreviewData — the canonical conversion of a stored
 * resume into the shape every preview renderer consumes (personal info, hidden
 * sections zeroed, canonical section types/titles/entries, custom section
 * order preserved).
 * Why here: it is a pure data transformation with no view behaviour, so it
 * lives beside the other resume resolvers. ResumePreview.jsx re-exports it so
 * existing importers keep working, and the backend's PDF parity test
 * (tests/unit/backend/services/resumeDesignParity.test.js) imports it directly
 * to prove resumebuilder/backend/src/services/resumeDesign.js's
 * normalizeResumeData mirrors this function exactly.
 */

const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const previewObjectUrls = new WeakMap();
const getLocalImageUrl = (file) => {
    if (typeof File === "undefined" || !(file instanceof File)) return "";
    if (!previewObjectUrls.has(file)) previewObjectUrls.set(file, URL.createObjectURL(file));
    return previewObjectUrls.get(file);
};

export const normalizePreviewData = (data = {}) => {
    const rawPersonalInfo = data.personalInfo || data.personal_info || {};

    // Extract photo URL from canonical { url, fileId } object or legacy string.
    // Supports: { url, fileId } | { url: "..." } | "https://..." | null
    const photoValue = rawPersonalInfo.photo;
    const photoUrl = (() => {
        if (typeof photoValue === "string" && photoValue.trim())
            return photoValue;
        const localUrl = getLocalImageUrl(photoValue);
        if (localUrl) return localUrl;
        if (isPlainObject(photoValue)) return photoValue.url || "";
        return "";
    })();

    // Legacy aliases (only used when photo is absent)
    const legacyImageUrl =
        (typeof rawPersonalInfo.image === "string" &&
        rawPersonalInfo.image.trim()
            ? rawPersonalInfo.image
            : getLocalImageUrl(rawPersonalInfo.image) || rawPersonalInfo.picture) || "";

    const personal_info = {
        full_name:
            rawPersonalInfo.fullName ||
            rawPersonalInfo.full_name ||
            rawPersonalInfo.name ||
            data.title ||
            "Your Name",
        email: rawPersonalInfo.email || "",
        phone: rawPersonalInfo.phone || "",
        location: rawPersonalInfo.location || "",
        profession: rawPersonalInfo.profession || "",
        linkedin: rawPersonalInfo.linkedin || "",
        website: rawPersonalInfo.website || "",
        image: photoUrl || legacyImageUrl || "",
    };

    let professional_summary = data.professional_summary || data.summary || "";
    let experience = Array.isArray(data.experience) ? data.experience : Array.isArray(data.experiences) ? data.experiences : [];
    let education = Array.isArray(data.education) ? data.education : Array.isArray(data.educations) ? data.educations : [];
    let projects = Array.isArray(data.projects)
        ? data.projects
        : Array.isArray(data.project)
          ? data.project
          : [];
    let skills = Array.isArray(data.skills) ? data.skills : [];

    // Parse Mongo sections schema if present
    let sectionsData = {};
    let orderedSections = [];
    const hiddenSectionTypes = new Set(
        (data.sections || []).filter((section) => section.visible === false).map((section) => section.type?.toLowerCase())
    );

    let processedSections = []; // Each section with full customization

    if (Array.isArray(data.sections) && data.sections.length > 0) {
        // Filter and sort sections
        const activeSections = data.sections
            .filter((s) => s.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Process all sections into a map
        activeSections.forEach((sec) => {
            const rawType = sec.type?.toLowerCase();
            const type = ({ professional_summary: "summary", experiences: "experience", educations: "education", project: "projects" })[rawType] || rawType;
            orderedSections.push(type);

            // Build processed entry list (filter visible entries + keep customization)
            const processedEntries = (sec.entries || [])
                .filter((e) => e.visible !== false)
                .map((e) => ({
                    data: e.data || {},
                    customization: e.customization || {},
                    _id: e._id,
                }));

            // Preserve the full section shape with customization
            processedSections.push({
                _id: sec._id,
                type,
                title: sec.title,
                order: sec.order,
                visible: sec.visible,
                customization: sec.customization || {},
                entries: processedEntries,
            });

            if (type === "summary" || type === "professional_summary") {
                sectionsData.summary = sec.entries?.[0]?.data?.description || "";
            } else if (type === "experience" || type === "work") {
                sectionsData.experience = processedEntries.map(({ data: item }) => ({
                    company: item.company || "",
                    position: item.position || item.title || item.jobTitle || "",
                    start_date: item.startDate || item.start_date || "",
                    end_date: item.endDate || item.end_date || "",
                    description: item.description || "",
                    is_current: item.isCurrent || item.currentlyWorking || false,
                    location: item.location || "",
                }));
            } else if (type === "education") {
                sectionsData.education = processedEntries.map(({ data: item }) => ({
                    institution: item.institution || item.school || "",
                    degree: item.degree || "",
                    field: item.field || item.major || "",
                    graduation_date: item.graduationDate || item.graduation_date || item.endDate || "",
                    gpa: item.gpa || "",
                }));
            } else if (type === "skills") {
                sectionsData.skills = processedEntries
                    .map(({ data: item }) => {
                        if (typeof item === "string") return item.trim();
                        const category = String(item.category || item.name || item.title || "").trim();
                        const values = Array.isArray(item.skills)
                            ? item.skills
                            : typeof item.skills === "string"
                                ? item.skills.split(",")
                                : item.skill ? [item.skill] : [];
                        const skillsText = values.map((value) => String(value).trim()).filter(Boolean).join(", ");
                        if (category && skillsText) return `${category}: ${skillsText}`;
                        return category || skillsText || String(item.description || "").trim();
                    })
                    .filter(Boolean)
                    .map(s => String(s).trim());
            } else if (type === "projects") {
                sectionsData.projects = processedEntries.map(({ data: item }) => ({
                    name: item.name || item.title || "",
                    description: item.description || "",
                    url: item.url || item.link || "",
                    technologies: item.technologies || item.techStack || "",
                }));
            } else if (["certificates", "courses", "awards", "languages", "interests", "organisations", "publications", "references", "declaration"].includes(type) || type === "custom") {
                sectionsData[type] = [...(sectionsData[type] || []), ...processedEntries.map(({ data: item }) => item || {})];
            }
        });
    } else {
        // Legacy polyfill for data with no sections array
        let orderBase = 0;
        if (professional_summary) {
            processedSections.push({ type: "summary", title: "Professional Summary", order: orderBase++, visible: true, customization: {}, entries: [{ data: { description: professional_summary } }] });
        }
        if (experience.length > 0) {
            processedSections.push({ type: "experience", title: "Experience", order: orderBase++, visible: true, customization: {}, entries: experience.map(e => ({ data: e })) });
        }
        if (projects.length > 0) {
            processedSections.push({ type: "projects", title: "Projects", order: orderBase++, visible: true, customization: {}, entries: projects.map(p => ({ data: p })) });
        }
        if (education.length > 0) {
            processedSections.push({ type: "education", title: "Education", order: orderBase++, visible: true, customization: {}, entries: education.map(e => ({ data: e })) });
        }
        if (skills.length > 0) {
            processedSections.push({ type: "skills", title: "Skills", order: orderBase++, visible: true, customization: {}, entries: skills.map(s => ({ data: s })) });
        }
    }

    return {
        ...data,
        personal_info,
        personalInfo: personal_info,
        professional_summary: hiddenSectionTypes.has("summary") || hiddenSectionTypes.has("professional_summary") ? "" : sectionsData.summary ?? professional_summary,
        experience: hiddenSectionTypes.has("experience") || hiddenSectionTypes.has("work") ? [] : sectionsData.experience ?? experience,
        education: hiddenSectionTypes.has("education") ? [] : sectionsData.education ?? education,
        projects: hiddenSectionTypes.has("projects") ? [] : sectionsData.projects ?? projects,
        project: hiddenSectionTypes.has("projects") ? [] : sectionsData.projects ?? projects,
        skills: hiddenSectionTypes.has("skills") ? [] : sectionsData.skills ?? skills,
        sectionsData,
        orderedSections,
        // Preserve full sections shape with customization for templates that consume it
        sections:
            processedSections.length > 0
                ? processedSections
                : data.sections || [],
        // ... rest
        certificates: sectionsData.certificates || [],
        courses: sectionsData.courses || [],
        awards: sectionsData.awards || [],
        languages: sectionsData.languages || [],
        interests: sectionsData.interests || [],
        organisations: sectionsData.organisations || [],
        publications: sectionsData.publications || [],
        references: sectionsData.references || [],
        declaration: sectionsData.declaration || [],
        custom: sectionsData.custom || [],
    };
};

export default normalizePreviewData;
