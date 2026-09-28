/**
 * Developer context for tests/unit/backend/services/resumeDesignParity.test.js.
 * Purpose: prove that resumebuilder/backend/src/services/resumeDesign.js — the
 * single server-side model the PDF renderer consumes — resolves EXACTLY the
 * same effective design values and normalized section data as the real Resume
 * Preview code it mirrors.
 * Why separate: the backend may not import frontend product source at runtime
 * (AGENTS.md dependency rules), so parity is enforced here as a test contract.
 * If a preview resolver, formula or normalization branch changes, this suite
 * fails until the mirror is updated — keeping one effective source of truth.
 *
 * This is a pure computation test: no MongoDB, no HTTP, no external services.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import {
    resolveResumeDesign,
    normalizeResumeData,
    resolveSectionCustomization,
    resolveEntryCustomization,
    getTemplateName,
    getSectionTitle,
    findSection,
    findEntryCustomization,
    FONT_FAMILY_MAP,
    SECTION_FALLBACK_TITLES,
} from "../../../../resumebuilder/backend/src/services/resumeDesign.js";
import { normalizePreviewData } from "../../../../resumebuilder/frontend/src/utils/previewNormalization.js";
import { resolveColors } from "../../../../resumebuilder/frontend/src/utils/colorResolver.js";
import { resolveHeader } from "../../../../resumebuilder/frontend/src/utils/headerResolver.js";
import { resolvePhoto } from "../../../../resumebuilder/frontend/src/utils/photoResolver.js";
import { resolveLinks } from "../../../../resumebuilder/frontend/src/utils/linksResolver.js";
import { resolveFooter } from "../../../../resumebuilder/frontend/src/utils/footerResolver.js";
import { resolveSpacing } from "../../../../resumebuilder/frontend/src/utils/layoutSpacing.js";
import {
    resolveSectionCustomization as previewResolveSectionCustomization,
    resolveEntryCustomization as previewResolveEntryCustomization,
} from "../../../../resumebuilder/frontend/src/utils/sectionCustomization.js";
import { FONT_FAMILY_MAP as previewFontFamilyMap } from "../../../../resumebuilder/frontend/src/utils/typography.js";

const PREVIEW_SOURCE = fs.readFileSync(
    fileURLToPath(new URL("../../../../resumebuilder/frontend/src/components/ResumePreview.jsx", import.meta.url)),
    "utf8",
);
const TEMPLATE_SECTIONS_SOURCE = fs.readFileSync(
    fileURLToPath(new URL("../../../../resumebuilder/frontend/src/components/templates/TemplateSections.jsx", import.meta.url)),
    "utf8",
);

// ============================================================
// Resume fixtures covering branches both normalizers must share
// ============================================================

const section = (type, order, overrides = {}) => ({
    type,
    order,
    visible: true,
    title: overrides.title,
    customization: overrides.customization || {},
    entries: overrides.entries || [],
});

const richResume = () => ({
    title: "Rich Resume",
    personalInfo: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+44 20 7946 0000",
        location: "London",
        profession: "Analyst",
        linkedin: "https://www.linkedin.com/in/ada",
        website: "ada.dev",
        photo: { url: "https://cdn.example.com/ada.png", fileId: "f1" },
    },
    sections: [
        section("professional_summary", 0, { entries: [{ data: { description: "Writes engines." } }] }),
        section("experiences", 2, {
            title: "Work History",
            customization: { headingStyle: "bold", divider: "accent", alignment: "center" },
            entries: [
                {
                    data: { title: "Engineer", company: "Analytical Co", startDate: "2020-01", endDate: "2022-06", isCurrent: true, location: "Remote" },
                    customization: { titleStyle: "uppercase", dateStyle: "accent", emphasis: "strong" },
                },
                { data: { company: "Legacy Ltd", startDate: "2018-03" }, visible: false },
            ],
        }),
        section("education", 1, {
            entries: [
                { data: { institution: "UCL", degree: "BSc", major: "Maths", graduationDate: "2017-09", gpa: "3.9" } },
            ],
        }),
        section("skills", 3, {
            customization: { sectionSpecific: { layout: "grid" } },
            entries: [
                { data: { category: "Languages", skills: ["Ada", "Pascal"] } },
                { data: { name: "Tools", skill: "Loom" } },
                { data: { description: "Public speaking" } },
            ],
        }),
        section("projects", 4, { entries: [{ data: { title: "Engine", link: "https://engine.dev", techStack: "Ada" } }] }),
        section("certificates", 5, { entries: [{ data: { name: "Cloud", issuer: "AWS", date: "2024" } }] }),
        section("courses", 6, { entries: [{ data: { name: "Calculus", field: "Math", date: "2016" } }] }),
        section("awards", 7, { entries: [{ data: { name: "Gold", description: "Maths", year: "2019" } }] }),
        section("languages", 8, { entries: [{ data: { language: "English", proficiency: "Native" } }] }),
        section("interests", 9, { entries: [{ data: { name: "Cycling" } }] }),
        section("organisations", 10, { entries: [{ data: { name: "Society", role: "Treasurer", date: "2021" } }] }),
        section("publications", 11, { entries: [{ data: { title: "Notes", publisher: "ACM", date: "2023", url: "https://acm.org/n" } }] }),
        section("references", 12, { entries: [{ data: { name: "Grace", title: "Manager", company: "Comp" } }] }),
        section("declaration", 13, { entries: [{ data: { text: "This is true." } }] }),
        section("custom", 14, { title: "Awards Shelf", entries: [{ data: { title: "Extra", description: "Detail" } }] }),
        section("hidden_section", 15, { visible: false, entries: [{ data: { description: "secret" } }] }),
    ],
});

const legacyResume = () => ({
    title: "Legacy",
    professional_summary: "Legacy summary",
    experience: [{ position: "Dev", company: "Old Co", start_date: "2015-01", end_date: "2016-01" }],
    education: [{ degree: "BA", institution: "Leeds" }],
    skills: ["Design", "Writing"],
    projects: [{ name: "Site", description: "Static" }],
});

const designMatrix = () => {
    const values = [];
    for (const fontFamily of ["system", "inter", "merriweather", "invalid-font", undefined]) {
        for (const fontSizeScale of ["small", "normal", "large", "giant", undefined]) {
            for (const headingScale of ["small", "normal", "large", "huge", undefined]) {
                for (const lineHeight of ["tight", "normal", "relaxed", "loose", undefined]) {
                    values.push({ fontFamily, fontSizeScale, headingScale, lineHeight });
                }
            }
        }
    }
    return values;
};

const spacingMatrix = () => {
    const values = [];
    for (const density of ["compact", "normal", "spacious", "airy", undefined]) {
        for (const sectionSpacing of ["tight", "normal", "spacious", "huge", undefined]) {
            for (const entrySpacing of ["tight", "normal", "spacious", "huge", undefined]) {
                for (const pageMarginMm of [undefined, 0, 8, 12, 40]) {
                    for (const sectionSpacingMm of [undefined, 0, 3, 9, 40, "abc"]) {
                        for (const lineHeightMultiplier of [undefined, 1, 1.35]) {
                            values.push({ density, sectionSpacing, entrySpacing, pageMarginMm, sectionSpacingMm, lineHeightMultiplier });
                        }
                    }
                }
            }
        }
    }
    return values;
};

// ============================================================
// Preview-side reference computations (mirroring ResumePreview.jsx)
// ============================================================

/** ResumePreview previewStyle + line-height math, re-expressed for comparison. */
const previewStyleFor = (design) => {
    const typography = design.typography || {};
    const spacing = design.spacing || {};
    const typeScale = { small: 0.88, normal: 1, large: 1.12 }[typography.fontSizeScale] || 1;
    const headingScale = { small: 0.9, normal: 1, large: 1.15 }[typography.headingScale] || 1;
    const lineHeight = { tight: 1.3, normal: 1.5, relaxed: 1.7 }[typography.lineHeight] || 1.5;
    const pageMarginMm = Math.max(5, Math.min(20, Number(spacing.pageMarginMm) || 10));
    const sectionSpacingMm = Math.max(0, Math.min(15,
        (Number(spacing.sectionSpacingMm ?? 3)) +
        ({ tight: -1.5, normal: 0, spacious: 3 }[spacing.sectionSpacing] || 0)
    ));
    const lineHeightMultiplier = (Number(spacing.lineHeightMultiplier) || lineHeight) *
        ({ tight: 0.9, normal: 1, relaxed: 1.08 }[typography.lineHeight] || 1);
    return {
        cssVars: {
            "--resume-font-family": previewFontFamilyMap[typography.fontFamily] || previewFontFamilyMap.system,
            "--resume-type-scale": typeScale,
            "--resume-heading-scale": headingScale,
            "--resume-body-size": `${typography.fontSizePt ?? 10.5}pt`,
            "--resume-name-size": `${typography.nameSizePt ?? 22}pt`,
            "--resume-section-size": `${typography.sectionHeadingSizePt ?? 13.5}pt`,
            "--resume-entry-size": `${typography.entryHeadingSizePt ?? 11.5}pt`,
            "--resume-line-height": lineHeightMultiplier,
            "--resume-section-space": `${sectionSpacingMm}mm`,
        },
        pageMarginMm,
        sectionSpacingMm,
    };
};

