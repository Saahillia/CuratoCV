import { resolveTypography } from "../../utils/typography";
import { resolveSpacing } from "../../utils/layoutSpacing";
import {
    resolveSectionCustomization,
    resolveEntryCustomization,
} from "../../utils/sectionCustomization";

/**
 * Reusable section renderer for resume templates.
 * Consumes semantic colors (colors.heading, colors.accent, colors.text, colors.muted, colors.border, etc.)
 * Consumes section & entry customization when available.
 */

export const formatDate = (dateStr) => {
    if (typeof dateStr !== "string" || !/^\d{4}-\d{2}$/.test(dateStr))
        return "";
    const [year, month] = dateStr.split("-").map(Number);
    if (month < 1 || month > 12) return "";
    return new Date(year, month - 1).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
    });
};

/**
 * Find customization for a section by section type.
 * Matches by looking up the section in `data.sections` that has the same type.
 */
const findSectionCustomization = (data, sectionType) => {
    if (!data?.sections || !Array.isArray(data.sections)) {
        return { customization: {}, entries: [] };
    }
    const section = data.sections.find(
        (s) => s.type?.toLowerCase() === sectionType?.toLowerCase(),
    );
    return {
        customization: section?.customization || {},
        entries: section?.entries || [],
    };
};

const getSectionTitle = (data, sectionTypes, fallback) => {
    const types = Array.isArray(sectionTypes) ? sectionTypes : [sectionTypes];
    const section = (data?.sections || []).find((candidate) =>
        types.includes(candidate.type?.toLowerCase()),
    );
    return section?.title?.trim() || fallback;
};

/**
 * Find entry customization for a given entry data object.
 * Matches by index in the section's entries array.
 */
const findEntryCustomization = (sectionEntries, entryData, fallbackIndex) => {
    if (!Array.isArray(sectionEntries) || sectionEntries.length === 0) {
        return {};
    }
    // Try to match by data reference if available
    if (entryData && typeof entryData === "object") {
        const match = sectionEntries.find((e) => e.data === entryData);
        if (match) return match.customization || {};
    }
    // Fall back to index
    const byIndex = sectionEntries[fallbackIndex];
    return byIndex?.customization || {};
};

/** Section header with heading color & bottom border (now customization-aware) */
export const SectionHeader = ({
    title,
    colors = {},
    typography = {},
    sectionCustomization = {},
}) => {
    const typo = resolveTypography(typography);
    const sc = resolveSectionCustomization(sectionCustomization);

    const headingScaleMultiplier =
        sc.headingSize === "small"
            ? 0.875
            : sc.headingSize === "large"
              ? 1.25
              : 1;

    // Apply heading style classes
    const headingStyleClass = sc.headingStyleClass;
    const dividerClass = sc.dividerClass;

    // If accent style, override color
    const headingColor =
        sc.headingStyle === "accent"
            ? colors.accent || "#0353A4"
            : sc.headingStyle === "minimal"
              ? colors.muted || "#627D98"
              : colors.heading || "#17375F";

    // Divider color
    const dividerColor =
        sc.divider === "accent"
            ? colors.accent || "#0353A4"
            : colors.border || "#90C2E7";

    // Apply text transform based on heading style
    const textTransformClass =
        sc.headingStyle === "uppercase" ? "uppercase" : "";

    return (
        <h2
            className={`${headingStyleClass} ${dividerClass} ${textTransformClass} tracking-wide`}
            style={{
                color: headingColor,
                borderColor: dividerColor,
                fontSize: `${1.125 * typo.headingScale * headingScaleMultiplier}rem`,
                lineHeight: 1.2,
            }}
        >
            {sc.headingStyle === "uppercase" ? title.toUpperCase() : title}
        </h2>
    );
};

/** Summary Section */
export const renderSummary = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    if (!data.professional_summary) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries } = findSectionCustomization(
        data,
        "summary",
    );
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(
                    data,
                    ["summary", "professional_summary"],
                    "Professional Summary",
                )}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <p
                className="leading-relaxed whitespace-pre-line mt-2"
                style={{ color: colors.text || "#102A43" }}
            >
                {data.professional_summary}
            </p>
        </section>
    );
};

