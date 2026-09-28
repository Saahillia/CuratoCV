/**
 * Developer context for frontend/src/resume-builder/ResumePreview.pagination.test.jsx.
 * Purpose: prove the Resume Preview's A4 pagination is scale-independent and
 * content-driven — page count follows unscaled layout geometry (offsetHeight /
 * offsetTop / computed styles), never the scaled getBoundingClientRect values an
 * ancestor zoom transform produces; customization inputs (font size, spacing,
 * margins, visibility, order, columns) recalculate pages without losing content.
 * Why here: these are Resume Builder preview behaviors; the root frontend owns
 * the vitest/jsdom harness that already runs the Resume Preview tests.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import ResumePreview from "@curatocv/resumebuilder-frontend/components/ResumePreview";

/**
 * jsdom has no layout engine, so we fake one:
 *  - offsetHeight returns the UNSCALED layout height (what transform: scale never changes),
 *  - getBoundingClientRect returns those heights multiplied by `rectFactor`, simulating
 *    an ancestor `transform: scale(rectFactor)` — the preview's zoom wrapper.
 * A pagination implementation that measures rects (the original bug) changes its page
 * count when rectFactor changes; the scale-independent one must not.
 */
const HEADER_HEIGHT = 100;
let sectionHeight = 400;
let sectionMarginPx = 0; // sections' margin-bottom (customization: section spacing)
let rootPaddingPx = 0; // template root vertical padding (customization: density)
let rectFactor = 0.85;

let originalOffsetHeight;
let originalGetBoundingClientRect;
let originalGetComputedStyle;

beforeAll(() => {
    originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        configurable: true,
        get() {
            if (this.tagName === "HEADER") return HEADER_HEIGHT;
            if (this.tagName === "SECTION") return sectionHeight;
            return 0;
        },
    });

    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function mockedRect() {
        const layoutHeight =
            this.tagName === "HEADER" ? HEADER_HEIGHT : this.tagName === "SECTION" ? sectionHeight : 0;
        const height = layoutHeight * rectFactor;
        return {
            height,
            top: 0,
            bottom: height,
            left: 0,
            right: 794,
            width: 794,
            x: 0,
            y: 0,
            toJSON: () => {},
        };
    };

    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function mockedComputedStyle(elt, pseudo) {
        const style = originalGetComputedStyle.call(window, elt, pseudo);
        const isSection = elt.tagName === "SECTION";
        const isTemplateRoot = elt.tagName === "DIV" && elt.parentElement?.id === "resume-preview";
        if (!isSection && !isTemplateRoot) return style;
        const overrides = {};
        if (isSection) overrides.marginBottom = sectionMarginPx;
        if (isTemplateRoot) {
            overrides.paddingTop = rootPaddingPx;
            overrides.paddingBottom = rootPaddingPx;
        }
        return new Proxy(style, {
            get(target, prop) {
                if (prop in overrides) return `${overrides[prop]}px`;
                const value = target[prop];
                return typeof value === "function" ? value.bind(target) : value;
            },
        });
    };
});

afterAll(() => {
    if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    }
    if (originalGetBoundingClientRect) {
        HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
    if (originalGetComputedStyle) window.getComputedStyle = originalGetComputedStyle;
});

beforeEach(() => {
    sectionHeight = 400;
    sectionMarginPx = 0;
    rootPaddingPx = 0;
    rectFactor = 0.85;
});

const entry = (order, data) => ({ order, visible: true, customization: {}, data });
const section = (type, title, order, entries, extra = {}) => ({
    type,
    title,
    order,
    visible: true,
    customization: {},
    entries,
    ...extra,
});

const HEADINGS = [
    "Professional Summary",
    "Education",
    "Work Experience",
    "Skills",
    "Side Project Notes",
];

const fixture = (overrides = {}) => ({
    title: "Pagination Fixture",
    personalInfo: { fullName: "Ada Lovelace", email: "ada@example.com" },
    document: { language: "en", dateFormat: "MMMM YYYY", pageFormat: "A4" },
    design: { template: "classic", spacing: {}, layout: {}, typography: {} },
    sections: [
        section("summary", "Professional Summary", 0, [entry(0, { description: "Ships reliable software." })]),
        section("education", "Education", 1, [
            entry(0, { institution: "UCL", degree: "BSc", field: "Mathematics", graduationDate: "2017-09" }),
        ]),
        section("experience", "Work Experience", 2, [
            entry(0, { company: "ACME", position: "Engineer", startDate: "2020-01", endDate: "2022-06", description: "Built things." }),
        ]),
        section("skills", "Skills", 3, [entry(0, { category: "Languages", skills: ["JavaScript", "TypeScript"] })]),
        section("custom", "Side Project Notes", 4, [
            entry(0, { title: "Open-source triage", description: "Maintainer for three libraries" }),
        ]),
    ],
    ...overrides,
});

const pages = (container) =>
    Array.from(container.querySelectorAll(".resume-preview-pages .resume-a4-page"));
const headingsByPage = (container) =>
    pages(container).map((page) =>
        Array.from(page.querySelectorAll("h2")).map((h) => h.textContent.trim()),
    );
const allHeadings = (container) => headingsByPage(container).flat();

