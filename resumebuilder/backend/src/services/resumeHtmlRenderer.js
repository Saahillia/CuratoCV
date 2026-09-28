/**
 * Developer context for resumebuilder/backend/src/services/resumeHtmlRenderer.js.
 *
 * Purpose: render one self-contained A4 HTML document for the resume PDF
 * download that reproduces what the Resume Preview shows — same effective
 * design values, same section order/visibility/titles, same content, same
 * typography/spacing/colors/header/photo/footer behaviour — while flowing as
 * fixed A4 pages with natural multi-page breaks.
 *
 * Why here: the download endpoint lives in the backend. The Resume Preview
 * (resumebuilder/frontend/src/components/ResumePreview.jsx and
 * components/templates/*) remains the reference implementation; it must not be
 * changed for this renderer's benefit.
 *
 * How parity is achieved (single source of truth, three layers):
 *
 *   1. resumeDesign.js — the ONE server-side model of effective design values
 *      (CSS variables, spacing, colors, layout, header/footer/photo/links) and
 *      of canonical section normalization. tests/unit/backend/services/
 *      resumeDesignParity.test.js imports the REAL preview resolvers and the
 *      real normalizePreviewData and fails if the model ever drifts.
 *
 *   2. This file — mirrors the preview's per-template JSX structure, expanded
 *      from Tailwind utility classes into the exact declarations the app's
 *      built stylesheet emits (values cited per helper). Structure and values
 *      match, so Chromium computes the same layout, including the same margin
 *      collapses the preview has.
 *
 *   3. ResumePreview's own <style> block is embedded VERBATIM (same
 *      `#resume-preview` id) so every CSS-variable-driven rule — heading/body
 *      font sizes, line heights, section spacing, header layouts, two-column
 *      classic, content width/alignment — resolves exactly as it does in the
 *      preview. tests/unit/backend/services/resumeHtmlRenderer.test.js reads
 *      ResumePreview.jsx and fails if that block changes without the PDF
 *      following.
 *
 * Documented PDF-only deltas (never visible in the preview, required for print):
 *   - `.resume-section` / `.resume-entry` marker classes plus
 *     `break-after: avoid` / `break-inside: avoid` rules. The preview keeps
 *     headings with their content using a JS pagination pass that cannot run
 *     in a Chromium print job, so CSS Fragmentation rules replace it here.
 *   - `.resume-a4-page` uses min-height instead of the preview's fixed
 *     height (the preview fixes height because it clones one div per page;
 *     the PDF flows continuously across pages).
 *   - href scheme allowlist (http/https/mailto/tel/relative) so untrusted
 *     stored URLs cannot emit javascript:/data: links into the document.
 *
 * Out of scope by contract: download wiring, pdfService.js, the API endpoint,
 * filename behaviour, window.print(), schema, auth, Customize UI, Preview UI.
 */

import {
    resolveResumeDesign,
    normalizeResumeData,
    resolveSectionCustomization,
    resolveEntryCustomization,
    findSection,
    findEntryCustomization,
    getSectionTitle,
    ENTRY_MARGIN_PX,
    ENTRY_SPACING_PX,
    SUPPLEMENTAL_SECTION_TYPES,
} from "./resumeDesign.js";

// ============================================================
// Escaping & style helpers
// ============================================================

/**
 * Escape text the way React's DOM serializer does (& < > " ') so printed
 * content is byte-identical to the preview's while remaining safe to embed.
 */
const esc = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/** Join non-empty style declarations into an inline style attribute body. */
const decl = (...parts) => parts.filter(Boolean).join(";");

/**
 * Allow only web-ish URL schemes in emitted hrefs. Relative URLs and
 * schemeless values pass through exactly as the preview would render them;
 * javascript:/data:/vbscript: (and any other registered scheme) collapse to
 * "#" so stored data can never inject an active URL into the document.
 */
const safeHref = (value) => {
    const url = String(value ?? "").trim();
    if (!url) return "#";
    if (/^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(url)) return url;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return url; // schemeless, e.g. example.com/cv
    return "#";
};

/** Absolute http(s) href used by linkedin/website fields (preview logic). */
const webHref = (value) => {
    const raw = String(value ?? "");
    return raw.startsWith("http") ? raw : `https://${raw}`;
};

// ============================================================
// Dates (verbatim mirrors)
// ============================================================

/** TemplateSections.jsx formatDate — YYYY-MM → "Jan 2020", else "". */
const formatDateSection = (dateStr) => {
    if (typeof dateStr !== "string" || !/^\d{4}-\d{2}$/.test(dateStr)) return "";
    const [year, month] = dateStr.split("-").map(Number);
    if (month < 1 || month > 12) return "";
    return new Date(year, month - 1).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
    });
};

/** utils/dateFormatting.js formatResumeDate — document.dateFormat aware. */
const formatResumeDate = (value, format = "MM/YYYY") => {
    if (typeof value !== "string") return "";
    const match = value.trim().match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
    if (!match) return "";

    const year = Number(match[1]);
    const month = Math.min(12, Math.max(1, Number(match[2] || 1)));
    const day = Math.min(31, Math.max(1, Number(match[3] || 1)));
    const paddedMonth = String(month).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");

    switch (format) {
        case "MMMM YYYY":
            return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
        case "DD/MM/YYYY": return `${paddedDay}/${paddedMonth}/${year}`;
        case "MM/DD/YYYY": return `${paddedMonth}/${paddedDay}/${year}`;
        case "YYYY-MM-DD": return `${year}-${paddedMonth}-${paddedDay}`;
        default: return `${paddedMonth}/${year}`;
    }
};

// ============================================================
// Icons (lucide-react 1.47.0 node data + the templates' LinkedIn glyph)
// ============================================================