/** Experience Section */
export const renderExperience = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const experience = data.experience;
    if (!experience || experience.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "experience");
    const sc = resolveSectionCustomization(sectionCust);
    const expSpecific = sectionCust?.sectionSpecific || {};

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(
                    data,
                    ["experience", "experiences"],
                    "Professional Experience",
                )}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {experience.map((exp, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        exp,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    if (ec.visibility === "hidden") return null;
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3
                                        className={ec.titleStyleClass}
                                        style={{
                                            color: ec.titleStyle === "accent" ? colors.accent : (colors.heading || "#17375F")
                                        }}
                                    >
                                        {exp.position}
                                    </h3>
                                    <p
                                        className={ec.subtitleStyleClass}
                                        style={{
                                            color: ec.subtitleStyle === "accent" ? colors.accent : (colors.text || "#102A43")
                                        }}
                                    >
                                        {exp.company}
                                    </p>
                                    {exp.location && (
                                        <p
                                            className="text-sm"
                                            style={{
                                                color:
                                                    colors.muted || "#627D98",
                                            }}
                                        >
                                            {exp.location}
                                        </p>
                                    )}
                                </div>
                                <div
                                    className={ec.dateStyleClass}
                                    style={{ color: ec.dateStyle === "accent" ? colors.accent : (colors.muted || "#627D98") }}
                                >
                                    <p>
                                        {formatDate(exp.start_date)} -{" "}
                                        {exp.is_current
                                            ? "Present"
                                            : formatDate(exp.end_date)}
                                    </p>
                                </div>
                            </div>
                            {exp.description && (
                                <div
                                    className="leading-relaxed whitespace-pre-line mt-1"
                                    style={{ color: colors.text || "#102A43" }}
                                >
                                    {exp.description}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Education Section */
export const renderEducation = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const education = data.education;
    if (!education || education.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "education");
    const sc = resolveSectionCustomization(sectionCust);
    const eduSpecific = sectionCust?.sectionSpecific || {};

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(
                    data,
                    ["education", "educations"],
                    "Education",
                )}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {education.map((edu, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        edu,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    if (ec.visibility === "hidden") return null;
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3
                                        className={ec.titleStyleClass}
                                        style={{
                                            color: ec.titleStyle === "accent" ? colors.accent : (colors.heading || "#17375F")
                                        }}
                                    >
                                        {edu.degree}{" "}
                                        {edu.field && `in ${edu.field}`}
                                    </h3>
                                    <p
                                        className={ec.subtitleStyleClass}
                                        style={{
                                            color: ec.subtitleStyle === "accent" ? colors.accent : (colors.text || "#102A43")
                                        }}
                                    >
                                        {edu.institution}
                                    </p>
                                    {edu.gpa && (
                                        <p
                                            className="text-sm"
                                            style={{
                                                color:
                                                    colors.muted || "#627D98",
                                            }}
                                        >
                                            GPA: {edu.gpa}
                                        </p>
                                    )}
                                </div>
                                <div
                                    className={ec.dateStyleClass}
                                    style={{ color: ec.dateStyle === "accent" ? colors.accent : (colors.muted || "#627D98") }}
                                >
                                    <p>{formatDate(edu.graduation_date)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Skills Section */
export const renderSkills = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "skills");
    const skills =
        sectionEntries.length > 0
            ? sectionEntries
                  .filter((entry) => entry.visible !== false)
                  .map((entry) => entry.data || {})
            : data.skills;
    if (!skills || skills.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const sc = resolveSectionCustomization(sectionCust);
    const skillsLayout = sectionCust?.sectionSpecific?.layout || "rows";

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "skills", "Skills")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div
                className={
                    skillsLayout === "grid"
                        ? "grid grid-cols-2 gap-2"
                        : "space-y-1"
                }
            >
                {skills.map((skill, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        typeof skill === "object" ? skill : { name: skill },
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    const skillName =
                        typeof skill === "string"
                            ? ""
                            : skill.category || skill.name || skill.title || "";
                    const skillDescription =
                        typeof skill === "string"
                            ? skill
                            : Array.isArray(skill.skills)
                            ? skill.skills.join(", ")
                            : skill.description || "";
                    return (
                        <div
                            key={typeof skill === "object" ? (skill.category || skill.name || index) : index}
                            className={`text-sm ${ec.emphasisClass}`}
                            style={{
                                color: colors.text || "#102A43",
                            }}
                        >
                            {skillName && <strong>{skillName}: </strong>}
                            {skillDescription}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Projects Section */
export const renderProjects = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const projects = data.projects || data.project;
    if (!projects || projects.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "projects");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(
                    data,
                    ["projects", "project"],
                    "Projects",
                )}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {projects.map((proj, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        proj,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    if (ec.visibility === "hidden") return null;
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3
                                        className={ec.titleStyleClass}
                                        style={{
                                            color: ec.titleStyle === "accent" ? colors.accent : (colors.heading || "#17375F")
                                        }}
                                    >
                                        {proj.name}
                                    </h3>
                                    {proj.technologies && (
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color:
                                                    colors.accent || "#0353A4",
                                            }}
                                        >
                                            {proj.technologies}
                                        </p>
                                    )}
                                    <p
                                        className="mt-1"
                                        style={{
                                            color: colors.text || "#102A43",
                                        }}
                                    >
                                        {proj.description}
                                    </p>
                                    {proj.url && (
                                        <a
                                            href={proj.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm hover:underline"
                                            style={{
                                                color:
                                                    colors.accent || "#0353A4",
                                            }}
                                        >
                                            View Project
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Certificates Section */
export const renderCertificates = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const certificates = data.certificates;
    if (!certificates || certificates.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "certificates");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "certificates", "Certificates")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {certificates.map((cert, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        cert,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3
                                        className={ec.titleStyleClass}
                                        style={{
                                            color: colors.heading || "#17375F",
                                        }}
                                    >
                                        {cert.name}
                                    </h3>
                                    {cert.issuer && (
                                        <p
                                            className={ec.subtitleStyleClass}
                                            style={{
                                                color:
                                                    colors.muted || "#627D98",
                                            }}
                                        >
                                            {cert.issuer}
                                        </p>
                                    )}
                                </div>
                                {cert.date && (
                                    <p
                                        className={ec.dateStyleClass}
                                        style={{
                                            color: colors.muted || "#627D98",
                                        }}
                                    >
                                        {cert.date}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Courses Section */
export const renderCourses = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const courses = data.courses;
    if (!courses || courses.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "courses");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "courses", "Courses")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {courses.map((course, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        course,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3
                                        className={ec.titleStyleClass}
                                        style={{
                                            color: colors.heading || "#17375F",
                                        }}
                                    >
                                        {course.name}
                                    </h3>
                                    {course.field && (
                                        <p
                                            className={ec.subtitleStyleClass}
                                            style={{
                                                color:
                                                    colors.muted || "#627D98",
                                            }}
                                        >
                                            {course.field}
                                        </p>
                                    )}
                                </div>
                                {course.date && (
                                    <p
                                        className={ec.dateStyleClass}
                                        style={{
                                            color: colors.muted || "#627D98",
                                        }}
                                    >
                                        {course.date}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Awards Section */
export const renderAwards = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const awards = data.awards;
    if (!awards || awards.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "awards");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "awards", "Awards & Achievements")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {awards.map((award, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        award,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3
                                        className={ec.titleStyleClass}
                                        style={{
                                            color: colors.heading || "#17375F",
                                        }}
                                    >
                                        {award.name}
                                    </h3>
                                    {award.description && (
                                        <p
                                            className={ec.subtitleStyleClass}
                                            style={{
                                                color: colors.text || "#102A43",
                                            }}
                                        >
                                            {award.description}
                                        </p>
                                    )}
                                </div>
                                {award.year && (
                                    <p
                                        className={ec.dateStyleClass}
                                        style={{
                                            color: colors.muted || "#627D98",
                                        }}
                                    >
                                        {award.year}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Languages Section */
export const renderLanguages = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const languages = data.languages;
    if (!languages || languages.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "languages");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "languages", "Languages")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className="flex flex-wrap gap-4">
                {languages.map((lang, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        typeof lang === "object" ? lang : { language: lang },
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div key={index} className={ec.alignmentClass}>
                            <span
                                className={ec.titleStyleClass}
                                style={{ color: colors.text || "#102A43" }}
                            >
                                {typeof lang === "string"
                                    ? lang
                                    : lang.language}
                            </span>
                            {typeof lang === "object" && lang.proficiency && (
                                <span
                                    className={ec.subtitleStyleClass + " ml-2"}
                                    style={{ color: colors.muted || "#627D98" }}
                                >
                                    ({lang.proficiency})
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Interests Section */
export const renderInterests = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const interests = data.interests;
    if (!interests || interests.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "interests");
    const sc = resolveSectionCustomization(sectionCust);

    const interestNames = interests
        .map((i) => (typeof i === "string" ? i : i.name))
        .filter(Boolean);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "interests", "Interests")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className="flex flex-wrap gap-2">
                {interestNames.map((interest, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        { name: interest },
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <span
                            key={index}
                            className={`px-3 py-1 text-sm rounded-full ${ec.emphasisClass}`}
                            style={{
                                backgroundColor: colors.border
                                    ? `${colors.border}22`
                                    : "#90C2E722",
                                color: colors.text || "#102A43",
                            }}
                        >
                            {interest}
                        </span>
                    );
                })}
            </div>
        </section>
    );
};

/** Organisations Section */
export const renderOrganisations = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const organisations = data.organisations;
    if (!organisations || organisations.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "organisations");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "organisations", "Organisations")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {organisations.map((org, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        org,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3
                                        className={ec.titleStyleClass}
                                        style={{
                                            color: colors.heading || "#17375F",
                                        }}
                                    >
                                        {org.name}
                                    </h3>
                                    {org.role && (
                                        <p
                                            className={ec.subtitleStyleClass}
                                            style={{
                                                color: colors.text || "#102A43",
                                            }}
                                        >
                                            {org.role}
                                        </p>
                                    )}
                                </div>
                                {org.date && (
                                    <p
                                        className={ec.dateStyleClass}
                                        style={{
                                            color: colors.muted || "#627D98",
                                        }}
                                    >
                                        {org.date}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Publications Section */
export const renderPublications = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const publications = data.publications;
    if (!publications || publications.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "publications");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "publications", "Publications")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {publications.map((pub, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        pub,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <h3
                                className={ec.titleStyleClass}
                                style={{ color: colors.heading || "#17375F" }}
                            >
                                {pub.title}
                            </h3>
                            {pub.publisher && (
                                <p
                                    className={ec.subtitleStyleClass}
                                    style={{ color: colors.muted || "#627D98" }}
                                >
                                    {pub.publisher}
                                </p>
                            )}
                            {pub.date && (
                                <p
                                    className={ec.dateStyleClass}
                                    style={{ color: colors.muted || "#627D98" }}
                                >
                                    {pub.date}
                                </p>
                            )}
                            {pub.url && (
                                <a
                                    href={pub.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm hover:underline"
                                    style={{
                                        color: colors.accent || "#0353A4",
                                    }}
                                >
                                    View Publication
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** References Section */
export const renderReferences = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const references = data.references;
    if (!references || references.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "references");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "references", "References")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {references.map((ref, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        ref,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <h3
                                className={ec.titleStyleClass}
                                style={{ color: colors.heading || "#17375F" }}
                            >
                                {ref.name}
                            </h3>
                            {ref.title && (
                                <p
                                    className={ec.subtitleStyleClass}
                                    style={{ color: colors.text || "#102A43" }}
                                >
                                    {ref.title}
                                </p>
                            )}
                            {ref.company && (
                                <p
                                    className={ec.subtitleStyleClass}
                                    style={{ color: colors.text || "#102A43" }}
                                >
                                    {ref.company}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

/** Declaration Section */
export const renderDeclaration = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const declaration = data.declaration;
    if (!declaration || declaration.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "declaration");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "declaration", "Declaration")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {declaration.map((dec, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        dec,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    const text = dec.text || dec;
                    return (
                        <p
                            key={index}
                            className={ec.subtitleStyleClass}
                            style={{ color: colors.text || "#102A43" }}
                        >
                            {typeof text === "string"
                                ? text
                                : JSON.stringify(text)}
                        </p>
                    );
                })}
            </div>
        </section>
    );
};

/** Custom Sections */
export const renderCustomSections = (
    data,
    colors = {},
    typography = {},
    spacing = {},
) => {
    const custom = data.custom;
    if (!custom || custom.length === 0) return null;
    const sp = resolveSpacing(spacing);
    const { customization: sectionCust, entries: sectionEntries } =
        findSectionCustomization(data, "custom");
    const sc = resolveSectionCustomization(sectionCust);

    return (
        <section className={`${sp.sectionSpacingClass} ${sc.alignmentClass}`}>
            <SectionHeader
                title={getSectionTitle(data, "custom", "Custom Section")}
                colors={colors}
                typography={typography}
                sectionCustomization={sectionCust}
            />
            <div className={sp.entrySpacingClass}>
                {custom.map((c, index) => {
                    const entryCust = findEntryCustomization(
                        sectionEntries,
                        c,
                        index,
                    );
                    const ec = resolveEntryCustomization(entryCust);
                    return (
                        <div
                            key={index}
                            className={`${ec.spacingClass} ${ec.alignmentClass} ${ec.emphasisClass}`}
                        >
                            <h3
                                className={ec.titleStyleClass}
                                style={{ color: colors.heading || "#17375F" }}
                            >
                                {c.title}
                            </h3>
                            <p
                                className={ec.subtitleStyleClass}
                                style={{ color: colors.text || "#102A43" }}
                            >
                                {c.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export const SECTION_RENDER_MAP = {
    summary: renderSummary,
    experience: renderExperience,
    projects: renderProjects,
    education: renderEducation,
    skills: renderSkills,
    certificates: renderCertificates,
    courses: renderCourses,
    awards: renderAwards,
    languages: renderLanguages,
    interests: renderInterests,
    organisations: renderOrganisations,
    publications: renderPublications,
    references: renderReferences,
    declaration: renderDeclaration,
    custom: renderCustomSections,
};