describe("ResumePreview A4 pagination", () => {
    it("TEST 1 — a short resume renders exactly one A4 page", () => {
        sectionHeight = 150; // whole document fits one sheet
        const { container } = render(<ResumePreview data={fixture()} />);
        expect(pages(container)).toHaveLength(1);
        expect(allHeadings(container)).toEqual(HEADINGS);
    });

    it("TEST 2 — a long resume renders multiple A4 pages, order preserved, nothing lost", () => {
        const { container } = render(<ResumePreview data={fixture()} />);
        const sheetCount = pages(container).length;
        expect(sheetCount).toBeGreaterThan(1);
        expect(allHeadings(container)).toEqual(HEADINGS);
        // Every page carries content and pages are numbered sequentially.
        headingsByPage(container).forEach((sheet) => expect(sheet.length).toBeGreaterThan(0));
        expect(
            pages(container).map((p) => Number(p.getAttribute("data-page-number"))),
        ).toEqual(Array.from({ length: sheetCount }, (_, i) => i + 1));
    });

    it.each([
        ["100%", 1.0],
        ["85%", 0.85],
        ["70%", 0.7],
    ])("TEST 3-5 — zoom %s (rectFactor %s) never changes the page count", (_label, factor) => {
        const base = render(<ResumePreview data={fixture()} />);
        const baseline = pages(base.container).length;
        expect(baseline).toBeGreaterThan(1);

        rectFactor = factor;
        base.rerender(<ResumePreview data={{ ...fixture(), title: "Zoom re-measure" }} />);
        expect(pages(base.container)).toHaveLength(baseline);
        expect(allHeadings(base.container)).toEqual(HEADINGS);
    });

    it("TEST 6 — larger font geometry (re-measured heights) increases the page count", () => {
        const base = render(<ResumePreview data={fixture()} />);
        const baseline = pages(base.container).length;

        sectionHeight = 600; // what a larger font would measure
        base.rerender(
            <ResumePreview
                data={{
                    ...fixture(),
                    design: {
                        ...fixture().design,
                        typography: { fontSizeScale: "large" },
                    },
                }}
            />,
        );
        expect(pages(base.container).length).toBeGreaterThan(baseline);
        expect(allHeadings(base.container)).toEqual(HEADINGS);
    });

    it("TEST 7 — spacing (root density padding + section gaps) recalculates pagination", () => {
        const baseline = render(<ResumePreview data={fixture()} />);
        expect(headingsByPage(baseline.container)[0]).toEqual([
            "Professional Summary",
            "Education",
        ]);

        // spacious density (root p-12 ≈ 48px/side) + large section spacing (60px gaps)
        rootPaddingPx = 48;
        sectionMarginPx = 60;
        baseline.rerender(
            <ResumePreview
                data={{
                    ...fixture(),
                    design: {
                        ...fixture().design,
                        spacing: { density: "spacious", sectionSpacing: "spacious" },
                    },
                }}
            />,
        );
        // Less room per sheet now: fewer sections on page 1, still nothing lost.
        expect(headingsByPage(baseline.container)[0]).toEqual(["Professional Summary"]);
        expect(allHeadings(baseline.container)).toEqual(HEADINGS);
    });

    it("TEST 8 — changing the page margin recalculates pagination", () => {
        sectionHeight = 450;
        const baseline = render(<ResumePreview data={fixture()} />);
        expect(headingsByPage(baseline.container)[0]).toHaveLength(2);

        baseline.rerender(
            <ResumePreview
                data={{
                    ...fixture(),
                    design: {
                        ...fixture().design,
                        spacing: { pageMarginMm: 20 },
                    },
                }}
            />,
        );
        expect(headingsByPage(baseline.container)[0]).toHaveLength(1);
        expect(allHeadings(baseline.container)).toEqual(HEADINGS);
    });

    it("TEST 9 — hiding a section recalculates pages and drops only that section", () => {
        const data = fixture();
        data.sections = data.sections.map((s) =>
            s.title === "Skills" ? { ...s, visible: false } : s,
        );
        const { container } = render(<ResumePreview data={data} />);
        expect(allHeadings(container)).toEqual([
            "Professional Summary",
            "Education",
            "Work Experience",
            "Side Project Notes",
        ]);
        expect(container.textContent).not.toContain("Languages: JavaScript, TypeScript");
    });

    it("TEST 10 — reordering sections is preserved across pages", () => {
        const data = fixture();
        data.sections = data.sections.map((s) => ({ ...s, order: 4 - s.order }));
        const { container } = render(<ResumePreview data={data} />);
        expect(allHeadings(container)).toEqual([...HEADINGS].reverse());
    });

    it("TEST 11 — long content keeps every section across the pages it spans", () => {
        const many = Array.from({ length: 12 }, (_, i) =>
            section("custom", `Section ${i + 1}`, i, [
                entry(0, { title: `Entry ${i + 1}`, description: `Body ${i + 1}` }),
            ]),
        );
        const { container } = render(
            <ResumePreview data={fixture({ sections: many })} />,
        );
        expect(pages(container).length).toBeGreaterThan(2);
        expect(allHeadings(container)).toEqual(many.map((_, i) => `Section ${i + 1}`));
        expect(pages(container).forEach((p) => expect(p.textContent).toContain("Body"))).toBeUndefined();
    });

    it("TEST 12 — a two-column layout still renders every section", () => {
        const { container } = render(
            <ResumePreview
                data={{
                    ...fixture(),
                    design: { ...fixture().design, layout: { columns: "two" } },
                }}
            />,
        );
        expect(allHeadings(container)).toEqual(HEADINGS);
        const previewRoot = container.querySelector("#resume-preview");
        expect(previewRoot.getAttribute("data-columns")).toBe("two");
    });

    it("renders the document/page-shell structure (document > numbered A4 pages)", () => {
        const { container } = render(<ResumePreview data={fixture()} />);
        const documentStack = container.querySelector(".resume-preview-pages.resume-document");
        expect(documentStack).not.toBeNull();
        expect(pages(container).length).toBeGreaterThan(1);
        for (const [index, page] of pages(container).entries()) {
            expect(page.classList.contains("resume-page")).toBe(true);
            expect(page.getAttribute("data-page-number")).toBe(String(index + 1));
        }
    });
});
