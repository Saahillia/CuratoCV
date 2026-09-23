// ============================================================
// CuratoCV Export Service
// ============================================================
//
// Handles client-side resume exporting:
// - Print to PDF via the browser's native print dialog (uses CSS print styles)
// - Download resume as JSON
// - (Future) direct PDF generation via libraries like jsPDF/html2canvas
// ============================================================

/**
 * Trigger the browser's native print dialog. The resume preview
 * component should have appropriate `@media print` CSS so that
 * only the resume document is printed (not the app chrome).
 */
export const printResume = () => {
    if (typeof window !== "undefined") {
        window.print();
    }
};

/**
 * Export the resume data structure as a downloadable JSON file.
 * Useful for backups or transferring between accounts.
 * @param {Object} resume - resume data object
 * @param {string} [filename] - optional filename (without extension)
 */
export const exportResumeAsJSON = (resume, filename = "resume") => {
    if (typeof window === "undefined") return;

    const dataStr = JSON.stringify(resume, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

/**
 * Parse a resume file (PDF, DOCX, TXT) into plain text.
 * Currently supports PDF extraction via react-pdftotext.
 * @param {File} file
 * @returns {Promise<string>} extracted text
 */
export const extractTextFromFile = async (file) => {
    if (!file) return "";

    const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");

    if (isPdf) {
        try {
            const { pdfToText } = await import("react-pdftotext");
            const text = await pdfToText(file);
            return text || "";
        } catch (error) {
            console.error("Failed to extract text from PDF:", error);
            return "";
        }
    }

    // For plain text files, read directly
    if (file.type === "text/plain" || file.name?.toLowerCase().endsWith(".txt")) {
        return await file.text();
    }

    return "";
};

const exportService = {
    printResume,
    exportResumeAsJSON,
    extractTextFromFile,
};

export default exportService;