const SECTION_ENUM_KEYS = ["visibility", "alignment", "headingStyle", "headingSize", "spacing", "divider"];
const ENTRY_ENUM_KEYS = ["visibility", "alignment", "emphasis", "spacing", "titleStyle", "subtitleStyle", "dateStyle"];

const pick = (object, keys) => Object.fromEntries(keys.map((key) => [key, object[key]]));

// ============================================================
// Tests
// ============================================================

describe("resumeDesign mirrors the preview's normalization", () => {
    const fixtures = {
        rich: richResume(),
        legacy: legacyResume(),
        empty: {},
        emptySections: { title: "Empty sections", sections: [] },
        aliasesOnly: {
            sections: [
                { type: "professional_summary", order: 1, entries: [{ data: { description: "Alias summary" } }] },
                { type: "work", order: 0, entries: [{ data: { company: "W Co", title: "Dev" } }] },
            ],
        },
        hiddenCore: {
            sections: [
                { type: "experience", order: 0, visible: false, entries: [{ data: { company: "Hidden" } }] },
                { type: "summary", order: 1, visible: false, entries: [{ data: { description: "hidden" } }] },
                { type: "skills", order: 2, visible: false, entries: [{ data: "React" }] },
            ],
            experience: [{ company: "top-level" }],
            professional_summary: "top-level summary",
            skills: ["top-level skill"],
        },
        photoVariants: [
            { personal_info: { photo: "https://cdn.example.com/p.png" } },
            { personal_info: { photo: { url: "https://cdn.example.com/o.png" } } },
            { personal_info: { photo: {} } },
            { personal_info: { image: "https://cdn.example.com/legacy.png" } },
            { personal_info: { picture: "https://cdn.example.com/picture.png" } },
            { personal_info: {} },
        ],
        oddOrders: {
            sections: [
                { type: "skills", order: "2", entries: [{ data: ["A"] }] },
                { type: "education", order: "abc", entries: [{ data: { degree: "X" } }] },
                { type: "experience", order: undefined, entries: [] },
            ],
        },
        uppercaseType: {
            sections: [{ type: "SKILLS", order: 0, entries: [{ data: "Go" }] }],
        },
    };

    for (const [name, fixture] of Object.entries(fixtures)) {
        it(`normalizes the "${name}" fixture identically to normalizePreviewData`, () => {
            expect(normalizeResumeData(fixture)).toEqual(normalizePreviewData(fixture));
        });
    }

    it("keeps entry customization and per-entry visibility in sections", () => {
        const server = normalizeResumeData(richResume());
        const preview = normalizePreviewData(richResume());
        expect(server.sections.find((s) => s.type === "experience").entries).toHaveLength(1);
        expect(server.sections).toEqual(preview.sections);
        expect(server.orderedSections).toEqual(preview.orderedSections);
        expect(server.sectionsData).toEqual(preview.sectionsData);
    });
});

