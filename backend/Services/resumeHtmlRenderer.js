/* ============================================================
   Standalone A4 HTML Renderer — All 4 Templates (Classic / Modern / Minimal / Minimal-Image)
   Mirrors frontend templates with Tailwind CDN, inline SVG icons, Google Fonts.
   ============================================================ */

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const sanitize = (str) => (typeof str === "string" ? str.replace(/[<>]/g, "") : "");

const normalizeResumeForRendering = (data = {}) => {
  const rawPersonalInfo = data.personalInfo || data.personal_info || {};
  const photoValue = rawPersonalInfo.photo;
  const photoUrl = (() => {
    if (typeof photoValue === "string" && photoValue.trim()) return photoValue.trim();
    if (isPlainObject(photoValue)) return photoValue.url?.trim() || "";
    return "";
  })();
  const legacyImageUrl =
    (typeof rawPersonalInfo.image === "string" && rawPersonalInfo.image.trim()
      ? rawPersonalInfo.image.trim()
      : rawPersonalInfo.picture) || "";

  const personalInfo = {
    fullName: rawPersonalInfo.fullName || rawPersonalInfo.full_name || rawPersonalInfo.name || data.title || "Your Name",
    email: rawPersonalInfo.email || "",
    phone: rawPersonalInfo.phone || "",
    location: rawPersonalInfo.location || "",
    profession: rawPersonalInfo.profession || "",
    linkedin: rawPersonalInfo.linkedin || "",
    website: rawPersonalInfo.website || "",
    photoUrl: photoUrl || legacyImageUrl || "",
  };

  let summary = data.professional_summary || data.summary || "";
  let experience = Array.isArray(data.experience) ? [...data.experience] : [];
  let education = Array.isArray(data.education) ? [...data.education] : [];
  let projects = Array.isArray(data.projects) ? [...data.projects] : Array.isArray(data.project) ? [...data.project] : [];
  let skills = Array.isArray(data.skills) ? [...data.skills] : [];
  let certificates = Array.isArray(data.certificates) ? [...data.certificates] : [];
  let courses = Array.isArray(data.courses) ? [...data.courses] : [];
  let awards = Array.isArray(data.awards) ? [...data.awards] : [];
  let languages = Array.isArray(data.languages) ? [...data.languages] : [];
  let interests = Array.isArray(data.interests) ? [...data.interests] : [];
  let organisations = Array.isArray(data.organisations) ? [...data.organisations] : [];
  let publications = Array.isArray(data.publications) ? [...data.publications] : [];
  let references = Array.isArray(data.references) ? [...data.references] : [];
  let declaration = Array.isArray(data.declaration) ? [...data.declaration] : [];
  let custom = Array.isArray(data.custom) ? [...data.custom] : [];

  if (Array.isArray(data.sections) && data.sections.length > 0) {
    const activeSections = data.sections.filter((s) => s.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    activeSections.forEach((sec) => {
      const type = sec.type?.toLowerCase();
      const processedEntries = (sec.entries || []).filter((e) => e.visible !== false).map((e) => e.data || {});
      if (type === "summary" || type === "professional_summary") {
        if (!summary && processedEntries[0]?.description) summary = processedEntries[0].description;
      } else if (type === "experience" || type === "work") {
        const mapped = processedEntries.map((item) => ({
          company: item.company || "",
          position: item.position || item.title || item.jobTitle || "",
          start_date: item.startDate || item.start_date || "",
          end_date: item.endDate || item.end_date || "",
          description: item.description || "",
          isCurrent: Boolean(item.isCurrent || item.currentlyWorking),
          location: item.location || "",
        }));
        if (mapped.length > 0) experience = mapped;
      } else if (type === "education") {
        const mapped = processedEntries.map((item) => ({
          institution: item.institution || item.school || "",
          degree: item.degree || "",
          field: item.field || item.major || "",
          graduation_date: item.graduationDate || item.graduation_date || item.endDate || "",
          gpa: item.gpa || "",
        }));
        if (mapped.length > 0) education = mapped;
      } else if (type === "skills") {
        const mapped = processedEntries.map((item) =>
          typeof item === "string" ? item : item.name || item.skill || ""
        ).filter(Boolean);
        if (mapped.length > 0) skills = mapped;
      } else if (type === "projects") {
        const mapped = processedEntries.map((item) => ({
          name: item.name || item.title || "",
          description: item.description || "",
          url: item.url || item.link || "",
          technologies: item.technologies || item.techStack || "",
        }));
        if (mapped.length > 0) projects = mapped;
      } else if (type === "certificates") {
        certificates = processedEntries.map((item) => ({
          name: item.name || "",
          issuer: item.issuer || "",
          date: item.date || "",
        }));
      } else if (type === "courses") {
        courses = processedEntries.map((item) => ({
          name: item.name || "",
          field: item.field || "",
          date: item.date || "",
        }));
      } else if (type === "awards") {
        awards = processedEntries.map((item) => ({
          name: item.name || "",
          description: item.description || "",
          year: item.year || "",
        }));
      } else if (type === "languages") {
        languages = processedEntries.map((item) =>
          typeof item === "string" ? item : { language: item.language || item.name || "", proficiency: item.proficiency || "" }
        ).filter(Boolean);
      } else if (type === "interests") {
        interests = processedEntries.map((item) =>
          typeof item === "string" ? item : (item.name || item.interest || "")
        ).filter(Boolean);
      } else if (type === "organisations") {
        organisations = processedEntries.map((item) => ({
          name: item.name || "",
          role: item.role || "",
          date: item.date || "",
        }));
      } else if (type === "publications") {
        publications = processedEntries.map((item) => ({
          title: item.title || "",
          publisher: item.publisher || "",
          date: item.date || "",
          url: item.url || "",
        }));
      } else if (type === "references") {
        references = processedEntries.map((item) => ({
          name: item.name || "",
          title: item.title || "",
          company: item.company || "",
        }));
      } else if (type === "declaration") {
        declaration = processedEntries.map((item) => item.text || item.description || "");
      } else if (type === "custom") {
        custom = processedEntries.map((item) => ({
          title: item.title || "",
          description: item.description || "",
        }));
      }
    });
  }

  return {
    title: data.title || "Resume",
    personalInfo,
    summary,
    experience,
    education,
    projects,
    skills,
    certificates,
    courses,
    awards,
    languages,
    interests,
    organisations,
    publications,
    references,
    declaration,
    custom,
    design: data.design || {},
  };
};

const ICONS = {
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM3.54 20.45H7.1V8.99H3.54v11.46Z"/></svg>`,
};

const getTemplateName = (design = {}) => {
  const t = (design.template || design.layout?.template || "").toLowerCase();
  if (t === "modern") return "modern";
  if (t === "minimal") return "minimal";
  if (t === "minimal-image") return "minimal-image";
  return "classic";
};

const resolveColors = (design = {}) => {
  const c = design.colors || {};
  return {
    heading: c.heading || "#17375F",
    accent: c.accent || "#0353A4",
    text: c.text || "#102A43",
    muted: c.muted || "#627D98",
    background: c.background || "#FFFFFF",
    border: c.border || "#90C2E7",
  };
};

const resolveTypographyInline = (design = {}) => {
  const t = design.typography || {};
  const familyMap = {
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    inter: "'Inter', system-ui, sans-serif",
    roboto: "'Roboto', system-ui, sans-serif",
    "open-sans": "'Open Sans', system-ui, sans-serif",
    lato: "'Lato', system-ui, sans-serif",
    montserrat: "'Montserrat', system-ui, sans-serif",
    poppins: "'Poppins', system-ui, sans-serif",
    merriweather: "'Merriweather', Georgia, serif",
    "source-sans-3": "'Source Sans 3', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
  };
  const sizeMap = { small: "13px", normal: "15px", large: "17px" };
  const headingMap = { small: 1.3, normal: 1.5, large: 1.8 };
  const lineMap = { tight: 1.3, normal: 1.5, relaxed: 1.7 };
  return {
    fontFamily: familyMap[t.fontFamily] || familyMap.inter,
    fontSize: sizeMap[t.fontSizeScale] || sizeMap.normal,
    headingScale: headingMap[t.headingScale] || headingMap.normal,
    lineHeight: lineMap[t.lineHeight] || lineMap.normal,
  };
};

const resolveLayoutInline = (design = {}) => {
  const l = design.layout || {};
  const columns = l.columns || "single";
  const ratio = l.columnRatio || "50-50";
  return { columns };
};

const resolveSpacingInline = (design = {}) => {
  const s = design.spacing || {};
  const density = s.density || "normal";
  const sectionSpacing = s.sectionSpacing || "normal";
  const sectionClass = sectionSpacing === "tight" ? "mb-3" : sectionSpacing === "spacious" ? "mb-10" : "mb-6";
  return { sectionClass };
};

const resolveHeaderInline = (design = {}) => {
  const h = design.header || {};
  return { alignment: h.alignment || "left", visibility: h.visibility || "visible" };
};

const resolveFooterInline = (design = {}) => {
  const f = design.footer || {};
  return {
    alignment: f.alignment || "center",
    visibility: f.visibility || "hidden",
  };
};

const resolvePhotoInline = (design = {}) => {
  const p = design.photo || {};
  return { visibility: p.visibility || "hidden", shape: p.shape || "circle", size: p.size || "medium", fit: p.fit || "cover" };
};

const resolveLinksInline = (design = {}) => {
  const l = design.links || {};
  return { style: l.style || "accent", target: l.target || "new-tab" };
};

const renderSectionHeader = (title, colors, typography) => {
  const color = colors.heading || "#17375F";
  return `<h2 style="color:${color};font-family:${typography.fontFamily};font-size:1.125rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;border-bottom:1.5px solid ${colors.border || "#90C2E7"};padding-bottom:4px;margin-bottom:8px;line-height:1.2;">${sanitize(title)}</h2>`;
};

const renderSummaryHTML = (data, colors, typography, spacing) => {
  if (!data.summary) return "";
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("PROFESSIONAL SUMMARY", colors, typography)}<p style="font-family:${typography.fontFamily};font-size:${typography.fontSize};line-height:${typography.lineHeight};color:${colors.text || "#102A43"};margin-top:4px;">${sanitize(data.summary)}</p></section>`;
};

