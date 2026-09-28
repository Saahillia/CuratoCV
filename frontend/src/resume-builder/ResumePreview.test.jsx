/**
 * Developer context for frontend/src/resume-builder/ResumePreview.test.jsx.
 * Purpose: prove the Resume Preview renders stored section data through the
 * shared SECTION_RENDER_MAP dispatch — saved order, visibility, field
 * normalization, Classic ATS skills format, and non-classic supplemental
 * sections — by rendering ResumePreview in jsdom.
 * Why here: these are Resume Builder preview rendering behaviors; the root
 * frontend owns the vitest/jsdom harness that already runs Memo UI tests.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import ResumePreview from "@curatocv/resumebuilder-frontend/components/ResumePreview";

const entry = (order, data, extra = {}) => ({
    order,
    visible: true,
    customization: {},
    data,
    ...extra,
});

const section = (type, title, order, entries, extra = {}) => ({
    type,
    title,
    order,
    visible: true,
    customization: {},
    entries,
    ...extra,
});

// Saved order is intentionally non-alphabetical (Education first) and the
// hidden Interests section sits between visible sections to prove both the
// saved ordering and visibility reach the rendered preview.
const classicResume = () => ({
    title: "Section Rendering Fixture",
    personalInfo: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+44 20 7946 0000",
    },
    document: { language: "en", dateFormat: "MMMM YYYY", pageFormat: "A4" },
    design: { template: "classic" },
    sections: [
        section("education", "Education", 0, [
            entry(0, { institution: "University College London", degree: "BSc", field: "Mathematics", graduationDate: "2017-09", gpa: "3.9" }),
            entry(1, { institution: "King's College London", degree: "MSc", field: "Computer Science", graduationDate: "2019-06" }),
        ]),
        section("summary", "Professional Summary", 1, [
            entry(0, { description: "Mathematician and the first programmer." }),
        ]),
        section("experience", "Work History", 2, [
            entry(0, {
                company: "Analytical Engines Ltd",
                position: "Senior Software Engineer",
                startDate: "2020-01",
                endDate: "2022-06",
                location: "London",
                description: "Led the batch-processing rewrite.",
            }),
        ]),
        section("skills", "Skills", 3, [
            entry(0, { category: "Languages", skills: ["JavaScript", "TypeScript", "Python"] }),
            entry(1, { description: "Technical writing" }),
        ]),
        section("interests", "Interests", 4, [
            entry(0, { name: "Chess" }),
        ], { visible: false }),
        section("custom", "Side Project Notes", 5, [
            entry(0, { title: "Open-source triage", description: "Maintainer for three small libraries" }),
        ]),
    ],
});

const modernResume = () => ({
    title: "Supplemental Fixture",
    personalInfo: { fullName: "Ada Lovelace" },
    design: { template: "modern" },
    sections: [
        section("summary", "Professional Summary", 0, [
            entry(0, { description: "Ships reliable software." }),
        ]),
        section("certificates", "Certificates", 1, [
            entry(0, { name: "Cloud Architect", issuer: "AWS", date: "2024" }),
        ]),
        section("languages", "Languages", 2, [
            entry(0, { language: "English", proficiency: "Native" }),
        ]),
    ],
});

// Scope assertions to the measurement preview (first #resume-preview node);
// the paginated page clones mirror it once layout measurement has run.
const renderPreview = (data) => {
    const { container } = render(<ResumePreview data={data} />);
    const root = container.querySelector("#resume-preview");
    expect(root).not.toBeNull();
    return root;
};

describe("ResumePreview section rendering", () => {
    it("renders every visible section for the Classic template with saved order", () => {
        const root = renderPreview(classicResume());

        const headings = Array.from(root.querySelectorAll("h2")).map((h) =>
            h.textContent.trim(),
        );
        expect(headings).toEqual([
            "Education",
            "Professional Summary",
            "Work History",
            "Skills",
            "Side Project Notes",
        ]);
    });

    it("renders normalized summary, experience, and education entry data", () => {
        const root = renderPreview(classicResume());
        const text = root.textContent;

        expect(text).toContain("Mathematician and the first programmer.");
        expect(text).toContain("Senior Software Engineer");
        expect(text).toContain("Analytical Engines Ltd");
        expect(text).toContain("Jan 2020 - Jun 2022");
        expect(text).toContain("Led the batch-processing rewrite.");
        expect(text).toContain("BSc in Mathematics");
        expect(text).toContain("University College London");
        expect(text).toContain("MSc in Computer Science");
        expect(text).toContain("King's College London");
        expect(text).toContain("Open-source triage");
        expect(text).toContain("Maintainer for three small libraries");
    });

    it("keeps the Classic ATS skills format of Category: a, b rows", () => {
        const root = renderPreview(classicResume());
        const text = root.textContent;

        expect(text).toContain("Languages: JavaScript, TypeScript, Python");
        expect(text).toContain("Technical writing");
        const labelled = Array.from(root.querySelectorAll("strong")).map(
            (node) => node.textContent,
        );
        expect(labelled).toContain("Languages: ");
    });

    it("skips sections the user marked hidden", () => {
        const root = renderPreview(classicResume());

        expect(root.textContent).not.toContain("Chess");
        expect(
            Array.from(root.querySelectorAll("h2")).map((h) => h.textContent.trim()),
        ).not.toContain("Interests");
    });

    it("appends non-classic supplemental sections after the template content", () => {
        const root = renderPreview(modernResume());
        const text = root.textContent;
        const headings = Array.from(root.querySelectorAll("h2")).map((h) =>
            h.textContent.trim(),
        );

        expect(text).toContain("Ships reliable software.");
        expect(text).toContain("Cloud Architect");
        expect(headings).toContain("Certificates");
        expect(headings).toContain("Languages");
        // Saved order holds inside the supplemental list too.
        expect(headings.indexOf("Certificates")).toBeLessThan(
            headings.indexOf("Languages"),
        );
        // Supplemental content renders after the template's own sections.
        expect(text.indexOf("Ships reliable software.")).toBeLessThan(
            text.indexOf("Cloud Architect"),
        );
        expect(root.querySelectorAll("section").length).toBeGreaterThanOrEqual(3);
    });
});
