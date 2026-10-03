import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResumeJobTailoring from "../../../resumebuilder/frontend/src/components/ResumeBuilder/ResumeJobTailoring.jsx";
import aiService from "../../../resumebuilder/frontend/src/services/aiService.js";

vi.mock("../../../resumebuilder/frontend/src/services/aiService.js", () => ({
    default: { analyzeResumeForJob: vi.fn(), scoreResumeDraft: vi.fn() },
}));

const analysis = {
    resumeVersion: 3,
    analysisToken: "signed-analysis",
    jdMatch: { score: 75, criticalGaps: ["Kubernetes"] },
    atsReadiness: { score: 92, findings: ["Check the exported text order."], templateRecommendation: { template: "classic", changeRecommended: true, reason: "The current renderer uses multiple columns." } },
    requirements: [{ id: "req-1", label: "REST APIs", priority: "required", match: "contextual", evidence: "Built REST APIs" }, { id: "req-2", label: "Kubernetes", priority: "required", match: "missing", evidence: "" }],
    suggestions: [{ id: "s-1", sectionId: "experience", entryId: "job-1", field: "description", oldText: "Built REST APIs", newText: "Built REST APIs for services.", requirement: "REST APIs", why: "The role asks for API experience.", benefit: "Clarifies relevant work." }],
};

const renderPanel = (onApplyChanges = vi.fn(() => true)) => render(<ResumeJobTailoring
    resumeData={{ personalInfo: { profession: "Backend Engineer" }, sections: [] }}
    resumeId="resume-1" resumeVersion={3} isSaving={false} onApplyChanges={onApplyChanges}
/>);

describe("ResumeJobTailoring", () => {
    beforeEach(() => { vi.clearAllMocks(); aiService.analyzeResumeForJob.mockResolvedValue(analysis); aiService.scoreResumeDraft.mockResolvedValue({ jdMatch: { score: 75 }, atsReadiness: { score: 92 } }); });

    it("analyzes a JD, shows separate scores and requirement gaps, then asks the scoring service before apply", async () => {
        const onApply = vi.fn(() => true);
        renderPanel(onApply);
        fireEvent.change(screen.getByLabelText(/Job description/i), { target: { value: "Build REST APIs with Kubernetes" } });
        fireEvent.click(screen.getByRole("button", { name: /Analyze resume/i }));
        expect(await screen.findByText("JD Match")).toBeTruthy();
        expect(screen.getByText("ATS Readiness")).toBeTruthy();
        expect(screen.getByText(/No verified resume evidence was found/i)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Recalculate selected draft/i }));
        await waitFor(() => expect(aiService.scoreResumeDraft).toHaveBeenCalledWith(expect.objectContaining({ analysisToken: "signed-analysis" })));
        await waitFor(() => expect(screen.getByRole("button", { name: /Apply reviewed changes/i }).disabled).toBe(false));
        fireEvent.click(screen.getByRole("button", { name: /Apply reviewed changes/i }));
        expect(onApply).toHaveBeenCalledWith([expect.objectContaining({ newText: "Built REST APIs for services." })]);
    });

    it("renders untrusted model strings as text and rejects applying a stale draft", async () => {
        aiService.analyzeResumeForJob.mockResolvedValue({ ...analysis, requirements: [{ ...analysis.requirements[0], label: "<img src=x onerror=alert(1)>" }] });
        const onApply = vi.fn(() => false);
        renderPanel(onApply);
        fireEvent.change(screen.getByLabelText(/Job description/i), { target: { value: "Role details" } });
        fireEvent.click(screen.getByRole("button", { name: /Analyze resume/i }));
        expect(await screen.findByText("<img src=x onerror=alert(1)>")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Recalculate selected draft/i }));
        await waitFor(() => expect(screen.getByRole("button", { name: /Apply reviewed changes/i }).disabled).toBe(false));
        fireEvent.click(screen.getByRole("button", { name: /Apply reviewed changes/i }));
        expect(await screen.findByText(/changed since this analysis/i)).toBeTruthy();
        expect(onApply).toHaveBeenCalledTimes(1);
    });

    it("uses stacked phone and side-by-side wider-screen diff layouts", async () => {
        renderPanel();
        expect(document.body.innerHTML).toContain("sm:grid-cols-2");
        fireEvent.change(screen.getByLabelText(/Job description/i), { target: { value: "Role details" } });
        fireEvent.click(screen.getByRole("button", { name: /Analyze resume/i }));
        await screen.findByText("JD Match");
        expect(document.body.innerHTML).toContain("lg:grid-cols-2");
    });
});