describe("resolveResumeDesign mirrors ResumePreview's effective values", () => {
    it("emits the exact previewStyle CSS variables (typography matrix)", () => {
        for (const typography of designMatrix()) {
            const design = { typography, spacing: {} };
            const model = resolveResumeDesign(design);
            const preview = previewStyleFor(design);
            expect({ design, cssVars: model.cssVars }).toEqual({ design, cssVars: preview.cssVars });
        }
    });

    it("emits the exact previewStyle CSS variables (spacing matrix)", () => {
        for (const spacing of spacingMatrix()) {
            const design = { typography: {}, spacing };
            const model = resolveResumeDesign(design);
            const preview = previewStyleFor(design);
            expect({ design, cssVars: model.cssVars }).toEqual({ design, cssVars: preview.cssVars });
        }
    });

    it("clamps page margins and section spacing exactly like the preview", () => {
        for (const spacing of spacingMatrix()) {
            const model = resolveResumeDesign({ spacing });
            const preview = previewStyleFor({ spacing });
            expect(model.spacing.pageMarginMm).toBe(preview.pageMarginMm);
            expect(model.spacing.sectionSpacingMm).toBe(preview.sectionSpacingMm);
        }
    });

    it("keeps raw data attributes with the preview's own fallbacks", () => {
        const layouts = [
            {},
            { pageWidth: "compact", pageAlignment: "left", columns: "two" },
            { pageWidth: "wide", pageAlignment: "right", columns: "single" },
            { pageWidth: "invalid", pageAlignment: "invalid", columns: "invalid" },
        ];
        for (const layout of layouts) {
            for (const header of [undefined, {}, { layout: "compact" }, { layout: "split" }, { layout: "nope" }]) {
                const design = { layout, header };
                const model = resolveResumeDesign(design);
                expect(model.attributes).toEqual({
                    pageWidth: layout.pageWidth || "standard",
                    pageAlignment: layout.pageAlignment || "center",
                    columns: layout.columns || "single",
                    headerLayout: (header || {}).layout || "standard",
                });
            }
        }
    });

    it("resolves colors/header/footer/links/photo like the preview resolvers", () => {
        const colorInputs = [undefined, {}, { accent: "#123456" }, { heading: "", border: "#fff" }, { bogus: "x" }];
        for (const colors of colorInputs) {
            expect(resolveResumeDesign({ colors }).colors).toEqual(resolveColors(colors || undefined));
        }
        const headers = [undefined, {}, { alignment: "center" }, { layout: "split" }, { alignment: "sideways" }];
        for (const header of headers) {
            expect(resolveResumeDesign({ header }).header).toEqual(resolveHeader(header));
        }
        const footers = [undefined, {}, { visibility: "visible", alignment: "right" }, { visibility: "maybe" }];
        for (const footer of footers) {
            expect(resolveResumeDesign({ footer }).footer).toEqual(resolveFooter(footer));
        }
        const linkInputs = [undefined, {}, { style: "underline", target: "same-tab" }, { style: "nope" }];
        for (const link of linkInputs) {
            expect(resolveResumeDesign({ links: link }).links).toEqual(resolveLinks(link));
        }
        const photos = [undefined, {}, { visibility: "visible", size: "large", shape: "square" }, { size: "huge" }];
        for (const photo of photos) {
            expect(resolveResumeDesign({ photo }).photo).toEqual(resolvePhoto(photo));
        }
    });

    it("validates spacing enums like resolveSpacing", () => {
        for (const spacing of spacingMatrix()) {
            const model = resolveResumeDesign({ spacing });
            const preview = resolveSpacing(spacing);
            expect(model.spacing.density).toBe(preview.density);
            expect(model.spacing.sectionSpacing).toBe(preview.sectionSpacing);
            expect(model.spacing.entrySpacing).toBe(preview.entrySpacing);
        }
    });

    it("uses the preview's font-family strings", () => {
        expect(FONT_FAMILY_MAP).toEqual(previewFontFamilyMap);
    });
});