const ICON_NODES = {
    mail: [
        ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
        ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }],
    ],
    phone: [
        ["path", { d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" }],
    ],
    "map-pin": [
        ["path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }],
        ["circle", { cx: "12", cy: "10", r: "3" }],
    ],
    globe: [
        ["circle", { cx: "12", cy: "12", r: "10" }],
        ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
        ["path", { d: "M2 12h20" }],
    ],
};

const LINKEDIN_PATH = "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM3.54 20.45H7.1V8.99H3.54v11.46Z";

const iconSvg = (name, size, inlineColor) => {
    const body = ICON_NODES[name]
        .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(" ")}/>`)
        .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${inlineColor ? ` style="color:${inlineColor}"` : ""}>${body}</svg>`;
};

const linkedinSvg = (size, inlineColor) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"${inlineColor ? ` style="color:${inlineColor}"` : ""}><path d="${LINKEDIN_PATH}"/></svg>`;

// ============================================================
// Tailwind utility values (from frontend/dist built stylesheet, v4)
//   --text-* / calc line heights / --spacing:.25rem / weights / tracking
// ============================================================

const PX_PER_REM = 16;

const TEXT_SIZE_PX = Object.freeze({
    xs: "12px",          // --text-xs: .75rem
    sm: "14px",          // --text-sm: .875rem
    base: "16px",        // --text-base: 1rem
    lg: "18px",          // --text-lg: 1.125rem
    xl: "20px",          // --text-xl: 1.25rem",
    "2xl": "24px",       // --text-2xl: 1.5rem
    "3xl": "30px",       // --text-3xl: 1.875rem
    "4xl": "36px",       // --text-4xl: 2.25rem
    "11px": "11px",      // text-[11px]
    "10px": "10px",      // text-[10px]
    "rem-0875": `${0.875 * PX_PER_REM}px`,
});

/** line-height values Tailwind emits alongside each text-* size. */
const TEXT_LINE_HEIGHT = Object.freeze({
    xs: 1 / 0.75,               // calc(1 / .75)
    sm: 1.25 / 0.875,           // calc(1.25 / .875)
    base: 1.5 / 1,              // calc(1.5 / 1)
    lg: 1.75 / 1.125,           // calc(1.75 / 1.125)
    xl: 1.75 / 1.25,            // calc(1.75 / 1.25)
    "2xl": 2 / 1.5,             // calc(2 / 1.5)
    "3xl": 2.25 / 1.875,        // calc(2.25 / 1.875)
    "4xl": 2.5 / 2.25,          // calc(2.5 / 2.25)
});

// ============================================================
// Section & entry customization → inline declarations
// (maps mirror frontend/src/utils/sectionCustomization.js class maps)
// ============================================================

/** HEADING_STYLE_MAP weights; standard/uppercase carry no weight class. */
const headingWeightDecl = (headingStyle) => {
    if (headingStyle === "bold") return "font-weight:700";       // font-bold
    if (headingStyle === "accent") return "font-weight:600";      // font-semibold
    if (headingStyle === "minimal") return "font-weight:400";     // font-normal
    return "";                                                    // standard / uppercase: inherit
};

/** ENTRY_SPACING_MAP margins (mb-2 / mb-4 / mb-6 → 8/16/24px). */
const entryWrapperDecl = (ec) =>
    decl(
        `margin-bottom:${ENTRY_MARGIN_PX[ec.spacing]}px`,
        `text-align:${ec.alignment}`,
        ec.emphasis === "subtle" ? "opacity:0.75" : "",   // opacity-75
        ec.emphasis === "strong" ? "font-weight:600" : "", // font-semibold
    );

/** TITLE_STYLE_MAP (font-medium / font-bold / uppercase tracking-wide / font-semibold). */
const titleStyleDecl = (ec) => {
    switch (ec.titleStyle) {
        case "bold": return "font-weight:700";
        case "uppercase": return "text-transform:uppercase;letter-spacing:0.025em";
        case "accent": return "font-weight:600";
        default: return "font-weight:500"; // normal → font-medium
    }
};

/** SUBTITLE_STYLE_MAP (font-normal / font-semibold / italic / font-medium). */
const subtitleStyleDecl = (ec) => {
    switch (ec.subtitleStyle) {
        case "bold": return "font-weight:600";
        case "italic": return "font-style:italic";
        case "accent": return "font-weight:500";
        default: return "font-weight:400"; // normal → font-normal
    }
};

/** DATE_STYLE_MAP — every variant includes text-sm (14px). */
const dateStyleDecl = (ec) => {
    const size = `font-size:${TEXT_SIZE_PX.sm}`;
    switch (ec.dateStyle) {
        case "bold": return `${size};font-weight:600`;
        case "accent": return `${size};font-weight:500`;
        default: return size; // normal / subtle carry no weight class
    }
};

/** Section-level text color from headingStyle (SectionHeader). */
const headingColor = (sc, colors) =>
    sc.headingStyle === "accent"
        ? colors.accent || "#0353A4"
        : sc.headingStyle === "minimal"
            ? colors.muted || "#627D98"
            : colors.heading || "#17375F";

/** Divider color from divider (SectionHeader). */
const dividerColor = (sc, colors) =>
    sc.divider === "accent" ? colors.accent || "#0353A4" : colors.border || "#90C2E7";

/**
 * SectionHeader.jsx → <h2>. Font size comes from the preview's own
 * `#resume-preview h2[class]` rule (= sectionHeadingSizePt × headingScale);
 * it is inlined with the same value for self-contained readability.
 * headingSize (small/large) only ever reached the inline fontSize the rule
 * overrides, so it intentionally has no effect here either.
 */
const sectionHeaderHtml = (title, sc, colors, sizes) => {
    // tracking-widest wins over tracking-wide in the built stylesheet (later
    // source order), so uppercase style resolves to 0.1em; others 0.025em.
    const transformDecl = sc.headingStyle === "uppercase"
        ? "text-transform:uppercase;letter-spacing:0.1em"
        : "letter-spacing:0.025em";
    // DIVIDER_MAP: line → border-b (1px) pb-2; accent → border-b-2 (2px) pb-2.
    const dividerDecl = sc.divider === "line"
        ? "border-bottom-style:solid;border-bottom-width:1px;padding-bottom:8px"
        : sc.divider === "accent"
            ? "border-bottom-style:solid;border-bottom-width:2px;padding-bottom:8px"
            : "";
    const text = sc.headingStyle === "uppercase" ? title.toUpperCase() : title;
    return `<h2 class="resume-section-title" style="${decl(
        `font-size:${sizes.sectionSizeCss}`,
        "line-height:1.2",
        `color:${headingColor(sc, colors)}`,
        `border-color:${dividerColor(sc, colors)}`,
        headingWeightDecl(sc.headingStyle),
        transformDecl,
        dividerDecl,
    )}">${esc(text)}</h2>`;
};

/** `<section class="resume-section">` shell used by all shared renderers. */
const sectionShell = (title, sc, colors, sizes, innerHtml) =>
    `<section class="resume-section" style="text-align:${sc.alignment}">${sectionHeaderHtml(title, sc, colors, sizes)}${innerHtml}</section>`;

/** Resolve section customization for a canonical type (findSectionCustomization). */
const sectionCustomizationFor = (data, sectionType) => {
    const section = findSection(data, sectionType);
    return resolveSectionCustomization(section?.customization);
};

const sectionEntriesFor = (data, sectionType) => findSection(data, sectionType)?.entries || [];

/** Entry container used by the shared renderers (preview: sp.entrySpacingClass).
 *  Its space-y margins are shadowed by each entry's own mb-* (see entryWrapperDecl),
 *  exactly as Tailwind's :where() specificity produces in the preview. */
const entryContainer = (html) => `<div>${html}</div>`;

// ============================================================
// Shared section renderers (mirror components/templates/TemplateSections.jsx)
// ============================================================

const renderSummarySection = (ctx) => {
    const { data, colors, sizes } = ctx;
    if (!data.professional_summary) return "";
    const sc = sectionCustomizationFor(data, "summary");
    return sectionShell(
        getSectionTitle(data, "summary", "Professional Summary"),
        sc, colors, sizes,
        // leading-relaxed is overridden by the preview's :is(p,...) line-height
        // rule; mt-2 = 8px; whitespace-pre-line preserved.
        `<p style="margin-top:8px;color:${colors.text || "#102A43"};white-space:pre-line">${esc(data.professional_summary)}</p>`,
    );
};

const renderExperienceSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const experience = data.experience;
    if (!experience || experience.length === 0) return "";
    const sc = sectionCustomizationFor(data, "experience");
    const sectionEntries = sectionEntriesFor(data, "experience");

    const items = experience.map((exp, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, exp, index));
        if (ec.visibility === "hidden") return "";
        const dateText = `${formatDateSection(exp.start_date)} - ${exp.is_current ? "Present" : formatDateSection(exp.end_date)}`;
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${ec.titleStyle === "accent" ? colors.accent : colors.heading || "#17375F"}`)}">${esc(exp.position)}</h3>
<p style="${decl(subtitleStyleDecl(ec), `color:${ec.subtitleStyle === "accent" ? colors.accent : colors.text || "#102A43"}`)}">${esc(exp.company)}</p>
${exp.location ? `<p style="font-size:${TEXT_SIZE_PX.sm};color:${colors.muted || "#627D98"}">${esc(exp.location)}</p>` : ""}
</div>
<div style="${decl(dateStyleDecl(ec), `color:${ec.dateStyle === "accent" ? colors.accent : colors.muted || "#627D98"}`)}"><p>${esc(dateText)}</p></div>
</div>
${exp.description ? `<div style="margin-top:4px;color:${colors.text || "#102A43"};white-space:pre-line">${esc(exp.description)}</div>` : ""}
</div>`;
    }).join("");

    return sectionShell(
        getSectionTitle(data, "experience", "Professional Experience"),
        sc, colors, sizes, entryContainer(items),
    );
};

const renderEducationSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const education = data.education;
    if (!education || education.length === 0) return "";
    const sc = sectionCustomizationFor(data, "education");
    const sectionEntries = sectionEntriesFor(data, "education");

    const items = education.map((edu, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, edu, index));
        if (ec.visibility === "hidden") return "";
        const degreeText = `${edu.degree} ${edu.field ? `in ${edu.field}` : ""}`;
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${ec.titleStyle === "accent" ? colors.accent : colors.heading || "#17375F"}`)}">${esc(degreeText)}</h3>
<p style="${decl(subtitleStyleDecl(ec), `color:${ec.subtitleStyle === "accent" ? colors.accent : colors.text || "#102A43"}`)}">${esc(edu.institution)}</p>
${edu.gpa ? `<p style="font-size:${TEXT_SIZE_PX.sm};color:${colors.muted || "#627D98"}">GPA: ${esc(edu.gpa)}</p>` : ""}
</div>
<div style="${decl(dateStyleDecl(ec), `color:${ec.dateStyle === "accent" ? colors.accent : colors.muted || "#627D98"}`)}"><p>${esc(formatDateSection(edu.graduation_date))}</p></div>
</div>
</div>`;
    }).join("");

    return sectionShell(
        getSectionTitle(data, "education", "Education"),
        sc, colors, sizes, entryContainer(items),
    );
};

const renderSkillsSection = (ctx) => {
    const { data, colors, sizes, spacing } = ctx;
    const section = findSection(data, "skills");
    const sectionCust = section?.customization || {};
    const sectionEntries = section?.entries || [];
    const skills = sectionEntries.length > 0
        ? sectionEntries.filter((entry) => entry.visible !== false).map((entry) => entry.data || {})
        : data.skills;
    if (!skills || skills.length === 0) return "";
    const sc = resolveSectionCustomization(sectionCust);
    const skillsLayout = sectionCust?.sectionSpecific?.layout || "rows";
    const isGrid = skillsLayout === "grid";

    const rows = skills.map((skill, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(
            sectionEntries,
            typeof skill === "object" ? skill : { name: skill },
            index,
        ));
        const skillName = typeof skill === "string" ? "" : skill.category || skill.name || skill.title || "";
        const skillDescription = typeof skill === "string"
            ? skill
            : Array.isArray(skill.skills)
                ? skill.skills.join(", ")
                : skill.description || "";
        // rows container is space-y-1 (4px between rows); grid uses gap-2.
        const marginBottom = !isGrid && index !== skills.length - 1 ? 4 : 0;
        return `<div class="resume-entry" style="${decl(
            `margin-bottom:${marginBottom}px`,
            `font-size:${TEXT_SIZE_PX.sm}`,
            `color:${colors.text || "#102A43"}`,
            ec.emphasis === "subtle" ? "opacity:0.75" : "",
            ec.emphasis === "strong" ? "font-weight:600" : "",
        )}">${skillName ? `<strong>${esc(skillName)}: </strong>` : ""}${esc(skillDescription)}</div>`;
    }).join("");

    const container = isGrid
        ? `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">${rows}</div>`
        : `<div>${rows}</div>`;

    return sectionShell(getSectionTitle(data, "skills", "Skills"), sc, colors, sizes, container);
};

const renderProjectsSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const projects = data.projects || data.project;
    if (!projects || projects.length === 0) return "";
    const sc = sectionCustomizationFor(data, "projects");
    const sectionEntries = sectionEntriesFor(data, "projects");

    const items = projects.map((proj, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, proj, index));
        if (ec.visibility === "hidden") return "";
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${ec.titleStyle === "accent" ? colors.accent : colors.heading || "#17375F"}`)}">${esc(proj.name)}</h3>
${proj.technologies ? `<p style="font-size:${TEXT_SIZE_PX.sm};font-weight:500;color:${colors.accent || "#0353A4"}">${esc(proj.technologies)}</p>` : ""}
<p style="margin-top:4px;color:${colors.text || "#102A43"}">${esc(proj.description)}</p>
${proj.url ? `<a href="${esc(safeHref(proj.url))}" target="_blank" rel="noopener noreferrer" style="font-size:${TEXT_SIZE_PX.sm};color:${colors.accent || "#0353A4"}">View Project</a>` : ""}
</div>
</div>
</div>`;
    }).join("");

    return sectionShell(
        getSectionTitle(data, "projects", "Projects"),
        sc, colors, sizes, entryContainer(items),
    );
};

/**
 * Generic list renderer shared by certificates / courses / awards /
 * organisations / publications / references / custom. Each case below mirrors
 * its own renderer function field-for-field (including which fields read the
 * section's subtitle/date styles and which color they use).
 */
const renderCertificatesSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const certificates = data.certificates;
    if (!certificates || certificates.length === 0) return "";
    const sc = sectionCustomizationFor(data, "certificates");
    const sectionEntries = sectionEntriesFor(data, "certificates");
    const items = certificates.map((cert, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, cert, index));
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${colors.heading || "#17375F"}`)}">${esc(cert.name)}</h3>
${cert.issuer ? `<p style="${decl(subtitleStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(cert.issuer)}</p>` : ""}
</div>
${cert.date ? `<p style="${decl(dateStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(cert.date)}</p>` : ""}
</div>
</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "certificates", "Certificates"), sc, colors, sizes, entryContainer(items));
};

const renderCoursesSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const courses = data.courses;
    if (!courses || courses.length === 0) return "";
    const sc = sectionCustomizationFor(data, "courses");
    const sectionEntries = sectionEntriesFor(data, "courses");
    const items = courses.map((course, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, course, index));
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${colors.heading || "#17375F"}`)}">${esc(course.name)}</h3>
${course.field ? `<p style="${decl(subtitleStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(course.field)}</p>` : ""}
</div>
${course.date ? `<p style="${decl(dateStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(course.date)}</p>` : ""}
</div>
</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "courses", "Courses"), sc, colors, sizes, entryContainer(items));
};

const renderAwardsSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const awards = data.awards;
    if (!awards || awards.length === 0) return "";
    const sc = sectionCustomizationFor(data, "awards");
    const sectionEntries = sectionEntriesFor(data, "awards");
    const items = awards.map((award, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, award, index));
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${colors.heading || "#17375F"}`)}">${esc(award.name)}</h3>
${award.description ? `<p style="${decl(subtitleStyleDecl(ec), `color:${colors.text || "#102A43"}`)}">${esc(award.description)}</p>` : ""}
</div>
${award.year ? `<p style="${decl(dateStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(award.year)}</p>` : ""}
</div>
</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "awards", "Awards & Achievements"), sc, colors, sizes, entryContainer(items));
};

const renderLanguagesSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const languages = data.languages;
    if (!languages || languages.length === 0) return "";
    const sc = sectionCustomizationFor(data, "languages");
    const sectionEntries = sectionEntriesFor(data, "languages");
    const items = languages.map((lang, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, typeof lang === "object" ? lang : { language: lang }, index));
        const label = typeof lang === "string" ? lang : lang.language;
        const proficiency = typeof lang === "object" && lang.proficiency;
        return `<div style="text-align:${ec.alignment}"><span style="${decl(titleStyleDecl(ec), `color:${colors.text || "#102A43"}`)}">${esc(label)}</span>${proficiency ? `<span style="${decl(subtitleStyleDecl(ec), "margin-left:8px", `color:${colors.muted || "#627D98"}`)}">(${esc(proficiency)})</span>` : ""}</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "languages", "Languages"), sc, colors, sizes, `<div style="display:flex;flex-wrap:wrap;gap:16px">${items}</div>`);
};

const renderInterestsSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const interests = data.interests;
    if (!interests || interests.length === 0) return "";
    const sc = sectionCustomizationFor(data, "interests");
    const sectionEntries = sectionEntriesFor(data, "interests");
    const interestNames = interests.map((i) => (typeof i === "string" ? i : i.name)).filter(Boolean);
    const items = interestNames.map((interest, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, { name: interest }, index));
        return `<span style="${decl(
            "padding:4px 12px",
            `font-size:${TEXT_SIZE_PX.sm}`,
            "border-radius:2147483647px", // rounded-full
            `background-color:${colors.border ? `${colors.border}22` : "#90C2E722"}`,
            `color:${colors.text || "#102A43"}`,
            ec.emphasis === "subtle" ? "opacity:0.75" : "",
            ec.emphasis === "strong" ? "font-weight:600" : "",
        )}">${esc(interest)}</span>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "interests", "Interests"), sc, colors, sizes, `<div style="display:flex;flex-wrap:wrap;gap:8px">${items}</div>`);
};

const renderOrganisationsSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const organisations = data.organisations;
    if (!organisations || organisations.length === 0) return "";
    const sc = sectionCustomizationFor(data, "organisations");
    const sectionEntries = sectionEntriesFor(data, "organisations");
    const items = organisations.map((org, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, org, index));
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${colors.heading || "#17375F"}`)}">${esc(org.name)}</h3>
${org.role ? `<p style="${decl(subtitleStyleDecl(ec), `color:${colors.text || "#102A43"}`)}">${esc(org.role)}</p>` : ""}
</div>
${org.date ? `<p style="${decl(dateStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(org.date)}</p>` : ""}
</div>
</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "organisations", "Organisations"), sc, colors, sizes, entryContainer(items));
};

const renderPublicationsSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const publications = data.publications;
    if (!publications || publications.length === 0) return "";
    const sc = sectionCustomizationFor(data, "publications");
    const sectionEntries = sectionEntriesFor(data, "publications");
    const items = publications.map((pub, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, pub, index));
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${colors.heading || "#17375F"}`)}">${esc(pub.title)}</h3>
${pub.publisher ? `<p style="${decl(subtitleStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(pub.publisher)}</p>` : ""}
${pub.date ? `<p style="${decl(dateStyleDecl(ec), `color:${colors.muted || "#627D98"}`)}">${esc(pub.date)}</p>` : ""}
${pub.url ? `<a href="${esc(safeHref(pub.url))}" target="_blank" rel="noopener noreferrer" style="font-size:${TEXT_SIZE_PX.sm};color:${colors.accent || "#0353A4"}">View Publication</a>` : ""}
</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "publications", "Publications"), sc, colors, sizes, entryContainer(items));
};

const renderReferencesSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const references = data.references;
    if (!references || references.length === 0) return "";
    const sc = sectionCustomizationFor(data, "references");
    const sectionEntries = sectionEntriesFor(data, "references");
    const items = references.map((ref, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, ref, index));
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${colors.heading || "#17375F"}`)}">${esc(ref.name)}</h3>
${ref.title ? `<p style="${decl(subtitleStyleDecl(ec), `color:${colors.text || "#102A43"}`)}">${esc(ref.title)}</p>` : ""}
${ref.company ? `<p style="${decl(subtitleStyleDecl(ec), `color:${colors.text || "#102A43"}`)}">${esc(ref.company)}</p>` : ""}
</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "references", "References"), sc, colors, sizes, entryContainer(items));
};