const renderExperienceHTML = (data, colors, typography, spacing) => {
  if (!data.experience || data.experience.length === 0) return "";
  const accent = colors.accent || "#0353A4";
  const textColor = colors.text || "#102A43";
  const mutedColor = colors.muted || "#627D98";
  const entries = data.experience.map((e) => {
    const company = sanitize(e.company || "");
    const position = sanitize(e.position || e.title || "");
    const start = sanitize(e.start_date || e.startDate || "");
    const end = sanitize(e.end_date || e.endDate || "");
    const desc = sanitize(e.description || "");
    const current = e.isCurrent || e.currentlyWorking;
    const period = [start, current ? "Present" : end].filter(Boolean).join(" – ");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:10px;"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:14px;color:${accent};line-height:1.2;">${company}</h3><span style="font-family:monospace;font-size:10px;color:${mutedColor};white-space:nowrap;">${sanitize(period)}</span></div><p style="font-family:${typography.fontFamily};font-size:12px;font-weight:600;color:${textColor};font-style:italic;margin-top:2px;">${position}</p>${desc ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${textColor};opacity:0.85;margin-top:3px;line-height:1.45;">${desc}</p>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("PROFESSIONAL EXPERIENCE", colors, typography)}${entries}</section>`;
};

const renderEducationHTML = (data, colors, typography, spacing) => {
  if (!data.education || data.education.length === 0) return "";
  const accent = colors.accent || "#0353A4";
  const textColor = colors.text || "#102A43";
  const mutedColor = colors.muted || "#627D98";
  const entries = data.education.map((e) => {
    const institution = sanitize(e.institution || e.school || "");
    const degree = sanitize(e.degree || "");
    const field = sanitize(e.field || e.major || "");
    const grad = sanitize(e.graduation_date || e.graduationDate || e.endDate || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${accent};line-height:1.2;">${institution}</h3><span style="font-family:monospace;font-size:10px;color:${mutedColor};white-space:nowrap;">${grad}</span></div><p style="font-family:${typography.fontFamily};font-size:11.5px;color:${textColor};">${degree}${field ? `, ${field}` : ""}</p></div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("EDUCATION", colors, typography)}${entries}</section>`;
};

const renderSkillsHTML = (data, colors, typography, spacing) => {
  const skills = Array.isArray(data.skills) ? data.skills : [];
  if (skills.length === 0) return "";
  const tags = skills.filter(Boolean).map((s) => {
    const text = sanitize(typeof s === "string" ? s : s.name || s.skill || "");
    return `<span style="font-family:${typography.fontFamily};font-size:11px;color:${colors.text || "#102A43"};background:${colors.background || "#fff"};padding:3px 8px;border-radius:4px;border:1px solid ${colors.border || "#90C2E7"};">${text}</span>`;
  }).join(" ");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("SKILLS", colors, typography)}<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">${tags}</div></section>`;
};

const renderProjectsHTML = (data, colors, typography, spacing) => {
  if (!data.projects || data.projects.length === 0) return "";
  const accent = colors.accent || "#0353A4";
  const textColor = colors.text || "#102A43";
  const entries = data.projects.map((p) => {
    const pname = sanitize(p.name || p.title || "");
    const pdesc = sanitize(p.description || "");
    const purl = sanitize(p.url || p.link || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${accent};">${pname}</h3>${pdesc ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${textColor};opacity:0.85;line-height:1.45;margin-top:2px;">${pdesc}</p>` : ""}${purl ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${accent};text-decoration:underline;margin-top:2px;">${purl}</p>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("PROJECTS", colors, typography)}${entries}</section>`;
};

const renderCertificatesHTML = (data, colors, typography, spacing) => {
  if (!data.certificates || data.certificates.length === 0) return "";
  const mutedColor = colors.muted || "#627D98";
  const entries = data.certificates.map((c) => {
    const name = sanitize(c.name || "");
    const issuer = sanitize(c.issuer || "");
    const date = sanitize(c.date || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${colors.heading || "#17375F"};line-height:1.2;">${name}</h3>${date ? `<span style="font-family:monospace;font-size:10px;color:${mutedColor};white-space:nowrap;">${date}</span>` : ""}</div>${issuer ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${mutedColor};">${issuer}</p>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("CERTIFICATES", colors, typography)}${entries}</section>`;
};

const renderCoursesHTML = (data, colors, typography, spacing) => {
  if (!data.courses || data.courses.length === 0) return "";
  const mutedColor = colors.muted || "#627D98";
  const entries = data.courses.map((c) => {
    const name = sanitize(c.name || "");
    const field = sanitize(c.field || "");
    const date = sanitize(c.date || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${colors.heading || "#17375F"};line-height:1.2;">${name}</h3>${date ? `<span style="font-family:monospace;font-size:10px;color:${mutedColor};white-space:nowrap;">${date}</span>` : ""}</div>${field ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${mutedColor};">${field}</p>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("COURSES", colors, typography)}${entries}</section>`;
};

const renderAwardsHTML = (data, colors, typography, spacing) => {
  if (!data.awards || data.awards.length === 0) return "";
  const mutedColor = colors.muted || "#627D98";
  const textColor = colors.text || "#102A43";
  const entries = data.awards.map((a) => {
    const name = sanitize(a.name || "");
    const desc = sanitize(a.description || "");
    const year = sanitize(a.year || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${colors.heading || "#17375F"};line-height:1.2;">${name}</h3>${year ? `<span style="font-family:monospace;font-size:10px;color:${mutedColor};white-space:nowrap;">${year}</span>` : ""}</div>${desc ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${textColor};line-height:1.45;margin-top:2px;">${desc}</p>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("AWARDS", colors, typography)}${entries}</section>`;
};

const renderLanguagesHTML = (data, colors, typography, spacing) => {
  if (!data.languages || data.languages.length === 0) return "";
  const items = data.languages.map((l) => {
    const lang = sanitize(typeof l === "string" ? l : (l.language || l.name || ""));
    const prof = sanitize(typeof l === "object" && l.proficiency ? l.proficiency : "");
    return `<div style="font-family:${typography.fontFamily};font-size:11.5px;color:${colors.text || "#102A43"};margin-right:12px;">${lang}${prof ? ` <span style="color:${colors.muted || "#627D98"};">(${prof})</span>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("LANGUAGES", colors, typography)}<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">${items}</div></section>`;
};

const renderInterestsHTML = (data, colors, typography, spacing) => {
  if (!data.interests || data.interests.length === 0) return "";
  const tags = data.interests.map((i) => {
    const text = sanitize(typeof i === "string" ? i : (i.name || ""));
    return `<span style="font-family:${typography.fontFamily};font-size:11px;color:${colors.text || "#102A43"};background:${colors.border ? colors.border + "22" : "#90C2E722"};padding:3px 10px;border-radius:9999px;">${text}</span>`;
  }).join(" ");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("INTERESTS", colors, typography)}<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">${tags}</div></section>`;
};

const renderOrganisationsHTML = (data, colors, typography, spacing) => {
  if (!data.organisations || data.organisations.length === 0) return "";
  const mutedColor = colors.muted || "#627D98";
  const entries = data.organisations.map((o) => {
    const name = sanitize(o.name || "");
    const role = sanitize(o.role || "");
    const date = sanitize(o.date || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${colors.heading || "#17375F"};line-height:1.2;">${name}</h3>${date ? `<span style="font-family:monospace;font-size:10px;color:${mutedColor};white-space:nowrap;">${date}</span>` : ""}</div>${role ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${mutedColor};">${role}</p>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("ORGANISATIONS", colors, typography)}${entries}</section>`;
};

const renderPublicationsHTML = (data, colors, typography, spacing) => {
  if (!data.publications || data.publications.length === 0) return "";
  const mutedColor = colors.muted || "#627D98";
  const entries = data.publications.map((p) => {
    const title = sanitize(p.title || "");
    const publisher = sanitize(p.publisher || "");
    const date = sanitize(p.date || "");
    const url = sanitize(p.url || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${colors.heading || "#17375F"};line-height:1.2;">${title}</h3>${publisher ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${mutedColor};">${publisher}</p>` : ""}${date ? `<p style="font-family:${typography.fontFamily};font-size:10px;color:${mutedColor};">${date}</p>` : ""}${url ? `<a href="${url}" style="font-family:${typography.fontFamily};font-size:11px;color:${colors.accent || "#0353A4"};text-decoration:underline;">View Publication</a>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("PUBLICATIONS", colors, typography)}${entries}</section>`;
};

const renderReferencesHTML = (data, colors, typography, spacing) => {
  if (!data.references || data.references.length === 0) return "";
  const mutedColor = colors.muted || "#627D98";
  const textColor = colors.text || "#102A43";
  const entries = data.references.map((r) => {
    const name = sanitize(r.name || "");
    const title = sanitize(r.title || "");
    const company = sanitize(r.company || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${colors.heading || "#17375F"};line-height:1.2;">${name}</h3>${title ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${textColor};">${title}</p>` : ""}${company ? `<p style="font-family:${typography.fontFamily};font-size:11px;color:${mutedColor};">${company}</p>` : ""}</div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("REFERENCES", colors, typography)}${entries}</section>`;
};

const renderDeclarationHTML = (data, colors, typography, spacing) => {
  if (!data.declaration || data.declaration.length === 0) return "";
  const items = data.declaration.map((d) => `<p style="font-family:${typography.fontFamily};font-size:11px;color:${colors.text || "#102A43"};line-height:1.45;">${sanitize(typeof d === "string" ? d : (d.text || d.description || ""))}</p>`).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("DECLARATION", colors, typography)}${items}</section>`;
};

const renderCustomSectionsHTML = (data, colors, typography, spacing) => {
  if (!data.custom || data.custom.length === 0) return "";
  const textColor = colors.text || "#102A43";
  const entries = data.custom.map((c) => {
    const title = sanitize(c.title || "");
    const desc = sanitize(c.description || "");
    return `<div class="resume-entry" style="break-inside:avoid;margin-bottom:6px;"><h3 style="font-family:${typography.fontFamily};font-weight:700;font-size:13px;color:${colors.heading || "#17375F"};line-height:1.2;">${title}</h3><p style="font-family:${typography.fontFamily};font-size:11px;color:${textColor};opacity:0.85;line-height:1.45;margin-top:2px;">${desc}</p></div>`;
  }).join("");
  return `<section class="resume-section ${spacing.sectionClass}" style="margin-top:4px;">${renderSectionHeader("CUSTOM SECTION", colors, typography)}${entries}</section>`;
};

const getRenderer = (type) => {
  const map = {
    summary: renderSummaryHTML,
    experience: renderExperienceHTML,
    projects: renderProjectsHTML,
    education: renderEducationHTML,
    skills: renderSkillsHTML,
    certificates: renderCertificatesHTML,
    courses: renderCoursesHTML,
    awards: renderAwardsHTML,
    languages: renderLanguagesHTML,
    interests: renderInterestsHTML,
    organisations: renderOrganisationsHTML,
    publications: renderPublicationsHTML,
    references: renderReferencesHTML,
    declaration: renderDeclarationHTML,
    custom: renderCustomSectionsHTML
  };
  return map[type] || null;
};

const renderClassicTemplate = (data, design, typography) => {
  const colors = resolveColors(design);
  const spac = resolveSpacingInline(design);
  const hdr = resolveHeaderInline(design);
  const ftr = resolveFooterInline(design);
  const pho = resolvePhotoInline(design);
  const lnks = resolveLinksInline(design);
  const bg = colors.background || "#FFFFFF";
  const headingColor = colors.heading || "#17375F";
  const textColor = colors.text || "#102A43";
  const mutedColor = colors.muted || "#627D98";
  const borderColor = colors.border || "#90C2E7";
  const accent = colors.accent || "#0353A4";

  const linkTarget = lnks.target === "same-tab" ? "_self" : "_blank";
  const linkStyle = lnks.style === "underline" ? "underline" : lnks.style === "accent" ? `color:${accent}` : "";

  const photoBlock = pho.visibility === "visible" && data.personalInfo?.photoUrl ? `<div style="margin-bottom:12px;display:flex;justify-content:${hdr.alignment === "center" ? "center" : hdr.alignment === "right" ? "flex-end" : "flex-start"};"><img src="${sanitize(data.personalInfo.photoUrl)}" alt="Profile" style="width:72px;height:72px;border-radius:9999px;object-fit:${pho.fit || "cover"};border:3px solid ${accent};box-shadow:0 1px 4px rgba(0,0,0,0.08);" /></div>` : "";

  const headerContact = [
    data.personalInfo?.email ? `<a href="mailto:${sanitize(data.personalInfo.email)}" target="${linkTarget}" style="color:${mutedColor};text-decoration:none;${linkStyle};display:inline-flex;align-items:center;gap:4px;font-size:11px;">${ICONS.mail}<span>${sanitize(data.personalInfo.email)}</span></a>` : "",
    data.personalInfo?.phone ? `<span style="color:${mutedColor};font-size:11px;display:inline-flex;align-items:center;gap:4px;">${ICONS.phone}<span>${sanitize(data.personalInfo.phone)}</span></span>` : "",
    data.personalInfo?.location ? `<span style="color:${mutedColor};font-size:11px;display:inline-flex;align-items:center;gap:4px;">${ICONS.location}<span>${sanitize(data.personalInfo.location)}</span></span>` : "",
    data.personalInfo?.linkedin ? `<a href="https://${sanitize(data.personalInfo.linkedin).replace(/^https?:\/\//, "")}" target="${linkTarget}" style="color:${mutedColor};text-decoration:none;${linkStyle};font-size:11px;display:inline-flex;align-items:center;gap:4px;">${ICONS.linkedin}<span>${sanitize(data.personalInfo.linkedin.replace(/^https?:\/\//, ""))}</span></a>` : "",
    data.personalInfo?.website ? `<a href="${sanitize(data.personalInfo.website)}" target="${linkTarget}" style="color:${mutedColor};text-decoration:none;${linkStyle};font-size:11px;display:inline-flex;align-items:center;gap:4px;">${ICONS.globe}<span>${sanitize(data.personalInfo.website.replace(/^https?:\/\//, ""))}</span></a>` : "",
  ].filter(Boolean).join(`<span style="margin:0 6px;color:${borderColor};">|</span>`);

  const sections = (data.sections && Array.isArray(data.sections)
    ? data.sections.filter(s => s.visible !== false).map(s => {
        const renderer = getRenderer(s.type);
        return renderer ? renderer(data, colors, typography, spac) : "";
      })
    : [
        renderSummaryHTML(data, colors, typography, spac),
        renderExperienceHTML(data, colors, typography, spac),
        renderProjectsHTML(data, colors, typography, spac),
        renderEducationHTML(data, colors, typography, spac),
        renderSkillsHTML(data, colors, typography, spac),
        renderCertificatesHTML(data, colors, typography, spac),
        renderCoursesHTML(data, colors, typography, spac),
        renderAwardsHTML(data, colors, typography, spac),
        renderLanguagesHTML(data, colors, typography, spac),
        renderInterestsHTML(data, colors, typography, spac),
        renderOrganisationsHTML(data, colors, typography, spac),
        renderPublicationsHTML(data, colors, typography, spac),
        renderReferencesHTML(data, colors, typography, spac),
        renderDeclarationHTML(data, colors, typography, spac),
        renderCustomSectionsHTML(data, colors, typography, spac),
      ]).filter(Boolean).join("\n");

  return `<div style="background-color:${bg};color:${textColor};font-family:${typography.fontFamily};font-size:${typography.fontSize};line-height:${typography.lineHeight};width:210mm;min-height:297mm;padding:0;box-sizing:border-box;">
<header style="border-bottom:2.5px solid ${borderColor};padding-bottom:10px;margin-bottom:14px;text-align:${hdr.alignment};">
  ${photoBlock}
  <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:${Math.round(28 * typography.headingScale)}px;color:${headingColor};letter-spacing:-0.03em;line-height:1.1;margin:0;">${sanitize(data.personalInfo?.fullName || "Your Name")}</h1>
  ${data.personalInfo?.profession ? `<p style="font-size:14px;color:${accent};font-weight:500;margin:4px 0 8px;">${sanitize(data.personalInfo.profession)}</p>` : ""}
  <div style="display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:${hdr.alignment === "center" ? "center" : hdr.alignment === "right" ? "flex-end" : "flex-start"};font-size:10.5px;color:${mutedColor};line-height:1.4;">${headerContact}</div>
</header>
${sections}
${ftr.visibility === "visible" ? `<footer style="margin-top:12px;padding-top:6px;border-top:1px solid ${borderColor};text-align:${ftr.alignment};font-size:10px;color:${mutedColor};">Generated with CuratoCV</footer>` : ""}
</div>`;
};

const renderModernTemplate = (data, design, typography) => {
  const colors = resolveColors(design);
  const spac = resolveSpacingInline(design);
  const hdr = resolveHeaderInline(design);
  const ftr = resolveFooterInline(design);
  const pho = resolvePhotoInline(design);
  const lnks = resolveLinksInline(design);
  const layout = resolveLayoutInline(design);
  const bg = colors.background || "#FFFFFF";
  const headerBg = colors.heading || "#17375F";
  const textColor = colors.text || "#102A43";
  const mutedColor = colors.muted || "#627D98";
  const linkTarget = lnks.target === "same-tab" ? "_self" : "_blank";

  const photoBlock = pho.visibility === "visible" && data.personalInfo?.photoUrl ? `<img src="${sanitize(data.personalInfo.photoUrl)}" alt="Profile" style="width:80px;height:80px;border-radius:9999px;object-fit:${pho.fit || "cover"};border:2px solid rgba(255,255,255,0.2);box-shadow:0 4px 6px rgba(0,0,0,0.15);flex-shrink:0;" />` : "";

  const headerContacts = [
    data.personalInfo?.email ? `<a href="mailto:${sanitize(data.personalInfo.email)}" target="${linkTarget}" style="color:rgba(255,255,255,0.9);text-decoration:none;font-size:13px;display:inline-flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;display:inline-block;">${ICONS.mail}</span><span>${sanitize(data.personalInfo.email)}</span></a>` : "",
    data.personalInfo?.phone ? `<span style="color:rgba(255,255,255,0.9);font-size:13px;display:inline-flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;display:inline-block;">${ICONS.phone}</span><span>${sanitize(data.personalInfo.phone)}</span></span>` : "",
    data.personalInfo?.location ? `<span style="color:rgba(255,255,255,0.9);font-size:13px;display:inline-flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;display:inline-block;">${ICONS.location}</span><span>${sanitize(data.personalInfo.location)}</span></span>` : "",
    data.personalInfo?.linkedin ? `<a href="https://${sanitize(data.personalInfo.linkedin).replace(/^https?:\/\//, "")}" target="${linkTarget}" style="color:rgba(255,255,255,0.9);text-decoration:none;font-size:13px;display:inline-flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;display:inline-block;">${ICONS.linkedin}</span><span>${sanitize(data.personalInfo.linkedin.replace(/^https?:\/\//, "").split("linkedin.com/")[1] || sanitize(data.personalInfo.linkedin.replace(/^https?:\/\//, "")))}</span></a>` : "",
    data.personalInfo?.website ? `<a href="${sanitize(data.personalInfo.website)}" target="${linkTarget}" style="color:rgba(255,255,255,0.9);text-decoration:none;font-size:13px;display:inline-flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;display:inline-block;">${ICONS.globe}</span><span>${sanitize(data.personalInfo.website.replace(/^https?:\/\//, ""))}</span></a>` : "",
  ].filter(Boolean).join(`<span style="margin:0 8px;color:rgba(255,255,255,0.3);">·</span>`);

  const sections = [
    renderSummaryHTML(data, colors, typography, spac),
    renderExperienceHTML(data, colors, typography, spac),
    renderProjectsHTML(data, colors, typography, spac),
    layout.columns === "two" ? `<div style="display:grid;gap:24px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);">${renderEducationHTML(data, colors, typography, spac)}${renderSkillsHTML(data, colors, typography, spac)}</div>` : (renderEducationHTML(data, colors, typography, spac) + renderSkillsHTML(data, colors, typography, spac)),
    renderCertificatesHTML(data, colors, typography, spac),
    renderCoursesHTML(data, colors, typography, spac),
    renderAwardsHTML(data, colors, typography, spac),
    renderLanguagesHTML(data, colors, typography, spac),
    renderInterestsHTML(data, colors, typography, spac),
    renderOrganisationsHTML(data, colors, typography, spac),
    renderPublicationsHTML(data, colors, typography, spac),
    renderReferencesHTML(data, colors, typography, spac),
    renderDeclarationHTML(data, colors, typography, spac),
    renderCustomSectionsHTML(data, colors, typography, spac),
  ].filter(Boolean).join("\n");

  return `<div style="background-color:${bg};color:${textColor};font-family:${typography.fontFamily};font-size:${typography.fontSize};line-height:${typography.lineHeight};width:210mm;min-height:297mm;padding:0;box-sizing:border-box;">
<header style="background-color:${headerBg};color:#fff;padding:18px 14mm;display:flex;flex-direction:${hdr.alignment === 'center' ? 'column' : hdr.alignment === 'right' ? 'row-reverse' : 'row'};align-items:${hdr.alignment === 'center' ? 'center' : 'center'};text-align:${hdr.alignment};gap:16px;">
  ${photoBlock}
  <div style="flex:1;min-width:0;">
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:${Math.round(32 * typography.headingScale)}px;font-weight:300;margin:0 0 6px;letter-spacing:-0.02em;line-height:1.05;">${sanitize(data.personalInfo?.fullName || "Your Name")}</h1>
    ${data.personalInfo?.profession ? `<p style="font-size:15px;font-weight:500;opacity:0.9;margin:0 0 8px;">${sanitize(data.personalInfo.profession)}</p>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:${hdr.alignment === 'center' ? 'center' : hdr.alignment === 'right' ? 'flex-end' : 'flex-start'};font-size:12px;opacity:0.9;">${headerContacts}</div>
  </div>
</header>
<div style="padding:10mm 12mm 10mm;">
  ${sections}
</div>
${ftr.visibility === "visible" ? `<div style="padding:8mm 12mm;border-top:1px solid ${colors.border || '#e2e8f0'};text-align:${ftr.alignment};font-size:10px;color:${mutedColor};">Generated with CuratoCV</div>` : ""}
</div>`;
};

const renderMinimalTemplate = (data, design, typography) => {
  const colors = resolveColors(design);
  const spac = resolveSpacingInline(design);
  const hdr = resolveHeaderInline(design);
  const ftr = resolveFooterInline(design);
  const pho = resolvePhotoInline(design);
  const lnks = resolveLinksInline(design);
  const layout = resolveLayoutInline(design);
  const bg = colors.background || "#FFFFFF";
  const headingColor = colors.heading || "#17375F";
  const accent = colors.accent || "#0353A4";
  const textColor = colors.text || "#102A43";
  const mutedColor = colors.muted || "#627D98";
  const linkTarget = lnks.target === "same-tab" ? "_self" : "_blank";
  const linkStyle = lnks.style === "underline" ? "underline" : "";

  const photoBlock = pho.visibility === "visible" && data.personalInfo?.photoUrl ? `<img src="${sanitize(data.personalInfo.photoUrl)}" alt="Profile" style="width:72px;height:72px;border-radius:${pho.shape === "circle" ? "9999px" : pho.shape === "square" ? "0" : "0.5rem"};object-fit:${pho.fit || "cover"};box-shadow:0 1px 4px rgba(0,0,0,0.08);flex-shrink:0;" />` : "";

  const headerContact = [
    data.personalInfo?.email ? `<a href="mailto:${sanitize(data.personalInfo.email)}" target="${linkTarget}" style="color:${mutedColor};text-decoration:${linkStyle};font-size:11px;">${sanitize(data.personalInfo.email)}</a>` : "",
    data.personalInfo?.phone ? `<span style="color:${mutedColor};font-size:11px;">${sanitize(data.personalInfo.phone)}</span>` : "",
    data.personalInfo?.location ? `<span style="color:${mutedColor};font-size:11px;">${sanitize(data.personalInfo.location)}</span>` : "",
    data.personalInfo?.linkedin ? `<a href="https://${sanitize(data.personalInfo.linkedin).replace(/^https?:\/\//, "")}" target="${linkTarget}" style="color:${mutedColor};text-decoration:${linkStyle};font-size:11px;word-break:break-all;">${sanitize(data.personalInfo.linkedin.replace(/^https?:\/\//, ""))}</a>` : "",
    data.personalInfo?.website ? `<a href="${sanitize(data.personalInfo.website)}" target="${linkTarget}" style="color:${mutedColor};text-decoration:${linkStyle};font-size:11px;word-break:break-all;">${sanitize(data.personalInfo.website.replace(/^https?:\/\//, ""))}</a>` : "",
  ].filter(Boolean).join(`<span style="margin:0 8px;color:${colors.border || '#e2e8f0'};">·</span>`);

  const leftCol = [renderSummaryHTML(data, colors, typography, spac), renderExperienceHTML(data, colors, typography, spac), renderProjectsHTML(data, colors, typography, spac)].filter(Boolean).join("\n");
  const rightCol = [renderEducationHTML(data, colors, typography, spac), renderSkillsHTML(data, colors, typography, spac), renderCertificatesHTML(data, colors, typography, spac), renderCoursesHTML(data, colors, typography, spac), renderAwardsHTML(data, colors, typography, spac), renderLanguagesHTML(data, colors, typography, spac), renderInterestsHTML(data, colors, typography, spac), renderOrganisationsHTML(data, colors, typography, spac), renderPublicationsHTML(data, colors, typography, spac), renderReferencesHTML(data, colors, typography, spac), renderDeclarationHTML(data, colors, typography, spac), renderCustomSectionsHTML(data, colors, typography, spac)].filter(Boolean).join("\n");

  const bodyContent = layout.columns === "two" ? `<div style="display:grid;gap:24px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);">${leftCol ? `<div>${leftCol}</div>` : ""}${rightCol ? `<div>${rightCol}</div>` : ""}</div>` : (leftCol + rightCol);

  return `<div style="background-color:${bg};color:${textColor};font-family:${typography.fontFamily};font-weight:300;font-size:${typography.fontSize};line-height:${typography.lineHeight};width:210mm;min-height:297mm;padding:0;box-sizing:border-box;">
<header style="display:flex;flex-direction:${hdr.alignment === 'center' ? 'column' : hdr.alignment === 'right' ? 'row-reverse' : 'row'};gap:20px;align-items:${hdr.alignment === 'center' ? 'center' : 'center'};text-align:${hdr.alignment};margin-bottom:14px;">
  ${photoBlock}
  <div style="min-width:0;${hdr.alignment === 'center' ? 'display:flex;flex-direction:column;align-items:center;' : ''}">
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:300;font-size:${Math.round(36 * typography.headingScale)}px;color:${headingColor};letter-spacing:0.05em;margin:0 0 4px;line-height:1.05;">${sanitize(data.personalInfo?.fullName || "Your Name")}</h1>
    ${data.personalInfo?.profession ? `<p style="font-size:14px;font-weight:500;color:${accent};margin:0 0 8px;">${sanitize(data.personalInfo.profession)}</p>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:${hdr.alignment === 'center' ? 'center' : hdr.alignment === 'right' ? 'flex-end' : 'flex-start'};font-size:10.5px;color:${mutedColor};line-height:1.4;">${headerContact}</div>
  </div>
</header>
${bodyContent}
${ftr.visibility === "visible" ? `<footer style="margin-top:10mm;padding-top:4mm;border-top:1px solid ${colors.border || '#f1f5f9'};text-align:${ftr.alignment};font-size:10px;color:${mutedColor};">Generated with CuratoCV</footer>` : ""}
</div>`;
};

const renderMinimalImageTemplate = (data, design, typography) => {
  const colors = resolveColors(design);
  const spac = resolveSpacingInline(design);
  const hdr = resolveHeaderInline(design);
  const ftr = resolveFooterInline(design);
  const pho = resolvePhotoInline(design);
  const lnks = resolveLinksInline(design);
  const bg = colors.background || "#FFFFFF";
  const headingColor = colors.heading || "#17375F";
  const accent = colors.accent || "#0353A4";
  const textColor = colors.text || "#102A43";
  const mutedColor = colors.muted || "#627D98";
  const borderColor = colors.border || "#90C2E7";
  const linkTarget = lnks.target === "same-tab" ? "_self" : "_blank";

  const isImage = !!(data.personalInfo?.photoUrl && typeof data.personalInfo.photoUrl === "string" && data.personalInfo.photoUrl.trim().length > 0);
  const photoShape = pho.shape === "square" ? "rounded-none" : pho.shape === "rounded" ? "rounded-lg" : "rounded-full";

  return `<div style="background-color:${bg};color:${textColor};font-family:${typography.fontFamily};font-size:${typography.fontSize};line-height:${typography.lineHeight};width:210mm;min-height:297mm;padding:0;box-sizing:border-box;">
<div style="display:grid;grid-template-columns:1fr 2fr;min-height:297mm;">
  <div style="padding:10mm 6mm 10mm 10mm;">
    ${isImage ? `<div style="margin-bottom:12mm;"><img src="${sanitize(data.personalInfo.photoUrl)}" alt="Profile" style="width:100%;max-width:120px;height:auto;aspect-ratio:1/1;object-fit:${pho.fit || "contain"};border-radius:${photoShape === "rounded-full" ? "9999px" : photoShape === "rounded-lg" ? "0.5rem" : "0"};display:block;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,0.08);" /></div>` : ""}
    <aside style="padding-top:6mm;">
      <section style="margin-bottom:8mm;">
        <h2 style="color:${headingColor};font-family:${typography.fontFamily};font-size:0.875rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6mm;">CONTACT</h2>
        <div style="font-size:11.5px;color:${mutedColor};line-height:1.6;">
          ${data.personalInfo?.phone ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><span style="color:${accent};width:14px;display:inline-block;">${ICONS.phone}</span><span>${sanitize(data.personalInfo.phone)}</span></div>` : ""}
          ${data.personalInfo?.email ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><span style="color:${accent};width:14px;display:inline-block;">${ICONS.mail}</span><a href="mailto:${sanitize(data.personalInfo.email)}" target="${linkTarget}" style="color:${mutedColor};text-decoration:none;word-break:break-all;">${sanitize(data.personalInfo.email)}</a></div>` : ""}
          ${data.personalInfo?.location ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><span style="color:${accent};width:14px;display:inline-block;">${ICONS.location}</span><span>${sanitize(data.personalInfo.location)}</span></div>` : ""}
        </div>
      </section>
      ${renderEducationHTML(data, colors, typography, spac)}
      ${renderSkillsHTML(data, colors, typography, spac)}
    </aside>
  </div>
  <div style="padding:10mm 10mm 10mm 6mm;border-left:1.5px solid ${borderColor};text-align:${hdr.alignment};">
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:${Math.round(36 * typography.headingScale)}px;color:${headingColor};letter-spacing:0.08em;margin:0 0 4mm;line-height:1.05;">${sanitize(data.personalInfo?.fullName || "Your Name")}</h1>
    <p style="font-size:13px;font-weight:500;color:${accent};text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8mm;">${sanitize(data.personalInfo?.profession || "Profession")}</p>
    ${renderSummaryHTML(data, colors, typography, spac)}
    ${renderExperienceHTML(data, colors, typography, spac)}
    ${renderProjectsHTML(data, colors, typography, spac)}
    ${renderCertificatesHTML(data, colors, typography, spac)}
    ${renderCoursesHTML(data, colors, typography, spac)}
    ${renderAwardsHTML(data, colors, typography, spac)}
    ${renderLanguagesHTML(data, colors, typography, spac)}
    ${renderInterestsHTML(data, colors, typography, spac)}
    ${renderOrganisationsHTML(data, colors, typography, spac)}
    ${renderPublicationsHTML(data, colors, typography, spac)}
    ${renderReferencesHTML(data, colors, typography, spac)}
    ${renderDeclarationHTML(data, colors, typography, spac)}
    ${renderCustomSectionsHTML(data, colors, typography, spac)}
  </div>
</div>
${ftr.visibility === "visible" ? `<footer style="padding:6mm 10mm;border-top:1px solid ${borderColor};text-align:${ftr.alignment};font-size:10px;color:${mutedColor};">Generated with CuratoCV</footer>` : ""}
</div>`;
};

export const renderResumeHtml = (resumeData = {}) => {
  const normalized = normalizeResumeForRendering(resumeData);
  const design = normalized.design || {};
  const template = getTemplateName(design);
  const typography = resolveTypographyInline(design);

  const bodyHTML = (() => {
    switch (template) {
      case "modern":
        return renderModernTemplate(normalized, design, typography);
      case "minimal":
        return renderMinimalTemplate(normalized, design, typography);
      case "minimal-image":
        return renderMinimalImageTemplate(normalized, design, typography);
      default:
        return renderClassicTemplate(normalized, design, typography);
    }
  })();

  const safeTitle = sanitize(normalized.title || "Resume").trim();
  const fontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
${fontLinks}
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #f3f4f6; color: #1e293b; margin: 0; padding: 0; }
  .resume-a4-page { width: 210mm; min-height: 297mm; height: auto; background: white; padding: 10mm 12mm 12mm 12mm; position: relative; }
  .resume-entry { break-inside: avoid; }
  .resume-section { break-inside: auto; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
  <div class="resume-a4-page" style="margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.12),0 1px 2px rgba(0,0,0,0.06);">
    ${bodyHTML}
  </div>
</body>
</html>`;
};

export default renderResumeHtml;