describe("section and entry customization resolve identically", () => {
    const SECTION_VALUES = {
        visibility: ["visible", "hidden", "nope", undefined],
        alignment: ["left", "center", "right", "middle", undefined],
        headingStyle: ["standard", "bold", "uppercase", "accent", "minimal", "fancy", undefined],
        headingSize: ["small", "normal", "large", "huge", undefined],
        spacing: ["tight", "normal", "spacious", "huge", undefined],
        divider: ["none", "line", "accent", "dotted", undefined],
    };

    it("matches resolveSectionCustomization over the full enum matrix", () => {
        const keys = Object.keys(SECTION_VALUES);
        const combos = [[]];
        for (const key of keys) {
            const next = [];
            for (const combo of combos) {
                for (const value of SECTION_VALUES[key]) next.push([...combo, value]);
            }
            combos.length = 0;
            combos.push(...next);
        }
        for (const combo of combos) {
            const customization = Object.fromEntries(keys.map((key, index) => [key, combo[index]]));
            const server = resolveSectionCustomization(customization);
            const preview = previewResolveSectionCustomization(customization);
            expect({ customization, resolved: pick(server, SECTION_ENUM_KEYS) })
                .toEqual({ customization, resolved: pick(preview, SECTION_ENUM_KEYS) });
            expect(server.sectionSpecific).toEqual(preview.sectionSpecific);
        }
    });

    it("matches resolveEntryCustomization over the full enum matrix", () => {
        const values = {
            visibility: ["visible", "hidden", "nope", undefined],
            alignment: ["left", "center", "right", "middle", undefined],
            emphasis: ["normal", "subtle", "strong", "loud", undefined],
            spacing: ["tight", "normal", "spacious", "huge", undefined],
            titleStyle: ["normal", "bold", "uppercase", "accent", "fancy", undefined],
            subtitleStyle: ["normal", "bold", "italic", "accent", "fancy", undefined],
            dateStyle: ["normal", "bold", "subtle", "accent", "fancy", undefined],
        };
        const keys = Object.keys(values);
        let count = 0;
        const walk = (index, current) => {
            if (index === keys.length) {
                const server = resolveEntryCustomization(current);
                const preview = previewResolveEntryCustomization(current);
                expect({ current, resolved: pick(server, ENTRY_ENUM_KEYS) })
                    .toEqual({ current, resolved: pick(preview, ENTRY_ENUM_KEYS) });
                count += 1;
                return;
            }
            for (const value of values[keys[index]]) {
                walk(index + 1, { ...current, [keys[index]]: value });
            }
        };
        walk(0, {});
        // visibility 4 × alignment 5 × emphasis 5 × spacing 5 × title 6 × subtitle 6 × date 6
        expect(count).toBe(4 * 5 * 5 * 5 * 6 * 6 * 6);
    });
});