const renderDeclarationSection = (ctx) => {
    const { data, colors, sizes, spacing } = ctx;
    const declaration = data.declaration;
    if (!declaration || declaration.length === 0) return "";
    const sc = sectionCustomizationFor(data, "declaration");
    const sectionEntries = sectionEntriesFor(data, "declaration");
    // Declaration <p>s carry no margin class: the container's space-y-N spacing
    // applies (ENTRY_SPACING_PX between rows), exactly as in the preview.
    const items = declaration.map((dec, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, dec, index));
        const text = dec.text || dec;
        const marginBottom = index !== declaration.length - 1 ? spacing.entrySpacingPx : 0;
        return `<p class="resume-entry" style="${decl(`margin-bottom:${marginBottom}px`, subtitleStyleDecl(ec), `color:${colors.text || "#102A43"}`)}">${esc(typeof text === "string" ? text : JSON.stringify(text))}</p>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "declaration", "Declaration"), sc, colors, sizes, entryContainer(items));
};

const renderCustomSection = (ctx) => {
    const { data, colors, sizes } = ctx;
    const custom = data.custom;
    if (!custom || custom.length === 0) return "";
    const sc = sectionCustomizationFor(data, "custom");
    const sectionEntries = sectionEntriesFor(data, "custom");
    const items = custom.map((c, index) => {
        const ec = resolveEntryCustomization(findEntryCustomization(sectionEntries, c, index));
        return `<div class="resume-entry" style="${entryWrapperDecl(ec)}">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, titleStyleDecl(ec), `color:${colors.heading || "#17375F"}`)}">${esc(c.title)}</h3>
<p style="${decl(subtitleStyleDecl(ec), `color:${colors.text || "#102A43"}`)}">${esc(c.description)}</p>
</div>`;
    }).join("");
    return sectionShell(getSectionTitle(data, "custom", "Custom Section"), sc, colors, sizes, entryContainer(items));
};

/** Mirror of SECTION_RENDER_MAP: canonical type → renderer. */
const SECTION_RENDERERS = Object.freeze({
    summary: renderSummarySection,
    experience: renderExperienceSection,
    projects: renderProjectsSection,
    education: renderEducationSection,
    skills: renderSkillsSection,
    certificates: renderCertificatesSection,
    courses: renderCoursesSection,
    awards: renderAwardsSection,
    languages: renderLanguagesSection,
    interests: renderInterestsSection,
    organisations: renderOrganisationsSection,
    publications: renderPublicationsSection,
    references: renderReferencesSection,
    declaration: renderDeclarationSection,
    custom: renderCustomSection,
});

const renderSectionByType = (type, ctx) => SECTION_RENDERERS[type]?.(ctx) || "";

// ============================================================
// Template helpers (shared header/footer building blocks)
// ============================================================

/** Photo geometry mirrors each template's photoStyles object. */
const photoHtml = (imageSrc, ph, template, alt) => {
    const standard = ph.size === "small" ? "64px" : ph.size === "large" ? "128px" : "96px";
    const sidebar = ph.size === "small" ? "56px" : ph.size === "large" ? "110px" : "80px";
    const size = template === "minimal-image" ? sidebar : standard;
    const radius = ph.shape === "circle" ? "9999px" : ph.shape === "rounded" ? (template === "minimal-image" ? "10px" : "12px") : "0px";
    return `<img src="${esc(imageSrc)}" alt="${esc(alt)}" style="width:${size};height:${size};object-fit:${ph.fit};border-radius:${radius};flex-shrink:0"/>`;
};

/** Common flex row wrapper for classic/modern/minimal headers. */
const headerRow = (justifyDecl, flexDirection, inner) =>
    `<div style="display:flex;gap:24px;align-items:center;${justifyDecl}${flexDirection ? `;flex-direction:${flexDirection}` : ""}">${inner}</div>`;

const alignmentJustify = (alignment) =>
    alignment === "center" ? "justify-content:center" : alignment === "right" ? "justify-content:flex-end" : "justify-content:flex-start";

const alignmentText = (alignment) =>
    alignment === "center" ? "text-align:center" : alignment === "right" ? "text-align:right" : "text-align:left";

/** Link decoration: only `underline` style is printed; hover:underline is not. */
const linkDecorationDecl = (lnks) => (lnks.style === "underline" ? "text-decoration:underline" : "");

const linkTargetAttrs = (lnks) =>
    lnks.target === "same-tab"
        ? `target="_self"`
        : `target="_blank" rel="noopener noreferrer"`;

// ============================================================
// Templates (mirror components/templates/*.jsx)
// ============================================================

const renderClassicTemplate = (ctx) => {
    const { data, model, colors, spacing, sizes, document } = ctx;
    const hdr = model.header;
    const ftr = model.footer;
    const ph = ctx.photo;
    const lnks = model.links;
    const showPhoto = ph.visibility === "visible" && data.personal_info.image;
    const linkColor = lnks.style === "accent" ? colors.accent : colors.muted;
    const decoration = linkDecorationDecl(lnks);
    const targetAttrs = linkTargetAttrs(lnks);

    // Root: max-w-4xl/mx-auto are overridden by the preview's
    // `#resume-preview > div` rule; leading-relaxed is shadowed by the
    // :is(div) line-height rule. density → p-4/p-8/p-12 (16/32/48px).
    const rootStyle = decl(
        `padding:${spacing.densityPaddingPx}px`,
        `background-color:${colors.background}`,
        `color:${colors.text}`,
        "display:flex",
        "flex-direction:column",
    );

    const header = `<header style="${decl(
        "padding-bottom:24px",                                      // pb-6
        "border-bottom-style:solid;border-bottom-width:2px",        // border-b-2
        `border-color:${colors.border}`,
        // Classic header spacing uses the sectionSpacing enum in px
        // (mb-3/mb-6/mb-10 = 12/24/40px) — not the mm section rule,
        // because that rule targets <section> only.
        `margin-bottom:${spacing.sectionSpacingPx}px`,
        "order:0",
    )}">
${headerRow(alignmentJustify(hdr.alignment), ph.position === "right" && showPhoto ? "row-reverse" : "row", `${showPhoto ? photoHtml(data.personal_info.image, ph, "classic", "Profile") : ""}<div style="${alignmentText(hdr.alignment)}">
<h1 class="resume-name" style="${decl(`font-size:${sizes.nameSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["3xl"]}`, "font-weight:700", "margin-bottom:8px", `color:${colors.heading}`)}">${esc(data.personal_info.full_name || "Your Name")}</h1>
<div style="${decl("display:flex", "flex-wrap:wrap", alignmentJustify(hdr.alignment), "gap:16px", `font-size:${TEXT_SIZE_PX.sm}`, `color:${colors.muted}`)}">
${data.personal_info.email ? `<a href="mailto:${esc(data.personal_info.email)}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:4px", `color:${linkColor}`, decoration)}">${iconSvg("mail", 16, colors.accent)}<span>${esc(data.personal_info.email)}</span></a>` : ""}
${data.personal_info.phone ? `<div style="display:flex;align-items:center;gap:4px">${iconSvg("phone", 16, colors.accent)}<span>${esc(data.personal_info.phone)}</span></div>` : ""}
${data.personal_info.location ? `<div style="display:flex;align-items:center;gap:4px">${iconSvg("map-pin", 16, colors.accent)}<span>${esc(data.personal_info.location)}</span></div>` : ""}
${data.personal_info.linkedin ? `<a href="${esc(safeHref(webHref(data.personal_info.linkedin)))}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:4px", `color:${linkColor}`, decoration)}">${linkedinSvg(16)}<span style="word-break:break-all">${esc(data.personal_info.linkedin)}</span></a>` : ""}
${data.personal_info.website ? `<a href="${esc(safeHref(webHref(data.personal_info.website)))}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:4px", `color:${linkColor}`, decoration)}">${iconSvg("globe", 16)}<span style="word-break:break-all">${esc(data.personal_info.website)}</span></a>` : ""}
</div>
</div>`)}
</header>`;

    // Classic renders every visible section itself, in saved order.
    const sections = (data.sections || [])
        .filter((section) => section.visible !== false)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .map((section, index) => {
            const type = ({ professional_summary: "summary", experiences: "experience", educations: "education", project: "projects" })[section.type?.toLowerCase()] || section.type?.toLowerCase();
            const html = renderSectionByType(type, ctx);
            return html || null;
        })
        .filter(Boolean)
        .join("");

    const footer = ftr.visibility === "visible"
        ? `<footer style="${decl(
            "margin-top:32px",   // mt-8
            "padding-top:16px",  // pt-4
            "border-top-style:solid;border-top-width:1px",
            `border-color:${colors.border}`,
            `font-size:${TEXT_SIZE_PX.xs}`,
            `line-height:${TEXT_LINE_HEIGHT.xs}`,
            `color:${colors.muted}`,
            `text-align:${ftr.alignment}`,
            "order:1000",
        )}">Generated with CuratoCV</footer>`
        : "";

    return `<div style="${rootStyle}">${header}${sections}${footer}</div>`;
};

