/**
 * Developer context for tests/unit/backend/services/resumeHtmlRenderer.test.js.
 * Purpose: lock the PDF renderer's document contract — A4 rules, verbatim
 * reuse of ResumePreview's <style> block, fonts source, keep-with-next
 * pagination, section order/visibility/titles, entry structure, escaping and
 * URL safety — so Preview ↔ PDF parity cannot regress silently.
 * Why separate: pure HTML-string assertions against fixtures; no MongoDB, no
 * HTTP, no Chromium. Design VALUE parity lives in resumeDesignParity.test.js;
 * visual verification happens in the manual A4 inspection step.
 *
 * The style-block test reads ResumePreview.jsx itself: if the preview's CSS
 * changes and the renderer's copy does not (or vice versa), this fails.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import renderResumeHtml, { renderResumeHtml as namedRenderResumeHtml } from "../../../../resumebuilder/backend/src/services/resumeHtmlRenderer.js";

const read = (relativePath) =>
    fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const PREVIEW_SOURCE = read("../../../../resumebuilder/frontend/src/components/ResumePreview.jsx");
const INDEX_CSS = read("../../../../frontend/src/index.css");

// ============================================================
// Fixtures
// ============================================================

const baseDesign = (overrides = {}) => ({
    template: "classic",
    colors: {},
    typography: {},
    spacing: {},
    layout: {},
    header: {},
    footer: {},
    photo: {},
    links: {},
    ...overrides,
});

const section = (type, order, overrides = {}) => ({
    type,
    order,
    visible: overrides.visible ?? true,
    title: overrides.title,
    customization: overrides.customization || {},
    entries: overrides.entries || [],
});

const richResume = (designOverrides = {}) => ({
    title: "Ada <Lovelace> & Co",
    personalInfo: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+44 20 7946 0000",
        location: "London, UK",
        profession: "Rocket Surgeon",
        linkedin: "https://www.linkedin.com/in/ada",
        website: "ada.dev",
        photo: { url: "https://cdn.example.com/ada.png" },
    },
    design: { ...baseDesign(), ...designOverrides },
    sections: [
        section("professional_summary", 0, { entries: [{ data: { description: "Builds analytical <engines> & tools." } }] }),
        section("experience", 2, {
            title: "Work History",
            customization: { headingStyle: "uppercase", divider: "line", alignment: "center", spacing: "spacious" },
            entries: [
                {
                    data: { company: "Analytical Co", position: "Engineer", startDate: "2020-01", endDate: "2022-06", isCurrent: true, location: "Remote", description: "Shipped <things>." },
                    customization: { titleStyle: "bold", subtitleStyle: "italic", dateStyle: "accent", spacing: "tight", emphasis: "subtle" },
                },
                { data: { company: "Secret Corp", position: "Hidden role" }, visible: false },
            ],
        }),
        section("education", 1, {
            customization: { headingStyle: "bold", divider: "accent" },
            entries: [
                { data: { institution: "UCL", degree: "BSc", major: "Mathematics", graduationDate: "2017-09", gpa: "3.9" } },
            ],
        }),
        section("skills", 3, {
            customization: { sectionSpecific: { layout: "grid" } },
            entries: [
                { data: { category: "Languages", skills: ["Ada", "Pascal"] } },
                { data: { description: "Public speaking" } },
            ],
        }),
        section("projects", 4, { entries: [{ data: { name: "Engine", description: "Compiler", url: "https://engine.dev", technologies: "Ada, LLVM" } }] }),
        section("certificates", 5, { entries: [{ data: { name: "Cloud Practitioner", issuer: "AWS", date: "2024" } }] }),
        section("courses", 6, { entries: [{ data: { name: "Calculus", field: "Mathematics", date: "2016" } }] }),
        section("awards", 7, { entries: [{ data: { name: "Gold Medal", description: "Maths Olympiad", year: "2019" } }] }),
        section("languages", 8, { entries: [{ data: { language: "English", proficiency: "Native" } }] }),
        section("interests", 9, { entries: [{ data: { name: "Cycling" } }] }),
        section("organisations", 10, { entries: [{ data: { name: "Society", role: "Treasurer", date: "2021" } }] }),
        section("publications", 11, { entries: [{ data: { title: "Notes on Engines", publisher: "ACM", date: "2023", url: "https://acm.org/n" } }] }),
        section("references", 12, { entries: [{ data: { name: "Grace", title: "Manager", company: "Comp" } }] }),
        section("declaration", 13, { entries: [{ data: { text: "I declare this true." } }] }),
        section("custom", 14, { title: "Side Projects", entries: [{ data: { title: "Extra", description: "Detail" } }] }),
        // Hidden entries and hidden sections must never reach the output; a
        // hidden CORE section also zeroes that section's content (preview rule).
        section("awards", 15, { visible: false, entries: [{ data: { name: "Hidden Trophy" } }] }),
    ],
});

const legacyResume = () => ({
    title: "Legacy Resume",
    professional_summary: "Legacy summary text",
    experience: [{ position: "Developer", company: "Old Co", start_date: "2015-01", end_date: "2016-01", description: "Did work." }],
    education: [{ degree: "BA", field: "History", institution: "Leeds University", graduation_date: "2014-07" }],
    skills: ["Design", "Writing"],
    projects: [{ name: "Site", description: "Static site" }],
});

// ============================================================
// Document shell: A4, fonts, style blocks
// ============================================================

describe("document shell", () => {
    it("emits a standalone A4 document keyed by the preview's page rules", () => {
        const html = renderResumeHtml(richResume());
        expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
        expect(html).toContain("@page { size: A4; margin: 0; }");
        expect(html).toContain('class="resume-a4-page" style="width:210mm;min-height:297mm;box-sizing:border-box;padding:10mm;background:#ffffff"');
        expect(html).toContain('id="resume-preview"');
        // Natural flow: the preview's fixed per-page height is intentionally not
        // copied (documented in the renderer header). `min-height` is allowed.
        expect(html).not.toMatch(/(?<!min-)height:297mm/);
    });

    it("carries the preview's <style> block verbatim", () => {
        const match = PREVIEW_SOURCE.match(/<style>\{`([\s\S]*?)`\}<\/style>/);
        expect(match).not.toBeNull();
        const rules = match[1].split("\n").map((line) => line.trim()).filter(Boolean);
        expect(rules.length).toBeGreaterThan(20);
        const html = renderResumeHtml(richResume());
        for (const rule of rules) {
            expect({ rule, present: html.includes(rule) }).toEqual({ rule, present: true });
        }
    });

    it("embeds local-only font declarations instead of external network fetch", () => {
        const html = renderResumeHtml(richResume());
        expect(html).not.toContain('<link rel="preconnect" href="https://fonts.googleapis.com"/>');
        expect(html).not.toContain('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>');
        // Validate font block
        expect(html).toContain("font-family: \"DM Sans\"");
        expect(html).toContain("font-family: \"Inter\"");
        expect(html).toContain("font-family: \"Roboto\"");
        expect(html).not.toContain("cdn.tailwindcss.com");
        expect(html).not.toContain("@tailwind ");
    });

    it("adds print-only keep-with-next pagination the preview gets from its JS pass", () => {
        const html = renderResumeHtml(richResume());
        expect(html).toContain(".resume-section > h2 { break-after: avoid; page-break-after: avoid; break-inside: avoid; page-break-inside: avoid; }");
        expect(html).toContain(".resume-section { break-inside: auto; }");
        // Marker classes exist so the copied rules can act on rendered nodes.
        expect(html).toContain('<section class="resume-section"');
        expect(html).toContain('class="resume-entry"');
    });

    it("gives every heading a class attribute so the preview's [class] rules match", () => {
        const html = renderResumeHtml(richResume());
        expect(html).toMatch(/<h1 class="resume-name"/);
        expect(html).toMatch(/<h2 class="resume-section-title"/);
        expect(html).toMatch(/<h3 class="resume-entry-title"/);
    });

    it("exposes the preview's CSS variables and raw data attributes", () => {
        const html = renderResumeHtml(richResume({
            typography: { fontFamily: "inter", fontSizeScale: "large", headingScale: "small", lineHeight: "relaxed", fontSizePt: 11, nameSizePt: 24 },
            spacing: { density: "spacious", sectionSpacing: "spacious", sectionSpacingMm: 5, pageMarginMm: 12 },
            layout: { pageWidth: "compact" },
            header: { layout: "split" },
        }));
        expect(html).toContain("--resume-font-family:'Inter', system-ui, sans-serif");
        expect(html).toContain("--resume-type-scale:1.12");
        expect(html).toContain("--resume-heading-scale:0.9");
        expect(html).toContain("--resume-body-size:11pt");
        expect(html).toContain("--resume-name-size:24pt");
        expect(html).toContain("--resume-section-space:8mm"); // 5mm + spacious offset 3
        expect(html).toContain('data-page-width="compact"');
        expect(html).toContain('data-header-layout="split"');
        expect(html).toContain('padding:12mm'); // configured page margin
        expect(html).toContain("padding:48px"); // spacious density → p-12
    });

    it("falls back to the preview's attribute defaults for empty designs", () => {
        const html = renderResumeHtml({ title: "Bare" });
        expect(html).toContain('data-page-width="standard"');
        expect(html).toContain('data-page-alignment="center"'); // raw fallback, not the model's "left"
        expect(html).toContain('data-columns="single"');
        expect(html).toContain('data-template="classic"');
        expect(html).toContain('data-header-layout="standard"');
        expect(html).toContain("--resume-section-space:3mm");
        expect(html).toContain("padding:10mm");
        expect(html).toContain("padding:32px"); // normal density → p-8
    });
});

// ============================================================
// Section order, visibility, titles
// ============================================================

describe("section order, visibility and titles", () => {
    it("renders saved sections in saved order with custom titles", () => {
        const html = renderResumeHtml(richResume());
        const summaryAt = html.indexOf("Builds analytical");
        const educationAt = html.indexOf("Education</h2>");
        // The custom title is uppercased by the section's heading style.
        const experienceAt = html.indexOf("WORK HISTORY");
        const skillsAt = html.indexOf("Skills</h2>");
        expect(summaryAt).toBeGreaterThan(-1);
        expect(educationAt).toBeGreaterThan(-1);
        expect(experienceAt).toBeGreaterThan(educationAt);
        expect(skillsAt).toBeGreaterThan(experienceAt);
        // Custom title replaces the fallback ("Professional Experience" nowhere).
        expect(html).not.toContain("Professional Experience");
        expect(html).toContain("WORK HISTORY");
    });

    it("omits hidden sections and hidden entries", () => {
        const html = renderResumeHtml(richResume());
        expect(html).not.toContain("Secret Corp");
        expect(html).not.toContain("Hidden role");
        expect(html).not.toContain("Hidden Trophy");
        // Visible sections with the same type still render (only the hidden
        // section instance is dropped).
        expect(html).toContain("Gold Medal");
    });

    it("honors hidden core sections by zeroing their content", () => {
        const html = renderResumeHtml({
            title: "Hidden skills",
            design: baseDesign(),
            sections: [
                { type: "skills", order: 0, visible: false, entries: [{ data: { description: "secret-skill" } }] },
                { type: "experience", order: 1, visible: false, entries: [{ data: { position: "secret-role" } }] },
            ],
        });
        expect(html).not.toContain("secret-skill");
        expect(html).not.toContain("secret-role");
    });

    it("renders Education for both section-based and legacy resumes (regression)", () => {
        const sectionBased = renderResumeHtml(richResume());
        expect(sectionBased).toContain("UCL");
        expect(sectionBased).toContain("BSc in Mathematics");
        expect(sectionBased).toContain("GPA: 3.9");

        const legacy = renderResumeHtml(legacyResume());
        expect(legacy).toContain("Leeds University");
        expect(legacy).toContain("BA in History");
        expect(legacy).toContain("Jul 2014"); // shared section renderer uses the section date format
    });

    it("renders supplemental sections for every template — inline for classic, appended for others", () => {
        // Preview: ClassicTemplate loops data.sections through SECTION_RENDER_MAP
        // (all 15 types) so supplemental sections render INLINE in saved order,
        // while ResumePreview skips the appended supplemental list for classic.
        const classic = renderResumeHtml(richResume({ template: "classic" }));
        expect(classic).toContain("Cloud Practitioner");
        expect(classic).toContain("I declare this true.");
        expect(classic).toContain("Side Projects");

        // Non-classic templates render only their own blocks, so the
        // supplemental list is appended AFTER the template body.
        const modern = renderResumeHtml(richResume({ template: "modern" }));
        expect(modern).toContain("Cloud Practitioner");
        expect(modern).toContain("I declare this true.");
        expect(modern).toContain("Side Projects");
        const supplementalAt = modern.indexOf("Cloud Practitioner");
        expect(supplementalAt).toBeGreaterThan(modern.indexOf("Skills"));
        // The modern body's experience content must precede the appended list.
        expect(supplementalAt).toBeGreaterThan(modern.indexOf("Analytical Co"));
    });

    it("renders classic sections in saved order in a single pass", () => {
        const html = renderResumeHtml(richResume({ template: "classic" }));
        expect(html.indexOf("UCL")).toBeLessThan(html.indexOf("WORK HISTORY"));
        expect(html.indexOf("WORK HISTORY")).toBeLessThan(html.indexOf("Skills</h2>"));
        expect(html.indexOf("Skills</h2>")).toBeLessThan(html.indexOf("Cloud Practitioner"));
    });
});

// ============================================================
// Content and entry structure
// ============================================================

describe("entry structure and content parity", () => {
    it("emits experience fields: role, company, location, dates and Present", () => {
        const html = renderResumeHtml(richResume({ template: "classic" }));
        expect(html).toContain("Engineer");
        expect(html).toContain("Analytical Co");
        expect(html).toContain("Remote");
        expect(html).toContain("Jan 2020 - Present"); // section renderer date format
        expect(html).toContain("Shipped &lt;things&gt;.");
    });

    it("uses document date formatting on template-owned sections", () => {
        const html = renderResumeHtml(richResume({ template: "modern" }));
        expect(html).toContain("01/2020 - Present");
        const longForm = renderResumeHtml({ ...richResume({ template: "modern" }), document: { dateFormat: "MMMM YYYY" } });
        expect(longForm).toContain("January 2020 - Present");
    });

    it("emits projects technologies, url label and project description", () => {
        const html = renderResumeHtml(richResume({ template: "classic" }));
        expect(html).toContain("Ada, LLVM");
        expect(html).toContain('href="https://engine.dev"');
        expect(html).toContain("View Project");
    });

    it("renders Classic skills as 'Category: a, b' rows from section entries", () => {
        const html = renderResumeHtml(richResume({ template: "classic" }));
        expect(html).toContain("<strong>Languages: </strong>Ada, Pascal");
        expect(html).toContain("Public speaking");
    });

    it("renders the grid skills variant with two columns", () => {
        const html = renderResumeHtml(richResume({ template: "classic" }));
        expect(html).toContain("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px");
    });

    it("renders Modern skills chips from the joined strings", () => {
        const html = renderResumeHtml(richResume({ template: "modern" }));
        expect(html).toContain("Languages: Ada, Pascal");
        expect(html).toContain("background-color:#0353A4"); // accent chip
    });

    it("renders every supplemental section type", () => {
        const html = renderResumeHtml(richResume({ template: "minimal" }));
        for (const fragment of [
            "Cloud Practitioner", "AWS", "Calculus", "Gold Medal", "Cycling",
            "Society", "Treasurer", "Notes on Engines", "View Publication", "Grace", "Manager",
            "I declare this true.", "Extra", "English", "(Native)",
        ]) {
            expect({ fragment, present: html.includes(fragment) }).toEqual({ fragment, present: true });
        }
    });
});

// ============================================================
// Template-specific structure
// ============================================================

describe("template structure", () => {
    it("renders the four templates with their signature markup", () => {
        const classic = renderResumeHtml(richResume({ template: "classic" }));
        expect(classic).toContain("display:flex;flex-direction:column"); // classic root

        const modern = renderResumeHtml(richResume({ template: "modern" }));
        expect(modern).toContain("background-color:#17375F;color:#FFFFFF"); // header band
        expect(modern).toContain("border-left-width:3px"); // project rail

        const minimal = renderResumeHtml(richResume({ template: "minimal" }));
        expect(minimal).toContain("font-weight:300"); // font-light root
        expect(minimal).toContain(">project</h2>"); // literal lowercase heading

        const minimalImage = renderResumeHtml(richResume({ template: "minimal-image" }));
        expect(minimalImage).toContain("grid-template-columns:repeat(3,minmax(0,1fr))");
        expect(minimalImage).toContain("border-right-style:solid;border-right-width:1px");
    });

    it("shows profession only where the preview shows it", () => {
        const classic = renderResumeHtml(richResume({ template: "classic" }));
        expect(classic).not.toContain("Rocket Surgeon");

        const minimalImage = renderResumeHtml(richResume({ template: "minimal-image" }));
        expect(minimalImage).toContain("Rocket Surgeon");
        const unnamed = renderResumeHtml({
            title: "No profession",
            design: baseDesign({ template: "minimal-image" }),
            personalInfo: { fullName: "No Name" },
            sections: [],
        });
        expect(unnamed).toContain(">Profession</p>"); // preview fallback
    });

    it("renders the photo only for minimal-image (preview forces hidden elsewhere)", () => {
        const visiblePhoto = { visibility: "visible", size: "large", shape: "square", fit: "fill", position: "left" };
        for (const template of ["classic", "modern", "minimal"]) {
            const html = renderResumeHtml(richResume({ template, photo: visiblePhoto }));
            expect(html).not.toContain("<img");
        }
        const minimalImage = renderResumeHtml(richResume({ template: "minimal-image", photo: visiblePhoto }));
        expect(minimalImage).toContain('<img src="https://cdn.example.com/ada.png" alt="Ada Lovelace profile"');
        expect(minimalImage).toContain("width:110px;height:110px;object-fit:fill;border-radius:0px");
    });

    it("renders the footer only when visible, with configured alignment", () => {
        const hidden = renderResumeHtml(richResume());
        expect(hidden).not.toContain("Generated with CuratoCV");

        const visible = renderResumeHtml(richResume({ footer: { visibility: "visible", alignment: "right" } }));
        expect(visible).toContain("Generated with CuratoCV");
        expect(visible).toContain("text-align:right");
    });

    it("applies header alignment and header-layout split markup", () => {
        const html = renderResumeHtml(richResume({ template: "modern", header: { alignment: "center", layout: "split" } }));
        expect(html).toContain("justify-content:center");
        expect(html).toContain('data-header-layout="split"');
    });
});

// ============================================================
// Safety and content hygiene
// ============================================================

describe("safety and content hygiene", () => {
    it("escapes stored content like React does", () => {
        const html = renderResumeHtml({
            title: "Escape <b>test</b> & \"more\"",
            personalInfo: { fullName: "Ann <O'Brien> & \"Co\"" },
            design: baseDesign(),
            professional_summary: "<script>alert('xss')</script> & more",
            sections: [],
        });
        expect(html).toContain("Ann &lt;O&#39;Brien&gt; &amp; &quot;Co&quot;");
        expect(html).toContain("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt; &amp; more");
        expect(html).not.toContain("<script>alert");
        expect(html).toContain("<title>Escape &lt;b&gt;test&lt;/b&gt; &amp; &quot;more&quot;</title>");
    });

    it("neutralizes active URL schemes in hrefs", () => {
        const html = renderResumeHtml({
            title: "Unsafe links",
            design: baseDesign(),
            personalInfo: {
                fullName: "Link Test",
                email: "a@b.c",
                website: "javascript:alert(1)",
                linkedin: "data:text/html,hi",
            },
            sections: [],
        });
        expect(html).not.toContain('href="javascript:');
        expect(html).not.toContain('href="data:');
        expect(html).toContain('href="mailto:a@b.c"');
    });

    it("keeps normal web links untouched", () => {
        const minimalImage = renderResumeHtml(richResume({ template: "minimal-image" }));
        expect(minimalImage).toContain('href="https://www.linkedin.com/in/ada"');
        expect(minimalImage).toContain('href="https://acm.org/n"'); // publication link
        // Minimal-Image strips the scheme (and www) from the visible label.
        expect(minimalImage).toContain(">linkedin.com/in/ada<");

        // The shared projects section renders the stored project URL.
        const classic = renderResumeHtml(richResume({ template: "classic" }));
        expect(classic).toContain('href="https://engine.dev"');
        expect(classic).toContain("View Project");
    });
});

describe("exports", () => {
    it("exposes the same default and named entry the controller imports", () => {
        expect(typeof namedRenderResumeHtml).toBe("function");
        expect(renderResumeHtml).toBe(namedRenderResumeHtml);
        expect(renderResumeHtml({})).toContain('id="resume-preview"');
    });
});
