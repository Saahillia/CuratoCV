import ClassicTemplate from "./templates/ClassicTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import MinimalImageTemplate from "./templates/MinimalImageTemplate";

const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

export const normalizePreviewData = (data = {}) => {
    const rawPersonalInfo = data.personalInfo || data.personal_info || {};

    // Extract photo URL from canonical { url, fileId } object or legacy string.
    // Supports: { url, fileId } | { url: "..." } | "https://..." | null
    const photoValue = rawPersonalInfo.photo;
    const photoUrl = (() => {
        if (typeof photoValue === "string" && photoValue.trim())
            return photoValue;
        if (isPlainObject(photoValue)) return photoValue.url || "";
        return "";
    })();

    // Legacy aliases (only used when photo is absent)
    const legacyImageUrl =
        (typeof rawPersonalInfo.image === "string" &&
        rawPersonalInfo.image.trim()
            ? rawPersonalInfo.image
            : rawPersonalInfo.picture) || "";

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
    let experience = Array.isArray(data.experience) ? data.experience : [];
    let education = Array.isArray(data.education) ? data.education : [];
    let projects = Array.isArray(data.projects)
        ? data.projects
        : Array.isArray(data.project)
          ? data.project
          : [];
    let skills = Array.isArray(data.skills) ? data.skills : [];

    // Parse Mongo sections schema if present
    let sectionsData = {};
    let orderedSections = [];
    
    let processedSections = []; // Each section with full customization

    if (Array.isArray(data.sections) && data.sections.length > 0) {
        // Filter and sort sections
        const activeSections = data.sections
            .filter((s) => s.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Process all sections into a map
        activeSections.forEach((sec) => {
            const type = sec.type?.toLowerCase();
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
                type: sec.type,
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
                    .flatMap(({ data: item }) => {
                        if (Array.isArray(item.skills)) return item.skills;
                        if (typeof item.skills === "string") return item.skills.split(",").map(s => s.trim());
                        return typeof item === "string" ? item : item.name || item.skill || "";
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
                sectionsData[type] = processedEntries.map(({ data: item }) => item || {});
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
        professional_summary: sectionsData.summary || professional_summary,
        experience: sectionsData.experience || experience,
        education: sectionsData.education || education,
        projects: sectionsData.projects || projects,
        project: sectionsData.projects || projects,
        skills: sectionsData.skills || skills,
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

const ResumePreview = ({ data, template, accentColor, classes = "" }) => {
    const previewData = normalizePreviewData(data);

    const renderTemplate = () => {
        const commonProps = {
            data: previewData,
            colors: previewData.design?.colors || {},
            typography: previewData.design?.typography || {},
            layout: previewData.design?.layout || {},
            spacing: previewData.design?.spacing || {},
            header: previewData.design?.header || {},
            footer: previewData.design?.footer || {},
            photo: previewData.design?.photo || {},
            links: previewData.design?.links || {},
        };

        switch (template) {
            case "modern":
                return <ModernTemplate {...commonProps} />;
            case "classic":
                return <ClassicTemplate {...commonProps} />;
            case "minimal":
                return <MinimalTemplate {...commonProps} />;
            case "minimal-image":
                return <MinimalImageTemplate {...commonProps} />;
            default:
                return <ClassicTemplate {...commonProps} />;
        }
    };

    return (
        <div className="w-full mx-auto bg-white">
            <div
                className="resume-a4-page shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] mx-auto"
                style={{ width: "210mm", minHeight: "297mm", height: "auto", background: "white" }}
            >
                <div id="resume-preview" className={classes}>
                    {renderTemplate()}
                </div>
            </div>
            <style>{`
                @page { size: A4; margin: 0; }
                .resume-entry { break-inside: avoid; }
                .resume-section { break-inside: auto; }
            `}</style>
        </div>
    );
};

export default ResumePreview;
