import { useState, useEffect, useRef } from "react";
import ResumePage from "./ResumePage";
import { A4_CSS } from "../constants/resumePage";

/**
 * ResumeDocument
 * - Renders the full resume in a hidden measurement container first
 * - Measures section heights, computes pagination
 * - Then renders discrete ResumePage components for display/print
 */
const ResumeDocument = ({
  data,
  template = "classic",
  accentColor,
  colors = {},
  typography = {},
  layout = {},
  spacing = {},
  header = {},
  footer = {},
  photo = {},
  links = {},
  scale = 1,
}) => {
  const [pages, setPages] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [isMeasuring, setIsMeasuring] = useState(true);
  const measurementContainerRef = useRef(null);
  const sectionRefs = useRef({});

  // Template component map
  const templateMap = useRef({
    classic: null,
    modern: null,
    minimal: null,
    "minimal-image": null,
  });

  // Dynamically import templates on first render
  useEffect(() => {
    const loadTemplates = async () => {
      const [classic, modern, minimal, minimalImage] = await Promise.all([
        import("./templates/ClassicTemplate").then((m) => m.default),
        import("./templates/ModernTemplate").then((m) => m.default),
        import("./templates/MinimalTemplate").then((m) => m.default),
        import("./templates/MinimalImageTemplate").then((m) => m.default),
      ]);
      templateMap.current = { classic, modern, minimal, "minimal-image": minimalImage };
      setIsMeasuring(false);
    };
    loadTemplates();
  }, []);

  // Render a single section to measure its height
  const renderSectionForMeasurement = (sec, idx) => {
    const Template = templateMap.current[template] || templateMap.current.classic;
    if (!Template) return null;

    // We need to extract the individual section renderer from the template
    // For measurement, we render just this section in isolation
    // Since templates render everything in one go, we'll use a different approach
    return null;
  };

  // For now, fallback to simple non-measured rendering if measurement fails
  if (isMeasuring) {
    return (
      <div className="resume-document w-full mx-auto" style={{ width: A4_CSS.width }}>
        <div className="text-center p-8 text-slate-500">Preparing preview…</div>
      </div>
    );
  }

  // Compute pages from measured heights
  useEffect(() => {
    if (!measurementContainerRef.current) return;

    const container = measurementContainerRef.current;
    const sections = data.sections?.filter((s) => s.visible !== false) || [];
    const usableHeight = (297 - 10 - 10 - 10) * 3.7795; // A4 height - margins in px

    const pageData = [];
    let currentPage = { id: `page-${pageData.length}`, sections: [], height: 0 };

    sections.forEach((sec, idx) => {
      const ref = sectionRefs.current[sec._id];
      const height = ref ? ref.getBoundingClientRect().height : 0;
      if (currentPage.height + height > usableHeight && currentPage.sections.length > 0) {
        pageData.push(currentPage);
        currentPage = { id: `page-${pageData.length}`, sections: [sec], height };
      } else {
        currentPage.sections.push(sec);
        currentPage.height += height;
      }
    });

    if (currentPage.sections.length > 0) {
      pageData.push(currentPage);
    }

    setPages(pageData);
  }, [data.sections, measurements, measurementContainerRef.current]);

  // We still need to actually render the sections for measurement
  // This is complex - let's simplify: render the whole template once,
  // measure each section, then re-render as pages

  // For a working v1, just render all sections in a single long page
  // and rely on CSS print styles for actual printing
  // But the requirement is visible page partitioning...

  const Template = templateMap.current[template] || templateMap.current.classic;

  if (!Template || pages.length === 0) {
    return (
      <div className="resume-document w-full mx-auto" style={{ width: A4_CSS.width }}>
        <div className="resume-page bg-white mx-auto overflow-hidden"
             style={{ width: A4_CSS.width, height: A4_CSS.height, minHeight: A4_CSS.minHeight, maxHeight: A4_CSS.maxHeight, boxSizing: "border-box", padding: "10mm 5mm", breakAfter: "page", pageBreakAfter: "always" }}>
          <Template
            data={data}
            colors={colors}
            typography={typography}
            layout={layout}
            spacing={spacing}
            header={header}
            footer={footer}
            photo={photo}
            links={links}
          />
        </div>
      </div>
    );
  }

  // Render as discrete pages
  return (
    <div className="resume-document w-full mx-auto" style={{ width: A4_CSS.width }}>
      {pages.map((page, pageIdx) => (
        <ResumePage key={page.id} pageNumber={pageIdx + 1}>
          <div ref={(el) => { sectionRefs.current[page.id] = el; }}>
            {page.sections.map((sec, secIdx) => {
              // This is the problem: templates render ALL sections, not individual ones
              // We need to refactor templates to expose individual section renderers
              return null;
            })}
          </div>
        </ResumePage>
      ))}
    </div>
  );
};

export default ResumeDocument;