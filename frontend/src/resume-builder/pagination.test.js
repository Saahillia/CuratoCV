/**
 * Developer context for frontend/src/resume-builder/pagination.test.js.
 * Purpose: prove the scale-independent A4 packing algorithm (packResumePages /
 * computePageBudgetPx) — page counts driven by real content geometry, gap and
 * header/footer accounting, entry-boundary splitting, and never losing or
 * reordering content.
 * Why here: pagination is plain-number logic owned by the Resume Builder package;
 * the root frontend owns the vitest/jsdom harness that runs all workspace UI tests.
 */
import { describe, expect, it } from "vitest";
import {
    packResumePages,
    computePageBudgetPx,
    MM_TO_PX,
} from "@curatocv/resumebuilder-frontend/utils/pagination";
import { A4_DIMENSIONS, PAGE_HEIGHT_TOLERANCE_PX } from "@curatocv/resumebuilder-frontend/constants/resumePage";

const header = (heightPx = 120, gapAfterPx = 24) => ({ heightPx, gapAfterPx });
const section = (heightPx, gapAfterPx = 11.34) => ({ heightPx, gapAfterPx, entries: null });
const flatten = (pages) => pages.flatMap((page) => page.items.map((item) => item.sectionIndex));

describe("computePageBudgetPx", () => {
    it("charges the A4 height minus page padding and template root padding", () => {
        const noRoot = computePageBudgetPx({ pageMarginMm: 10 });
        expect(noRoot).toBeCloseTo((A4_DIMENSIONS.HEIGHT_MM - 20) * MM_TO_PX, 4);
        const withRoot = computePageBudgetPx({ pageMarginMm: 10, rootPaddingPx: 64 });
        expect(withRoot).toBeCloseTo(noRoot - 64, 4);
    });

    it("shrinks the budget as the page margin grows", () => {
        const margin10 = computePageBudgetPx({ pageMarginMm: 10, rootPaddingPx: 64 });
        const margin20 = computePageBudgetPx({ pageMarginMm: 20, rootPaddingPx: 64 });
        expect(margin20).toBeLessThan(margin10);
        expect(margin10 - margin20).toBeCloseTo(20 * MM_TO_PX, 4);
    });
});

