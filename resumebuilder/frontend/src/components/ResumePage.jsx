/**
 * Developer context for resumebuilder/frontend/src/components/ResumePage.jsx.
 * Purpose: render exactly one fixed A4 page shell (210mm × 297mm) holding page content.
 * Why here: resume presentation belongs to the product package; the shell dimensions come
 * from the canonical constants/resumePage.js so preview and PDF share one A4 definition.
 */
import { A4_CSS } from "../constants/resumePage";

/**
 * One A4 page — the stable document boundary.
 *
 * The shell itself defines the document dimensions (210mm × 297mm). Visual zoom is
 * applied by an ancestor `transform: scale(...)` OUTSIDE this component, so neither
 * these dimensions nor the pagination that measured against them are affected by zoom.
 *
 * `style` merges over the A4 base (the preview passes the design's page padding);
 * content arrives either as `html` (the preview's measured page clone) or `children`.
 * `overflow` stays visible so content can never be silently clipped by rounding.
 */
const ResumePage = ({ pageNumber, className = "", style = {}, html, children }) => {
    const innerProps =
        html !== undefined ? { dangerouslySetInnerHTML: { __html: html } } : {};
    return (
        <div
            data-page-number={pageNumber}
            className={`resume-page resume-a4-page bg-white mx-auto ${className}`.trim()}
            style={{
                width: A4_CSS.width,
                height: A4_CSS.height,
                minHeight: A4_CSS.minHeight,
                maxHeight: A4_CSS.maxHeight,
                boxSizing: "border-box",
                background: "white",
                overflow: "visible",
                breakAfter: "page",
                pageBreakAfter: "always",
                ...style,
            }}
            {...innerProps}
        >
            {html !== undefined ? null : children}
        </div>
    );
};

export default ResumePage;