const renderModernTemplate = (ctx) => {
    const { data, model, colors, spacing, sizes, document } = ctx;
    const hdr = model.header;
    const ftr = model.footer;
    const ph = ctx.photo;
    const lnks = model.links;
    const showPhoto = ph.visibility === "visible" && data.personal_info.image;
    const linkColor = lnks.style === "accent" ? colors.accent : "#FFFFFF";
    const decoration = linkDecorationDecl(lnks);
    const targetAttrs = linkTargetAttrs(lnks);
    const formatDate = (value) => formatResumeDate(value, document?.dateFormat);

    const rootStyle = decl(
        `padding:${spacing.densityPaddingPx}px`,
        `background-color:${colors.background}`,
        `color:${colors.text}`,
    );

    const header = `<header style="padding:32px;background-color:${colors.heading};color:#FFFFFF">
${headerRow(alignmentJustify(hdr.alignment), ph.position === "right" && showPhoto ? "row-reverse" : "row", `${showPhoto ? photoHtml(data.personal_info.image, ph, "modern", "Profile") : ""}<div style="${alignmentText(hdr.alignment)}">
<h1 class="resume-name" style="${decl(`font-size:${sizes.nameSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["4xl"]}`, "font-weight:300", "margin-bottom:12px")}">${esc(data.personal_info.full_name || "Your Name")}</h1>
<div style="${decl("display:flex", "flex-wrap:wrap", alignmentJustify(hdr.alignment), "gap:16px", `font-size:${TEXT_SIZE_PX.sm}`)}">
${data.personal_info.email ? `<a href="mailto:${esc(data.personal_info.email)}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:8px", `color:${linkColor}`, decoration)}">${iconSvg("mail", 16)}<span>${esc(data.personal_info.email)}</span></a>` : ""}
${data.personal_info.phone ? `<div style="display:flex;align-items:center;gap:8px">${iconSvg("phone", 16)}<span>${esc(data.personal_info.phone)}</span></div>` : ""}
${data.personal_info.location ? `<div style="display:flex;align-items:center;gap:8px">${iconSvg("map-pin", 16)}<span>${esc(data.personal_info.location)}</span></div>` : ""}
${data.personal_info.linkedin ? `<a href="${esc(safeHref(webHref(data.personal_info.linkedin)))}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:8px", `color:${linkColor}`, decoration)}">${linkedinSvg(16)}<span style="word-break:break-all;font-size:${TEXT_SIZE_PX.xs}">${esc(stripWwwPrefix(data.personal_info.linkedin))}</span></a>` : ""}
${data.personal_info.website ? `<a href="${esc(safeHref(webHref(data.personal_info.website)))}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:8px", `color:${linkColor}`, decoration)}">${iconSvg("globe", 16)}<span style="word-break:break-all;font-size:${TEXT_SIZE_PX.xs}">${esc(stripHttpsPrefix(data.personal_info.website))}</span></a>` : ""}
</div>
</div>`)}
</header>`;

    const contentStyle = "padding:32px"; // p-8

    const summarySection = data.professional_summary
        ? `<section class="resume-section">
<h2 class="resume-template-heading" style="${decl(`font-size:${sizes.sectionSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["2xl"]}`, "font-weight:300", "margin-bottom:16px", "padding-bottom:8px", "border-bottom-style:solid;border-bottom-width:1px", `border-color:${colors.border}`, `color:${colors.heading}`)}">Professional Summary</h2>
<p style="color:${colors.text}">${esc(data.professional_summary)}</p>
</section>`
        : "";

    const experienceSection = data.experience && data.experience.length > 0
        ? `<section class="resume-section">
<h2 class="resume-template-heading" style="${decl(`font-size:${sizes.sectionSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["2xl"]}`, "font-weight:300", "margin-bottom:24px", "padding-bottom:8px", "border-bottom-style:solid;border-bottom-width:1px", `border-color:${colors.border}`, `color:${colors.heading}`)}">Experience</h2>
<div>${data.experience.map((exp) => `<div class="resume-entry" style="position:relative;padding-left:24px;border-left-style:solid;border-left-width:1px;border-color:${colors.border}">
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, `line-height:${TEXT_LINE_HEIGHT.xl}`, "font-weight:500", `color:${colors.heading}`)}">${esc(exp.position)}</h3>
<p style="font-weight:500;color:${colors.accent}">${esc(exp.company)}</p>
</div>
<div style="padding:4px 12px;border-radius:4px;font-size:${TEXT_SIZE_PX.sm};background-color:${colors.border}33;color:${colors.muted}">${esc(`${formatDate(exp.start_date)} - ${exp.is_current ? "Present" : formatDate(exp.end_date)}`)}</div>
</div>
${exp.description ? `<div style="margin-top:12px;color:${colors.text};white-space:pre-line">${esc(exp.description)}</div>` : ""}
</div>`).join("")}</div>
</section>`
        : "";

    const projectsSection = data.project && data.project.length > 0
        ? `<section class="resume-section">
<h2 class="resume-template-heading" style="${decl(`font-size:${sizes.sectionSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["2xl"]}`, "font-weight:300", "margin-bottom:16px", "padding-bottom:8px", "border-bottom-style:solid;border-bottom-width:1px", `border-color:${colors.border}`, `color:${colors.heading}`)}">Projects</h2>
<div>${data.project.map((project) => `<div class="resume-entry" style="position:relative;padding-left:24px;border-left-style:solid;border-left-width:3px;border-left-color:${colors.accent}">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, `line-height:${TEXT_LINE_HEIGHT.lg}`, "font-weight:500", `color:${colors.heading}`)}">${esc(project.name)}</h3>
</div>
</div>
${project.description ? `<div style="font-size:${TEXT_SIZE_PX.sm};margin-top:12px;color:${colors.text}">${esc(project.description)}</div>` : ""}
</div>`).join("")}</div>
</section>`
        : "";

    const gridStyle = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px"; // grid sm:grid-cols-2 gap-8

    const educationSection = data.education && data.education.length > 0
        ? `<section class="resume-section">
<h2 class="resume-template-heading" style="${decl(`font-size:${sizes.sectionSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["2xl"]}`, "font-weight:300", "margin-bottom:16px", "padding-bottom:8px", "border-bottom-style:solid;border-bottom-width:1px", `border-color:${colors.border}`, `color:${colors.heading}`)}">Education</h2>
<div>${data.education.map((edu) => `<div class="resume-entry">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, "font-weight:600", `color:${colors.heading}`)}">${esc(`${edu.degree} ${edu.field ? `in ${edu.field}` : ""}`)}</h3>
<p style="color:${colors.accent}">${esc(edu.institution)}</p>
<div style="display:flex;justify-content:space-between;align-items:center;font-size:${TEXT_SIZE_PX.sm};color:${colors.muted}"><span>${esc(formatDate(edu.graduation_date))}</span>${edu.gpa ? `<span>GPA: ${esc(edu.gpa)}</span>` : ""}</div>
</div>`).join("")}</div>
</section>`
        : "";

    const skillsSection = data.skills && data.skills.length > 0
        ? `<section class="resume-section">
<h2 class="resume-template-heading" style="${decl(`font-size:${sizes.sectionSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["2xl"]}`, "font-weight:300", "margin-bottom:16px", "padding-bottom:8px", "border-bottom-style:solid;border-bottom-width:1px", `border-color:${colors.border}`, `color:${colors.heading}`)}">Skills</h2>
<div style="display:flex;flex-wrap:wrap;gap:8px">${data.skills.map((skill) => `<span style="padding:4px 12px;font-size:${TEXT_SIZE_PX.sm};color:#FFFFFF;border-radius:2147483647px;background-color:${colors.accent}">${esc(skill)}</span>`).join("")}</div>
</section>`
        : "";

    const footer = ftr.visibility === "visible"
        ? `<footer style="${decl(
            "margin-top:32px", "padding-top:16px",
            "border-top-style:solid;border-top-width:1px",
            `border-color:${colors.border}`, `font-size:${TEXT_SIZE_PX.xs}`,
            `line-height:${TEXT_LINE_HEIGHT.xs}`, `color:${colors.muted}`,
            `text-align:${ftr.alignment}`,
        )}">Generated with CuratoCV</footer>`
        : "";

    return `<div style="${rootStyle}">${header}<div style="${contentStyle}">${summarySection}${experienceSection}${projectsSection}<div style="${gridStyle}">${educationSection}${skillsSection}</div>${footer}</div></div>`;
};

