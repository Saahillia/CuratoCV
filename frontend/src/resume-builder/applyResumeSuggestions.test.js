import { describe, expect, it } from "vitest";
import { applyResumeSuggestions } from "../../../resumebuilder/frontend/src/utils/applyResumeSuggestions.js";

const before = {
    title: "Backend Engineer",
    sections: [{ _id: "experience", entries: [
        { _id: "job-1", data: { description: "Built REST APIs", company: "Example Co" } },
        { _id: "job-2", data: { description: "Maintained another service" } },
    ] }],
};
const suggestion = { sectionId: "experience", entryId: "job-1", field: "description", oldText: "Built REST APIs", newText: "Built REST APIs for service clients." };

describe("applyResumeSuggestions", () => {
    it("applies only approved exact-match fields and preserves every other resume field", () => {
        const draft = applyResumeSuggestions(before, [suggestion]);
        expect(draft.sections[0].entries[0].data.description).toBe(suggestion.newText);
        expect(draft.sections[0].entries[0].data.company).toBe("Example Co");
        expect(draft.sections[0].entries[1]).toEqual(before.sections[0].entries[1]);
        expect(before.sections[0].entries[0].data.description).toBe("Built REST APIs");
    });

    it("rejects stale, duplicate, or unsupported suggestion paths without partial changes", () => {
        expect(applyResumeSuggestions(before, [{ ...suggestion, oldText: "Older text" }])).toBeNull();
        expect(applyResumeSuggestions(before, [suggestion, suggestion])).toBeNull();
        expect(applyResumeSuggestions(before, [{ ...suggestion, field: "company" }])).toBeNull();
    });

    it("supports undo by restoring the pre-apply snapshot", () => {
        const draft = applyResumeSuggestions(before, [suggestion]);
        const undone = before;
        expect(undone.sections[0].entries[0].data.description).toBe("Built REST APIs");
        expect(draft.sections[0].entries[0].data.description).not.toBe(undone.sections[0].entries[0].data.description);
    });
});
