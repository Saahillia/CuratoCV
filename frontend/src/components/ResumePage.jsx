import { A4_CSS } from "../constants/resumePage";

/**
 * A single A4 page container.
 * Children are the section fragments that belong to this page.
 */
const ResumePage = ({ pageNumber, children }) => {
  return (
    <div
      className="resume-page bg-white mx-auto overflow-hidden"
      style={{
        width: A4_CSS.width,
        height: A4_CSS.height,
        minHeight: A4_CSS.minHeight,
        maxHeight: A4_CSS.maxHeight,
        boxSizing: "border-box",
        padding: "10mm 5mm",
        breakAfter: "page",
        pageBreakAfter: "always",
      }}
    >
      {children}
    </div>
  );
};

export default ResumePage;