const renderMinimalTemplate = (ctx) => {
    const { data, model, colors, spacing, sizes, document } = ctx;
    const hdr = model.header;
    const ftr = model.footer;
    const ph = ctx.photo;
    const lnks = model.links;
    const showPhoto = ph.visibility === "visible" && data.personal_info.image;
    const linkColor = lnks.style === "accent" ? colors.accent : colors.muted;
    const decoration = linkDecorationDecl(lnks);
    const targetAttrs = linkTargetAttrs(lnks);
    const formatDate = (value) => formatResumeDate(value, document?.dateFormat);

    // Root carries font-light (300): every element without its own weight
    // class inherits it, exactly as in the preview.
    const rootStyle = decl(
        `padding:${spacing.densityPaddingPx}px`,
        `background-color:${colors.background}`,
        `color:${colors.text}`,
        "font-weight:300", // font-light
    );

    const header = `<header style="margin-bottom:40px;border-color:${colors.border}">
${headerRow(alignmentJustify(hdr.alignment), ph.position === "right" && showPhoto ? "row-reverse" : "row", `${showPhoto ? photoHtml(data.personal_info.image, ph, "minimal", "Profile") : ""}<div style="${alignmentText(hdr.alignment)}">
<h1 class="resume-name" style="${decl(`font-size:${sizes.nameSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["4xl"]}`, "font-weight:100", "margin-bottom:16px", "letter-spacing:0.025em", `color:${colors.heading}`)}">${esc(data.personal_info.full_name || "Your Name")}</h1>
<div style="${decl("display:flex", "flex-wrap:wrap", alignmentJustify(hdr.alignment), "gap:24px", `font-size:${TEXT_SIZE_PX.sm}`, `color:${colors.muted}`)}">
${data.personal_info.email ? `<a href="mailto:${esc(data.personal_info.email)}" ${targetAttrs} style="${decl(`color:${linkColor}`, decoration)}">${esc(data.personal_info.email)}</a>` : ""}
${data.personal_info.phone ? `<span>${esc(data.personal_info.phone)}</span>` : ""}
${data.personal_info.location ? `<span>${esc(data.personal_info.location)}</span>` : ""}
${data.personal_info.linkedin ? `<a href="${esc(safeHref(webHref(data.personal_info.linkedin)))}" ${targetAttrs} style="${decl("word-break:break-all", `color:${linkColor}`, decoration)}">${esc(data.personal_info.linkedin)}</a>` : ""}
${data.personal_info.website ? `<a href="${esc(safeHref(webHref(data.personal_info.website)))}" ${targetAttrs} style="${decl("word-break:break-all", `color:${linkColor}`, decoration)}">${esc(data.personal_info.website)}</a>` : ""}
</div>
</div>`)}
</header>`;

    const minimalHeading = (title) =>
        `<h2 class="resume-template-heading" style="${decl(`font-size:${sizes.sectionSizeCss}`, `line-height:${TEXT_LINE_HEIGHT.sm}`, "font-weight:500", "margin-bottom:24px", "text-transform:uppercase", "letter-spacing:0.1em", `color:${colors.heading}`)}">${esc(title)}</h2>`;

    const summarySection = data.professional_summary
        ? `<section class="resume-section"><p style="color:${colors.text}">${esc(data.professional_summary)}</p></section>`
        : "";

    const experienceSection = data.experience && data.experience.length > 0
        ? `<section class="resume-section">
${minimalHeading("Experience")}
<div>${data.experience.map((exp) => `<div class="resume-entry">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, `line-height:${TEXT_LINE_HEIGHT.lg}`, "font-weight:500", `color:${colors.heading}`)}">${esc(exp.position)}</h3>
<span style="font-size:${TEXT_SIZE_PX.sm};color:${colors.muted}">${esc(`${formatDate(exp.start_date)} - ${exp.is_current ? "Present" : formatDate(exp.end_date)}`)}</span>
</div>
<p style="margin-bottom:8px;color:${colors.accent}">${esc(exp.company)}</p>
${exp.description ? `<div style="color:${colors.text};white-space:pre-line">${esc(exp.description)}</div>` : ""}
</div>`).join("")}</div>
</section>`
        : "";

    // Literal heading text is "project" in the preview (uppercased by CSS).
    const projectsSection = data.project && data.project.length > 0
        ? `<section class="resume-section">
${minimalHeading("project")}
<div>${data.project.map((project) => `<div class="resume-entry" style="display:flex;flex-direction:column;gap:8px;justify-content:space-between;align-items:baseline">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, `line-height:${TEXT_LINE_HEIGHT.lg}`, "font-weight:500", `color:${colors.heading}`)}">${esc(project.name)}</h3>
<p style="color:${colors.muted}">${esc(project.description)}</p>
</div>`).join("")}</div>
</section>`
        : "";

    const educationSection = data.education && data.education.length > 0
        ? `<section class="resume-section">
${minimalHeading("Education")}
<div>${data.education.map((edu) => `<div class="resume-entry" style="display:flex;justify-content:space-between;align-items:baseline">
<div>
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, "font-weight:500", `color:${colors.heading}`)}">${esc(`${edu.degree} ${edu.field ? `in ${edu.field}` : ""}`)}</h3>
<p style="color:${colors.accent}">${esc(edu.institution)}</p>
${edu.gpa ? `<p style="font-size:${TEXT_SIZE_PX.sm};color:${colors.muted}">GPA: ${esc(edu.gpa)}</p>` : ""}
</div>
<span style="font-size:${TEXT_SIZE_PX.sm};color:${colors.muted}">${esc(formatDate(edu.graduation_date))}</span>
</div>`).join("")}</div>
</section>`
        : "";

    const skillsSection = data.skills && data.skills.length > 0
        ? `<section class="resume-section">
${minimalHeading("Skills")}
<div style="color:${colors.text}">${esc(data.skills.join(" • "))}</div>
</section>`
        : "";

    const footer = ftr.visibility === "visible"
        ? `<footer style="${decl(
            "margin-top:32px", "padding-top:16px",
            "border-top-style:solid;border-top-width:1px",
            `border-color:${colors.border}`, `font-size:${TEXT_SIZE_PX.xs}`,
            `line-height:${TEXT_LINE_HEIGHT.xs}`, `color:${colors.muted}`,
            `text-align:${ftr.alignment}`,
        )}">Generated with CuratoCV</footer>`
        : "";

    return `<div style="${rootStyle}">${header}${summarySection}${experienceSection}${projectsSection}${educationSection}${skillsSection}${footer}</div>`;
};

