/**
 * Developer context for resumebuilder/frontend/src/utils/pagination.js.
 * Purpose: own the pure, scale-independent A4 page-packing algorithm used by the Resume Preview.
 * Why here: pagination decisions must be plain-number logic, testable without a DOM or zoom
 * context; ResumePreview measures rendered geometry (offsetHeight/offsetTop/computed styles —
 * all layout-based and therefore unaffected by any ancestor `transform: scale`) and hands the
 * numbers here. Zoom stays purely visual: nothing in this module can observe it.
 */
import { A4_DIMENSIONS, PAGE_HEIGHT_TOLERANCE_PX } from "../constants/resumePage";

/** CSS reference pixel density: 1mm = 96/25.4px ≈ 3.7795px (the same factor the preview always used). */
export const MM_TO_PX = 3.7795;

/**
 * The height available to page content on one A4 sheet, in unscaled CSS pixels.
 *
 * budget = A4 height − 2 × page padding − template root padding
 * (the template root carries the density padding, e.g. p-8 = 32px top + 32px bottom,
 * and it is present inside every rendered page clone, so it is charged on every page).
 *
 * The header is charged separately as the first page's lead; the footer as the last
 * page's trailing cost (see packResumePages).
 */
export const computePageBudgetPx = ({ pageMarginMm, rootPaddingPx = 0 }) =>
  (A4_DIMENSIONS.HEIGHT_MM - pageMarginMm * 2) * MM_TO_PX - rootPaddingPx;

const hasEntries = (section) =>
  !!section.entries && Array.isArray(section.entries.entries) && section.entries.entries.length > 0;

/**
 * Greedily packs measured sections into A4-height pages.
 *
 * Input (all values are already unscaled layout pixels):
 *   budgetPx — from computePageBudgetPx.
 *   header   — { heightPx, gapAfterPx } | null. Leads page 1 only (later page clones drop the header).
 *   footer   — { heightPx, gapBeforePx } | null. Belongs to the last page only; if it would not
 *              fit, trailing items are shed onto a new last page rather than being dropped.
 *   sections — ordered exactly as saved/rendered; each:
 *              { heightPx, gapAfterPx,
 *                entries: null | { headingHeightPx, entries: [{ heightPx, gapAfterPx }] } }
 *
 * Packing rules:
 *   - A gap (margin) between two items is paid when the second item joins the same page;
 *     a trailing gap at a page end is not paid (nothing follows it on that sheet).
 *   - A section taller than the remaining space moves whole to a fresh page if it fits there.
 *   - Only a section that cannot fit even on a fresh page is split at entry boundaries;
 *     each fragment repeats the section heading, mirroring how fragments are cloned into pages.
 *   - No empty pages are ever produced; section order is never changed.
 *
 * Returns { pages } where each page is { items, usedHeight } and each item is
 * { sectionIndex, entryIndexes, heightPx, gapBeforePx } (entryIndexes null = whole section).
 */
export const packResumePages = ({ budgetPx, header = null, footer = null, sections = [] }) => {
  // Rounding tolerance (canonical constant) so integer offsetHeight rounding never
  // forces a page break when content still physically fits.
  const budget = budgetPx + PAGE_HEIGHT_TOLERANCE_PX;

  const pages = [
    {
      items: [],
      // Page 1 leads with the header block; later pages have no header.
      usedHeight: header ? header.heightPx : 0,
      // Gap owed before the first item (the header's trailing margin).
      pendingGapPx: header ? header.gapAfterPx : 0,
    },
  ];
  const current = () => pages[pages.length - 1];
  const addPage = () => pages.push({ items: [], usedHeight: 0, pendingGapPx: 0 });

  const placeWhole = (page, sectionIndex, section) => {
    page.items.push({
      sectionIndex,
      entryIndexes: null,
      heightPx: section.heightPx,
      gapBeforePx: page.pendingGapPx,
    });
    page.usedHeight += page.pendingGapPx + section.heightPx;
    page.pendingGapPx = section.gapAfterPx;
  };

  // Split an oversized section at entry boundaries: every fragment repeats the
  // section heading (the page clones keep the heading), entries flow onto the
  // next sheet, and no entry index is ever skipped.
  const splitSection = (page, sectionIndex, section) => {
    const { headingHeightPx, entries } = section.entries;
    let fragGapPx = page.pendingGapPx; // header gap on page 1, 0 on a fresh page
    let fragHeightPx = headingHeightPx;
    let fragEntryIndexes = [];

    const flush = () => {
      page.items.push({
        sectionIndex,
        entryIndexes: fragEntryIndexes.slice(),
        heightPx: fragHeightPx,
        gapBeforePx: fragGapPx,
      });
      page.usedHeight += fragGapPx + fragHeightPx;
    };

    entries.forEach((entry, entryIndex) => {
      const fits =
        fragEntryIndexes.length === 0 ||
        page.usedHeight + fragGapPx + fragHeightPx + entry.heightPx <= budget;
      if (!fits) {
        flush();
        addPage();
        page = current();
        fragGapPx = page.pendingGapPx;
        fragHeightPx = headingHeightPx;
        fragEntryIndexes = [];
      }
      fragEntryIndexes.push(entryIndex);
      fragHeightPx += entry.heightPx;
    });

    flush();
    page.pendingGapPx = section.gapAfterPx;
  };

  sections.forEach((section, sectionIndex) => {
    let page = current();

    // Fits after the items already on this page (gap included)?
    if (page.items.length > 0 && page.usedHeight + page.pendingGapPx + section.heightPx <= budget) {
      placeWhole(page, sectionIndex, section);
      return;
    }
    if (page.items.length > 0) addPage();

    page = current();
    // Fits on the fresh page (page 1's header lead already counted in usedHeight)?
    if (page.usedHeight + page.pendingGapPx + section.heightPx <= budget) {
      placeWhole(page, sectionIndex, section);
      return;
    }

    // Does not fit even on a fresh page.
    if (!hasEntries(section)) {
      // No entry boundaries to split at — place it whole rather than drop anything.
      placeWhole(page, sectionIndex, section);
      return;
    }
    splitSection(page, sectionIndex, section);
  });

  // The footer renders only on the last page clone. If it would overflow that
  // sheet, shed trailing items onto a new last page instead of losing them.
  if (footer && footer.heightPx > 0) {
    const footerFits = (page) =>
      page.usedHeight + footer.gapBeforePx + footer.heightPx <= budget;

    while (current().items.length > 1 && !footerFits(current())) {
      const page = current();
      if (page.items.length <= 1) break;
      const shed = page.items.pop();
      page.usedHeight -= shed.gapBeforePx + shed.heightPx;
      const shedSection = sections[shed.sectionIndex];
      pages.push({
        items: [shed],
        usedHeight: shed.heightPx, // first item on its page pays no leading gap
        pendingGapPx: shedSection ? shedSection.gapAfterPx : 0,
      });
    }
  }

  return { pages };
};