describe("template, title and section lookups mirror the preview", () => {
    it("selects templates with the preview's exact-match switch", () => {
        expect(PREVIEW_SOURCE).toContain('case "modern":');
        expect(PREVIEW_SOURCE).toContain('case "classic":');
        expect(PREVIEW_SOURCE).toContain('case "minimal":');
        expect(PREVIEW_SOURCE).toContain('case "minimal-image":');
        const cases = {
            modern: "modern",
            classic: "classic",
            minimal: "minimal",
            "minimal-image": "minimal-image",
            Modern: "classic",
            unknown: "classic",
            "": "classic",
        };
        for (const [input, expected] of Object.entries(cases)) {
            expect({ input, template: getTemplateName({ template: input }) }).toEqual({ input, template: expected });
        }
        expect(getTemplateName({})).toBe("classic");
        expect(getTemplateName(undefined)).toBe("classic");
    });

    it("looks up section titles with the preview's algorithm", () => {
        expect(TEMPLATE_SECTIONS_SOURCE).toContain("section?.title?.trim() || fallback");
        const data = {
            sections: [
                { type: "summary", title: "  My Summary  " },
                { type: "education", title: "Learning" },
                { type: "skills" },
            ],
        };
        const previewGetSectionTitle = (datum, sectionTypes, fallback) => {
            const types = Array.isArray(sectionTypes) ? sectionTypes : [sectionTypes];
            const found = (datum?.sections || []).find((candidate) => types.includes(candidate.type?.toLowerCase()));
            return found?.title?.trim() || fallback;
        };
        for (const [types, fallback] of [
            [["summary", "professional_summary"], "Professional Summary"],
            [["education", "educations"], "Education"],
            [["skills"], "Skills"],
            [["missing"], "Fallback Title"],
        ]) {
            expect(getSectionTitle(data, Array.isArray(types) ? types[0] : types, fallback))
                .toBe(previewGetSectionTitle(data, types, fallback));
        }
        // All renderer fallbacks used by the PDF match the preview call sites.
        expect(SECTION_FALLBACK_TITLES.experience).toBe("Professional Experience");
        expect(TEMPLATE_SECTIONS_SOURCE).toContain('"Professional Experience"');
        expect(SECTION_FALLBACK_TITLES.awards).toBe("Awards & Achievements");
        expect(TEMPLATE_SECTIONS_SOURCE).toContain('"Awards & Achievements"');
    });

    it("finds sections and entry customization like TemplateSections helpers", () => {
        const data = normalizeResumeData(richResume());
        const experience = findSection(data, "experience");
        expect(experience.customization).toEqual({ headingStyle: "bold", divider: "accent", alignment: "center" });
        expect(findSection(data, "missing")).toBeUndefined();

        const entries = experience.entries;
        expect(findEntryCustomization(entries, entries[0].data, 0)).toEqual({ titleStyle: "uppercase", dateStyle: "accent", emphasis: "strong" });
        // Reference match wins over index; unknown data falls back to the index.
        expect(findEntryCustomization(entries, { company: "x" }, 1)).toEqual({});
        expect(findEntryCustomization([], { company: "x" }, 0)).toEqual({});
    });
});