const renderMinimalImageTemplate = (ctx) => {
    const { data, model, colors, spacing, sizes, document } = ctx;
    const hdr = model.header;
    const ftr = model.footer;
    const ph = ctx.photo;
    const lnks = model.links;
    const showPhoto = ph.visibility === "visible" && data.personal_info.image;
    const linkColor = lnks.style === "accent" ? colors.accent : colors.muted;
    const decoration = linkDecorationDecl(lnks);
    const targetAttrs = linkTargetAttrs(lnks);
    const formatDate = (value) => formatResumeDate(value, document?.dateFormat);

    // Root: text-sm (14px base) + leading-normal (shadowed for divs by the
    // preview's :is(div) line-height rule, exactly as on screen).
    const rootStyle = decl(
        `padding:${spacing.densityPaddingPx}px`,
        `background-color:${colors.background}`,
        `color:${colors.text}`,
        `font-size:${TEXT_SIZE_PX.sm}`,
    );

    const headerJustify = hdr.alignment === "center"
        ? "justify-content:center;text-align:center"
        : hdr.alignment === "right"
            ? "justify-content:flex-end;text-align:right;flex-direction:row-reverse"
            : "justify-content:flex-start;text-align:left";
    const columnAlign = hdr.alignment === "center"
        ? "align-items:center;text-align:center"
        : hdr.alignment === "right"
            ? "align-items:flex-end;text-align:right"
            : "align-items:flex-start;text-align:left";

    const header = `<header style="${decl(
        "display:flex", "gap:24px", "padding-bottom:24px", "margin-bottom:24px",
        "border-bottom-style:solid;border-bottom-width:1px",
        `border-color:${colors.border}`, "align-items:center", headerJustify,
    )}">
${showPhoto ? photoHtml(data.personal_info.image, ph, "minimal-image", data.personal_info.full_name ? `${data.personal_info.full_name} profile` : "Profile") : ""}
<div style="${decl("display:flex", "flex-direction:column", columnAlign)}">
<h1 class="resume-name" style="${decl(`font-size:${sizes.nameSizeCss}`, `line-height:${TEXT_LINE_HEIGHT["3xl"]}`, "font-weight:700", "letter-spacing:0.05em", `color:${colors.heading}`)}">${esc(data.personal_info.full_name || "Your Name")}</h1>
<p style="text-transform:uppercase;font-weight:500;font-size:${TEXT_SIZE_PX.xs};letter-spacing:0.1em;margin-top:4px;color:${colors.accent}">${esc(data.personal_info.profession || "Profession")}</p>
</div>
</header>`;

    const sidebarHeading = (title, marginBottom) =>
        `<h2 class="resume-template-heading" style="${decl(`font-size:${sizes.sectionSizeCss}`, `line-height:${TEXT_LINE_HEIGHT.xs}`, "font-weight:700", `margin-bottom:${marginBottom}px`, "text-transform:uppercase", "letter-spacing:0.1em", `color:${colors.heading}`)}">${esc(title)}</h2>`;

    const mainHeading = (title, marginBottom) => sidebarHeading(title, marginBottom);

    const contact = (() => {
        // `space-y-2` on the preview's contact container gives every row but
        // the last an 8px bottom margin, so build the rows first.
        const rows = [];
        if (data.personal_info.phone) rows.push(`<div style="display:flex;align-items:center;gap:8px">${iconSvg("phone", 13, colors.accent)}<span>${esc(data.personal_info.phone)}</span></div>`);
        if (data.personal_info.email) rows.push(`<a href="mailto:${esc(data.personal_info.email)}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:8px", "word-break:break-all", `color:${linkColor}`, decoration)}">${iconSvg("mail", 13, colors.accent)}<span>${esc(data.personal_info.email)}</span></a>`);
        if (data.personal_info.location) rows.push(`<div style="display:flex;align-items:center;gap:8px">${iconSvg("map-pin", 13, colors.accent)}<span>${esc(data.personal_info.location)}</span></div>`);
        if (data.personal_info.linkedin) rows.push(`<a href="${esc(safeHref(webHref(data.personal_info.linkedin)))}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:8px", "word-break:break-all", `color:${linkColor}`, decoration)}">${linkedinSvg(14, colors.accent)}<span>${esc(stripSchemePrefix(data.personal_info.linkedin))}</span></a>`);
        if (data.personal_info.website) rows.push(`<a href="${esc(safeHref(webHref(data.personal_info.website)))}" ${targetAttrs} style="${decl("display:flex", "align-items:center", "gap:8px", "word-break:break-all", `color:${linkColor}`, decoration)}">${iconSvg("globe", 13, colors.accent)}<span>${esc(stripSchemePrefix(data.personal_info.website))}</span></a>`);
        const withMargins = rows.map((row, index) =>
            index === rows.length - 1 ? row : `<div style="margin-bottom:8px">${row}</div>`);
        return `<section class="resume-section">
${sidebarHeading("Contact", 12)}
<div style="font-size:${TEXT_SIZE_PX.xs};color:${colors.muted}">${withMargins.join("")}</div>
</section>`;
    })();

    const sidebarEducation = data.education && data.education.length > 0
        ? `<section class="resume-section">
${sidebarHeading("Education", 12)}
<div>${data.education.map((edu) => `<div class="resume-entry">
<p style="font-weight:600;font-size:${TEXT_SIZE_PX.xs};text-transform:uppercase;color:${colors.text}">${esc(`${edu.degree} ${edu.field ? `in ${edu.field}` : ""}`)}</p>
<p style="font-size:${TEXT_SIZE_PX.xs};color:${colors.accent}">${esc(edu.institution)}</p>
<p style="font-size:${TEXT_SIZE_PX["11px"]};color:${colors.muted}">${esc(formatDate(edu.graduation_date))}</p>
</div>`).join("")}</div>
</section>`
        : "";

    const sidebarSkills = data.skills && data.skills.length > 0
        ? `<section class="resume-section">
${sidebarHeading("Skills", 12)}
<ul style="font-size:${TEXT_SIZE_PX.xs};color:${colors.text}">${data.skills.map((skill, index) => `<li style="${decl("display:flex", "align-items:center", "gap:6px", `margin-bottom:${index !== data.skills.length - 1 ? 4 : 0}px`)}"><span style="width:4px;height:4px;border-radius:2147483647px;background-color:${colors.accent}"></span><span>${esc(skill)}</span></li>`).join("")}</ul>
</section>`
        : "";

    const aside = `<aside style="${decl(
        "grid-column:span 1/span 1",
        "border-right-style:solid;border-right-width:1px",
        "padding-right:16px",
        `border-color:${colors.border}`,
        // space-y-6 margins on its <section> children are overridden by the
        // preview's section { margin-bottom: var(--resume-section-space) } rule.
    )}">${contact}${sidebarEducation}${sidebarSkills}</aside>`;

    const summarySection = data.professional_summary
        ? `<section class="resume-section">
${mainHeading("Summary", 8)}
<p style="font-size:${TEXT_SIZE_PX.xs};color:${colors.text}">${esc(data.professional_summary)}</p>
</section>`
        : "";

    const descriptionList = (text, withLeading) =>
        `<ul style="${decl("list-style-type:disc", "list-style-position:inside", `font-size:${TEXT_SIZE_PX.xs}`, `color:${colors.text}`)}">${String(text).split("\n").map((line, i, arr) => `<li style="margin-bottom:${i !== arr.length - 1 ? 2 : 0}px">${esc(line)}</li>`).join("")}</ul>`;

    const experienceSection = data.experience && data.experience.length > 0
        ? `<section class="resume-section">
${mainHeading("Experience", 12)}
<div>${data.experience.map((exp) => `<div class="resume-entry">
<div style="display:flex;justify-content:space-between;align-items:baseline">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, `line-height:${TEXT_LINE_HEIGHT.xs}`, "font-weight:600", `color:${colors.text}`)}">${esc(exp.position)}</h3>
<span style="font-size:${TEXT_SIZE_PX["11px"]};color:${colors.muted}">${esc(`${formatDate(exp.start_date)} - ${exp.is_current ? "Present" : formatDate(exp.end_date)}`)}</span>
</div>
<p style="font-size:${TEXT_SIZE_PX.xs};margin-bottom:4px;font-weight:500;color:${colors.accent}">${esc(exp.company)}</p>
${exp.description ? descriptionList(exp.description) : ""}
</div>`).join("")}</div>
</section>`
        : "";

    const projectsSection = data.project && data.project.length > 0
        ? `<section class="resume-section">
${mainHeading("Projects", 12)}
<div>${data.project.map((project) => `<div class="resume-entry">
<h3 class="resume-entry-title" style="${decl(`font-size:${sizes.entrySizeCss}`, `line-height:${TEXT_LINE_HEIGHT.xs}`, "font-weight:600", `color:${colors.text}`)}">${esc(project.name)}</h3>
${project.description ? descriptionList(project.description) : ""}
</div>`).join("")}</div>
</section>`
        : "";

    const footer = ftr.visibility === "visible"
        ? `<footer style="${decl(
            "padding-top:16px",
            "border-top-style:solid;border-top-width:1px",
            `border-color:${colors.border}`, `font-size:${TEXT_SIZE_PX["10px"]}`,
            `color:${colors.muted}`, `text-align:${ftr.alignment}`,
        )}">Generated with CuratoCV</footer>`
        : "";

    const grid = `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px">${aside}<main>${summarySection}${experienceSection}${projectsSection}${footer}</main></div>`;

    return `<div style="${rootStyle}">${header}${grid}</div>`;
};

/** Modern strips "https://www." from the displayed linkedin label. */
const stripWwwPrefix = (value) => {
    const raw = String(value ?? "");
    const stripped = raw.split("https://www.")[1];
    return stripped ? stripped : raw;
};

/** ModernTemplate's website label: everything after the first "https://", else raw. */
const stripHttpsPrefix = (value) => {
    const raw = String(value ?? "");
    const stripped = raw.split("https://")[1];
    return stripped ? stripped : raw;
};

/** Minimal-Image strips the whole scheme from displayed link labels. */
const stripSchemePrefix = (value) => String(value ?? "").replace(/^https?:\/\/(www\.)?/, "");

// ============================================================
// Document assembly
// ============================================================

/**
 * Tailwind v4 preflight subset + the root-shell globals from
 * frontend/src/index.css that shape the preview's canvas. Only the rules that
 * affect resume rendering are carried over (the body::before/::after brand
 * glow, scroll behavior and motion overrides are app-shell concerns).
 */
const BASE_STYLE = `
*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5}
h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}
a{color:inherit;text-decoration:inherit}
b,strong{font-weight:bolder}
ol,ul,menu{list-style:none}
img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}
img,video{max-width:100%;height:auto}
*{font-family:"DM Sans",sans-serif}
body{margin:0;min-width:320px;background:#ffffff;color:#334155;position:relative}
`.trim();

/**
 * VERBATIM copy of the <style> block in ResumePreview.jsx (the
 * `#resume-preview` id is intentionally kept so every rule resolves exactly
 * as it does on screen). resumeHtmlRenderer.test.js compares this string with
 * the source file so the PDF cannot silently drift from the preview.
 */