describe("packResumePages", () => {
    const budget = computePageBudgetPx({ pageMarginMm: 10, rootPaddingPx: 64 }); // ≈ 982.9px

    it("TEST 1 — a short resume fits exactly one A4 page", () => {
        const { pages } = packResumePages({
            budgetPx: budget,
            header: header(),
            sections: [section(200), section(180), section(150)],
        });
        expect(pages).toHaveLength(1);
        expect(flatten(pages)).toEqual([0, 1, 2]);
    });

    it("TEST 2 — a long resume spans multiple A4 pages in saved order", () => {
        const { pages } = packResumePages({
            budgetPx: computePageBudgetPx({ pageMarginMm: 10 }), // 1046.9px
            header: header(100, 0),
            sections: Array.from({ length: 5 }, () => section(400)),
        });
        expect(pages.length).toBeGreaterThan(1);
        // No content lost, no reordering across the page boundary.
        expect(flatten(pages)).toEqual([0, 1, 2, 3, 4]);
        expect(pages[0].items.map((i) => i.sectionIndex)).toEqual([0, 1]);
    });

    it("never emits empty pages and keeps a header lead only on page 1", () => {
        const { pages } = packResumePages({
            budgetPx: computePageBudgetPx({ pageMarginMm: 10 }),
            header: header(100, 0),
            sections: Array.from({ length: 3 }, () => section(400)),
        });
        for (const page of pages) expect(page.items.length).toBeGreaterThan(0);
        expect(pages[0].usedHeight).toBeGreaterThanOrEqual(100);
        expect(pages[1].usedHeight).toBeLessThan(100 + 400);
    });

    it("counts the gap between items on a page but not the trailing gap at a page end", () => {
        const { pages } = packResumePages({
            budgetPx: 1000,
            header: header(100, 40), // header gap owed before the first section
            sections: [section(490, 50), section(400)],
        });
        expect(pages).toHaveLength(2);
        // page 1 = header 100 + gap 40 + section 490; its trailing 50px gap is unpaid.
        expect(pages[0].usedHeight).toBe(630);
        expect(pages[1].items[0].gapBeforePx).toBe(0);
    });

    it("uses the rounding tolerance so content that fits is not broken unnecessarily", () => {
        const exact = 1000;
        const { pages } = packResumePages({
            budgetPx: exact,
            header: null,
            sections: [section(600, 0), section(exact - 600 + PAGE_HEIGHT_TOLERANCE_PX - 1, 0)],
        });
        expect(pages).toHaveLength(1);
        // Beyond tolerance genuinely breaks.
        const { pages: broken } = packResumePages({
            budgetPx: exact,
            header: null,
            sections: [section(600, 0), section(exact - 600 + PAGE_HEIGHT_TOLERANCE_PX + 1, 0)],
        });
        expect(broken).toHaveLength(2);
    });

    it("TEST 6 — taller content (larger font) increases the page count", () => {
        const base = packResumePages({
            budgetPx: budget,
            header: header(100, 0),
            sections: Array.from({ length: 5 }, () => section(400)),
        });
        const taller = packResumePages({
            budgetPx: budget,
            header: header(100, 0),
            sections: Array.from({ length: 5 }, () => section(600)),
        });
        expect(base.pages).toHaveLength(3);
        expect(taller.pages.length).toBeGreaterThan(base.pages.length);
        expect(flatten(taller.pages)).toEqual([0, 1, 2, 3, 4]);
    });

    it("TEST 7 — larger spacing gaps recalculate pagination", () => {
        const tight = packResumePages({
            budgetPx: budget,
            header: header(100, 0),
            sections: Array.from({ length: 5 }, () => section(400, 4)),
        });
        const spacious = packResumePages({
            budgetPx: budget,
            header: header(100, 0),
            sections: Array.from({ length: 5 }, () => section(400, 60)),
        });
        expect(flatten(spacious.pages)).toEqual([0, 1, 2, 3, 4]);
        // The spacious gaps change where pages break (at minimum the used height differs).
        expect(spacious.pages[0].usedHeight).toBeGreaterThan(tight.pages[0].usedHeight);
        expect(spacious.pages.length).toBeGreaterThanOrEqual(tight.pages.length);
    });

    it("TEST 8 — smaller page margins budget (bigger pageMarginMm) recalculate pagination", () => {
        const margin10 = packResumePages({
            budgetPx: computePageBudgetPx({ pageMarginMm: 10 }),
            header: header(100, 0),
            sections: Array.from({ length: 6 }, () => section(450)),
        });
        const margin20 = packResumePages({
            budgetPx: computePageBudgetPx({ pageMarginMm: 20 }),
            header: header(100, 0),
            sections: Array.from({ length: 6 }, () => section(450)),
        });
        expect(margin10.pages).toHaveLength(3);
        expect(margin20.pages.length).toBeGreaterThan(margin10.pages.length);
        expect(flatten(margin20.pages)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it("TEST 9 — hiding a section (fewer sections) recalculates the pages", () => {
        const visible5 = packResumePages({
            budgetPx: budget,
            header: header(100, 0),
            sections: Array.from({ length: 5 }, () => section(400)),
        });
        const visible4 = packResumePages({
            budgetPx: budget,
            header: header(100, 0),
            sections: Array.from({ length: 4 }, () => section(400)),
        });
        expect(visible4.pages.length).toBeLessThan(visible5.pages.length);
        expect(flatten(visible4.pages)).toEqual([0, 1, 2, 3]);
    });

    it("TEST 11 — an oversized section splits at entry boundaries without losing entries", () => {
        const bigSection = {
            heightPx: 1300,
            gapAfterPx: 11,
            entries: {
                headingHeightPx: 100,
                entries: [
                    { heightPx: 300, gapAfterPx: 0 },
                    { heightPx: 300, gapAfterPx: 0 },
                    { heightPx: 300, gapAfterPx: 0 },
                    { heightPx: 300, gapAfterPx: 0 },
                ],
            },
        };
        const { pages } = packResumePages({ budgetPx: 800, header: null, sections: [bigSection] });
        expect(pages.length).toBeGreaterThan(1);
        // Every entry appears exactly once, in order, across the fragments.
        const covered = pages.flatMap((page) =>
            page.items.flatMap((item) => item.entryIndexes ?? [])
        );
        expect(covered).toEqual([0, 1, 2, 3]);
        // Each fragment repeats the section heading (100px) plus its entries.
        for (const page of pages) {
            for (const item of page.items) {
                expect(item.sectionIndex).toBe(0);
                expect(item.heightPx).toBeGreaterThanOrEqual(100);
            }
        }
    });

    it("TEST 11 — an oversized section with no entries is placed whole, never dropped", () => {
        const { pages } = packResumePages({
            budgetPx: 500,
            header: null,
            sections: [section(2000)],
        });
        expect(pages).toHaveLength(1);
        expect(pages[0].items[0].entryIndexes).toBeNull();
    });

    it("keeps the footer on the last page without an extra page when it fits", () => {
        const { pages } = packResumePages({
            budgetPx: budget,
            header: header(100, 0),
            sections: [section(300), section(200)],
            footer: { heightPx: 60, gapBeforePx: 30 },
        });
        expect(pages).toHaveLength(1);
        expect(flatten(pages)).toEqual([0, 1]);
    });

    it("sheds the trailing section to a new last page when the footer would overflow", () => {
        const { pages } = packResumePages({
            budgetPx: 1000,
            header: header(100, 0),
            sections: [section(500, 0), section(380, 0)],
            footer: { heightPx: 80, gapBeforePx: 60 },
        });
        // Both sections fit one sheet (980 ≤ 1005), but the footer (1120 > 1005)
        // forces the trailing section — never its content — onto a new last page.
        expect(pages).toHaveLength(2);
        expect(flatten(pages)).toEqual([0, 1]);
        const last = pages[pages.length - 1];
        expect(last.usedHeight + 60 + 80).toBeLessThanOrEqual(1000 + PAGE_HEIGHT_TOLERANCE_PX);
    });

    it("orders sections exactly as given, across every page", () => {
        const { pages } = packResumePages({
            budgetPx: budget,
            header: header(),
            sections: Array.from({ length: 9 }, () => section(300)),
        });
        expect(flatten(pages)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("handles a resume with no sections (header-only document)", () => {
        const { pages } = packResumePages({ budgetPx: budget, header: header(), sections: [] });
        expect(pages).toHaveLength(1);
        expect(pages[0].items).toEqual([]);
        expect(pages[0].usedHeight).toBe(120);
    });
});
