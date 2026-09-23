import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Splits a resume's visible sections into page-sized chunks.
 *
 * Returns { pages, containerRef } where:
 *  - pages = [{ id, sections: [...] }]
 *  - containerRef = ref to attach to the hidden measurement div
 *
 * The algorithm measures each section's rendered height via
 * ResizeObserver, then packs sections into A4-height pages.
 */

// A4 height in mm — converted to px at runtime using devicePixelRatio
const A4_HEIGHT_MM = 297;
const TOP_MARGIN_MM = 10;
const BOTTOM_MARGIN_MM = 10;
const PAGE_PADDING_MM = 5;

function mmToPx(mm) {
  // 1mm ≈ 3.7795px at 96dpi
  return mm * 3.7795;
}

function getPageUsableHeightPx(scale = 1) {
  const total = A4_HEIGHT_MM - TOP_MARGIN_MM - BOTTOM_MARGIN_MM - PAGE_PADDING_MM * 2;
  return mmToPx(total) * scale;
}

const useResumePagination = (sections, scale = 1) => {
  const [pages, setPages] = useState([]);
  const measurementRef = useRef(null);
  const sectionRefs = useRef({});
  const heightsRef = useRef({});

  const collectRef = useCallback((id) => (el) => {
    if (el) {
      sectionRefs.current[id] = el;
    }
  }, []);

  useEffect(() => {
    if (!sections || sections.length === 0) {
      setPages([]);
      return;
    }

    const usableHeight = getPageUsableHeightPx(scale);
    let raf;

    const compute = () => {
      const measured = [];
      for (const sec of sections) {
        const el = sectionRefs.current[sec._id];
        if (el) {
          heightsRef.current[sec._id] = el.getBoundingClientRect().height;
        }
        const h = heightsRef.current[sec._id] || 0;
        measured.push({ ...sec, heightPx: h });
      }

      // Pack into pages
      const newPages = [];
      let currentPage = { id: `page-${newPages.length}`, sections: [], usedHeight: 0 };

      for (const sec of measured) {
        const fits = currentPage.usedHeight + sec.heightPx <= usableHeight + 2; // +2px tolerance

        if (fits || currentPage.sections.length === 0) {
          // Section fits (or is the first on this page)
          currentPage.sections.push(sec);
          currentPage.usedHeight += sec.heightPx;
        } else {
          // Doesn't fit — start new page
          newPages.push(currentPage);
          currentPage = {
            id: `page-${newPages.length}`,
            sections: [sec],
            usedHeight: sec.heightPx,
          };
        }
      }

      if (currentPage.sections.length > 0) {
        newPages.push(currentPage);
      }

      setPages(newPages);
    };

    // Wait for layout to settle
    raf = requestAnimationFrame(() => {
      requestAnimationFrame(compute);
    });

    return () => cancelAnimationFrame(raf);
  }, [sections, scale]);

  return { pages, collectRef, containerRef: measurementRef };
};

export default useResumePagination;
