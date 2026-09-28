/**
 * Developer context for resumebuilder/frontend/src/components/ResumeDocument.jsx.
 * Purpose: render the resume as a document — an ordered stack of ResumePage A4 shells.
 * Why here: resume presentation belongs to the product package; pagination/measurement
 * live in ResumePreview, which feeds each page's cloned content here.
 */

/**
 * The rendered A4 document: a vertical stack of ResumePage children (one per sheet).
 *
 * Renders the `.resume-preview-pages` stack the preview styles already target
 * (flex column, centered, 8mm gap) and sits inside the preview's zoom wrapper, so
 * zoom scales this document visually without changing what any page measured.
 * It is purely presentational: no measurement, no pagination decisions.
 */
const ResumeDocument = ({ className = "", children }) => (
    <div className={`resume-document resume-preview-pages ${className}`.trim()}>{children}</div>
);

export default ResumeDocument;
