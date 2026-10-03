import { describe, expect, it } from "vitest";
import { calculateATSReadiness, calculateJDMatch, RUBRIC_VERSION } from "../../resumebuilder/backend/src/services/resumeTailoringScoring.js";

describe("resume tailoring scoring", () => {
    it("uses only explicit evidence classifications and a stable rubric", () => {
        const requirements = [
            { label: "REST APIs", category: "skills", priority: "required", match: "contextual", evidence: "Built REST APIs", sectionId: "experience" },
            { label: "Kubernetes", category: "skills", priority: "required", match: "missing", evidence: "", sectionId: null },
            { label: "Docker", category: "skills", priority: "preferred", match: "related", evidence: "Docker", sectionId: "project" },
        ];
        const result = calculateJDMatch(requirements);
        expect(result.rubricVersion).toBe(RUBRIC_VERSION);
        expect(result.score).toBe(29);
        expect(result.criticalGaps).toEqual(["Kubernetes"]);
    });

    it("does not award higher score for repeating the same keyword requirement", () => {
        const item = { label: "Node.js", category: "skills", priority: "required", match: "exact", evidence: "Node.js", sectionId: "skills" };
        expect(calculateJDMatch([item, item]).score).toBe(calculateJDMatch([item]).score);
    });

    it("detects repeated keyword text without using repetition to raise its score", () => {
        const item = { label: "React", category: "keywords", priority: "preferred", match: "exact", evidence: "React", sectionId: "skills" };
        const result = calculateJDMatch([item], "React React React React React");
        expect(result.keywordRepetition).toEqual(["react"]);
        expect(result.score).toBe(calculateJDMatch([item], "React").score);
    });

    it("reports only observable structure checks and does not infer ATS success from template", () => {
        const result = calculateATSReadiness({
            design: { template: "modern" },
            sections: [
                { type: "experience", visible: true, entries: [{ visible: true, data: { description: "Built APIs" } }] },
                { type: "skills", visible: true, entries: [{ visible: true, data: { name: "JavaScript" } }] },
            ],
        });
        expect(result.score).toBe(92);
        expect(result.findings.join(" ")).toContain("does not simulate");
        expect(result.templateRecommendation.template).toBe("classic");
    });
});