describe("the preview source still contains the formulas this model mirrors", () => {
    it("keeps the CSS variable math unchanged", () => {
        for (const fragment of [
            'const typeScale = { small: 0.88, normal: 1, large: 1.12 }[typography.fontSizeScale] || 1;',
            'const headingScale = { small: 0.9, normal: 1, large: 1.15 }[typography.headingScale] || 1;',
            'const lineHeight = { tight: 1.3, normal: 1.5, relaxed: 1.7 }[typography.lineHeight] || 1.5;',
            '"--resume-body-size": `${typography.fontSizePt ?? 10.5}pt`',
            '"--resume-name-size": `${typography.nameSizePt ?? 22}pt`',
            '"--resume-section-size": `${typography.sectionHeadingSizePt ?? 13.5}pt`',
            '"--resume-entry-size": `${typography.entryHeadingSizePt ?? 11.5}pt`',
            '"--resume-line-height": lineHeightMultiplier',
            '"--resume-section-space": `${sectionSpacingMm}mm`',
        ]) {
            expect(PREVIEW_SOURCE).toContain(fragment);
        }
    });

    it("keeps the spacing, attribute and normalization branches unchanged", () => {
        for (const fragment of [
            "const pageMarginMm = Math.max(5, Math.min(20, Number(spacing.pageMarginMm) || 10));",
            "(Number(spacing.sectionSpacingMm ?? 3)) +",
            "({ tight: -1.5, normal: 0, spacious: 3 }[spacing.sectionSpacing] || 0)",
            "const lineHeightMultiplier = (Number(spacing.lineHeightMultiplier) || lineHeight) *",
            'const selectedTemplate = template || design.template || "classic";',
            '"data-page-width": layout.pageWidth || "standard",',
            '"data-page-alignment": layout.pageAlignment || "center",',
            '"data-columns": layout.columns || "single",',
            '"data-header-layout": design.header?.layout || "standard",',
        ]) {
            expect(PREVIEW_SOURCE).toContain(fragment);
        }
    });
});