const PREVIEW_STYLE = `
@page { size: A4; margin: 0; }
.resume-entry { break-inside: avoid; }
.resume-section { break-inside: auto; }
.resume-preview-measurement { position: absolute; left: -100000px; top: 0; visibility: hidden; pointer-events: none; }
.resume-preview-pages { display: flex; flex-direction: column; align-items: center; gap: 8mm; }
.resume-a4-page { flex: none; overflow: visible; }
#resume-preview { font-family: var(--resume-font-family); font-size: calc(var(--resume-body-size) * var(--resume-type-scale)); line-height: var(--resume-line-height); }
#resume-preview :is(h1, h2, h3, h4, p, span, a, li, div) { font-family: var(--resume-font-family); }
#resume-preview h1[class] { font-size: calc(var(--resume-name-size) * var(--resume-heading-scale)) !important; }
#resume-preview h2[class] { font-size: calc(var(--resume-section-size) * var(--resume-heading-scale)) !important; }
#resume-preview h3[class] { font-size: var(--resume-entry-size) !important; }
#resume-preview :is(p, li, span, a, div) { line-height: var(--resume-line-height); }
#resume-preview section { margin-bottom: var(--resume-section-space) !important; }
#resume-preview[data-header-layout="compact"] header { padding-top: 2mm !important; padding-bottom: 3mm !important; margin-bottom: 3mm !important; }
#resume-preview[data-header-layout="split"] header > div { justify-content: space-between !important; }
#resume-preview[data-columns="two"][data-template="classic"] > div { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 8mm; }
#resume-preview[data-columns="two"][data-template="classic"] > div > header,
#resume-preview[data-columns="two"][data-template="classic"] > div > footer { grid-column: 1 / -1; }
#resume-preview > div { width: 100% !important; max-width: var(--resume-content-width, 100%) !important; margin-left: auto !important; margin-right: auto !important; }
#resume-preview[data-page-width="compact"] { --resume-content-width: 650px; }
#resume-preview[data-page-width="standard"] { --resume-content-width: 100%; }
#resume-preview[data-page-width="wide"] { --resume-content-width: 100%; }
#resume-preview[data-page-alignment="left"] > div { margin-left: 0 !important; margin-right: auto !important; }
#resume-preview[data-page-alignment="right"] > div { margin-left: auto !important; margin-right: 0 !important; }
@media print {
    .resume-preview-measurement { display: none !important; }
    .resume-preview-pages { display: block; }
    .resume-a4-page { margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
    .resume-a4-page:last-child { break-after: auto; page-break-after: auto; }
}
`.trim();

/**
 * PDF-only pagination rules. The preview keeps each section heading with its
 * first entry via a JavaScript measurement pass that clones one div per A4
 * page; a print job has no such pass, so CSS Fragmentation rules reproduce the
 * same guarantees: headings never strand at a page bottom, entries never split
 * mid-entry when they fit on one page.
 */
const PAGINATION_STYLE = `
.resume-section > h2 { break-after: avoid; page-break-after: avoid; break-inside: avoid; page-break-inside: avoid; }
`.trim();

/** Embedded font face declarations — eliminates external Google Fonts dependency so PDF completes in <5s. */
const EMBEDDED_FONT_STYLE = `
@font-face { font-family: "DM Sans"; src: local("DM Sans"), local("DM Sans Regular"), local("DMSans-Regular"), local("DM-Sans-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "DM Sans"; src: local("DM Sans"), local("DM Sans Medium"), local("DMSans-Medium"), local("DM-Sans-Medium"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "DM Sans"; src: local("DM Sans"), local("DM Sans SemiBold"), local("DMSans-SemiBold"), local("DM-Sans-SemiBold"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "DM Sans"; src: local("DM Sans"), local("DM Sans Bold"), local("DMSans-Bold"), local("DM-Sans-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Inter"; src: local("Inter"), local("Inter Regular"), local("Inter-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Inter"; src: local("Inter"), local("Inter Medium"), local("Inter-Medium"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Inter"; src: local("Inter"), local("Inter SemiBold"), local("Inter-SemiBold"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Inter"; src: local("Inter"), local("Inter Bold"), local("Inter-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Roboto"; src: local("Roboto"), local("Roboto Regular"), local("Roboto-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Roboto"; src: local("Roboto"), local("Roboto Medium"), local("Roboto-Medium"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Roboto"; src: local("Roboto"), local("Roboto Bold"), local("Roboto-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Open Sans"; src: local("Open Sans"), local("Open Sans Regular"), local("OpenSans-Regular"), local("Open-Sans-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Open Sans"; src: local("Open Sans"), local("Open Sans Medium"), local("OpenSans-Medium"), local("Open-Sans-Medium"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Open Sans"; src: local("Open Sans"), local("Open Sans SemiBold"), local("OpenSans-SemiBold"), local("Open-Sans-SemiBold"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Open Sans"; src: local("Open Sans"), local("Open Sans Bold"), local("OpenSans-Bold"), local("Open-Sans-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Lato"; src: local("Lato"), local("Lato Regular"), local("Lato-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Lato"; src: local("Lato"), local("Lato Bold"), local("Lato-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Montserrat"; src: local("Montserrat"), local("Montserrat Regular"), local("Montserrat-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Montserrat"; src: local("Montserrat"), local("Montserrat Medium"), local("Montserrat-Medium"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Montserrat"; src: local("Montserrat"), local("Montserrat SemiBold"), local("Montserrat-SemiBold"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Montserrat"; src: local("Montserrat"), local("Montserrat Bold"), local("Montserrat-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Poppins"; src: local("Poppins"), local("Poppins Regular"), local("Poppins-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Poppins"; src: local("Poppins"), local("Poppins Medium"), local("Poppins-Medium"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Poppins"; src: local("Poppins"), local("Poppins SemiBold"), local("Poppins-SemiBold"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Poppins"; src: local("Poppins"), local("Poppins Bold"), local("Poppins-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Merriweather"; src: local("Merriweather"), local("Merriweather Regular"), local("Merriweather-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Merriweather"; src: local("Merriweather"), local("Merriweather Bold"), local("Merriweather-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Source Sans 3"; src: local("Source Sans 3"), local("Source Sans 3 Regular"), local("SourceSans3-Regular"), local("Source-Sans-3-Regular"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Source Sans 3"; src: local("Source Sans 3"), local("Source Sans 3 SemiBold"), local("SourceSans3-SemiBold"), local("Source-Sans-3-SemiBold"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Source Sans 3"; src: local("Source Sans 3"), local("Source Sans 3 Bold"), local("SourceSans3-Bold"), local("Source-Sans-3-Bold"); font-weight: 700; font-style: normal; font-display: swap; }
`.trim();

const cssVarStyle = (cssVars) =>
    Object.entries(cssVars)
        .map(([name, value]) => `${name}:${value}`)
        .join(";");

/**
 * Render a stored resume into a complete A4 HTML document.
 *
 * @param {Object} resumeData stored resume (e.g. resume.toObject())
 * @returns {string} standalone HTML for Chromium's PDF print
 */
export const renderResumeHtml = (resumeData = {}) => {
    const data = normalizeResumeData(resumeData);
    const design = data.design || {};
    const model = resolveResumeDesign(design);

    // ResumePreview receives `template` from its page: design.template with a
    // top-level fallback. The raw string keys data-template and the switch.
    const selectedTemplate = String(design?.template || resumeData.template || "classic");

    const ctx = {
        data,
        design,
        model,
        colors: model.colors,
        // Supplemental sections receive RAW design.colors in the preview
        // (renderers fall back to their own defaults for missing keys).
        rawColors: design.colors || {},
        spacing: model.spacing,
        sizes: model.typography,
        document: data.document || {},
        // Only Minimal-Image has a photo slot (ResumePreview commonProps).
        photo: {
            ...model.photo,
            visibility: selectedTemplate === "minimal-image" ? design.photo?.visibility : "hidden",
        },
    };

    const templateHtml =
        selectedTemplate === "modern" ? renderModernTemplate(ctx)
            : selectedTemplate === "classic" ? renderClassicTemplate(ctx)
                : selectedTemplate === "minimal" ? renderMinimalTemplate(ctx)
                    : selectedTemplate === "minimal-image" ? renderMinimalImageTemplate(ctx)
                        : renderClassicTemplate(ctx); // preview default case

    // Supplemental sections are appended as siblings AFTER the template body
    // for every non-classic template, in saved order, rendered with raw colors.
    const supplementalHtml = selectedTemplate === "classic"
        ? ""
        : (data.sections || [])
            .filter((section) => SUPPLEMENTAL_SECTION_TYPES.includes(section.type?.toLowerCase()))
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
            .map((section, index) => {
                const type = section.type?.toLowerCase();
                const html = renderSectionByType(type, { ...ctx, colors: ctx.rawColors });
                return html || null;
            })
            .filter(Boolean)
            .join("");

    const pageMarginMm = model.spacing.pageMarginMm;
    const attrs = model.attributes;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(data.title || "Resume")}</title>
<style>
${EMBEDDED_FONT_STYLE}
</style>
<style>
${BASE_STYLE}
</style>
<style>
${PREVIEW_STYLE}
</style>
<style>
${PAGINATION_STYLE}
</style>
</head>
<body>
<div class="resume-a4-page" style="width:210mm;min-height:297mm;box-sizing:border-box;padding:${pageMarginMm}mm;background:#ffffff">
<div id="resume-preview" data-page-width="${esc(attrs.pageWidth)}" data-page-alignment="${esc(attrs.pageAlignment)}" data-columns="${esc(attrs.columns)}" data-template="${esc(selectedTemplate)}" data-header-layout="${esc(attrs.headerLayout)}" style="${cssVarStyle(model.cssVars)}">
${templateHtml}
${supplementalHtml}
</div>
</div>
</body>
</html>`;
};

export default renderResumeHtml;
