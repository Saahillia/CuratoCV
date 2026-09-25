import { describe, it, expect, beforeEach } from "vitest";
import { createUser, createResume } from "./factories.js";
import resumeService from "../../resumebuilder/backend/src/services/resumeService.js";
import resumeRepository from "../../resumebuilder/backend/src/repositories/resumeRepository.js";
import Resume from "../../resumebuilder/backend/src/models/Resume.js";

describe("Resume Optimistic Concurrency Control Tests", () => {
    let user;
    let otherUser;
    let initialResume;

    beforeEach(async () => {
        user = await createUser({ email: "concurrency_user@example.com" });
        otherUser = await createUser({ email: "concurrency_other@example.com" });
        initialResume = await resumeService.createResume(user._id, {
            title: "Original Resume Title",
        });
    });

    it("should allow first save when expectedVersion matches stored __v and increment version", async () => {
        const expectedVersion = initialResume.__v; // initial version, e.g. 0

        const updated = await resumeService.updateResume(
            initialResume._id,
            user._id,
            { title: "Updated Resume Title 1" },
            expectedVersion
        );

        expect(updated).toBeTruthy();
        expect(updated.title).toBe("Updated Resume Title 1");
        expect(updated.__v).toBe(expectedVersion + 1);

        // Verify directly in MongoDB
        const stored = await Resume.findById(initialResume._id);
        expect(stored.title).toBe("Updated Resume Title 1");
        expect(stored.__v).toBe(expectedVersion + 1);
    });

    it("should throw 409 Conflict when a stale expectedVersion is supplied", async () => {
        // First update advances version from 0 to 1
        await resumeService.updateResume(
            initialResume._id,
            user._id,
            { title: "First Tab Edit" },
            initialResume.__v
        );

        // Second update tries to use stale version (0 instead of 1)
        await expect(
            resumeService.updateResume(
                initialResume._id,
                user._id,
                { title: "Second Tab Stale Edit" },
                initialResume.__v // Stale version 0
            )
        ).rejects.toThrow("Resume was modified elsewhere. Concurrency conflict.");

        // Stale save does NOT modify MongoDB
        const stored = await Resume.findById(initialResume._id);
        expect(stored.title).toBe("First Tab Edit");
        expect(stored.__v).toBe(1);
    });

    it("should simulate a multi-tab scenario where Tab B conflict preserves local edits and resolves on retry", async () => {
        // Tab A and Tab B load version 0
        const tabAVersion = initialResume.__v;
        const tabBVersion = initialResume.__v;

        // Tab A saves changes first
        const tabAResult = await resumeService.updateResume(
            initialResume._id,
            user._id,
            { title: "Tab A Title" },
            tabAVersion
        );
        expect(tabAResult.__v).toBe(1);

        // Tab B attempts to save with stale version 0 -> Fails with 409
        let tabBError;
        try {
            await resumeService.updateResume(
                initialResume._id,
                user._id,
                { title: "Tab B Local Title" },
                tabBVersion
            );
        } catch (err) {
            tabBError = err;
        }

        expect(tabBError).toBeTruthy();
        expect(tabBError.statusCode).toBe(409);

        // Verify MongoDB was NOT modified by Tab B's failed update
        let dbDoc = await Resume.findById(initialResume._id);
        expect(dbDoc.title).toBe("Tab A Title");

        // Tab B resolves conflict by acquiring latest version (1) and retrying save
        const latestServerDoc = await resumeService.getResume(initialResume._id, user._id);
        const resolvedVersion = latestServerDoc.__v; // Now version 1

        const tabBRetryResult = await resumeService.updateResume(
            initialResume._id,
            user._id,
            { title: "Tab B Local Title" },
            resolvedVersion
        );

        expect(tabBRetryResult.title).toBe("Tab B Local Title");
        expect(tabBRetryResult.__v).toBe(2);

        // Verify MongoDB now holds Tab B's resolved update
        dbDoc = await Resume.findById(initialResume._id);
        expect(dbDoc.title).toBe("Tab B Local Title");
        expect(dbDoc.__v).toBe(2);
    });

    it("should prevent an unauthorized user from using concurrency metadata to update another user's resume", async () => {
        await expect(
            resumeService.updateResume(
                initialResume._id,
                otherUser._id, // Unauthorized user
                { title: "Hacked Title" },
                initialResume.__v
            )
        ).rejects.toThrow("Resume not found.");

        const stored = await Resume.findById(initialResume._id);
        expect(stored.title).toBe("Original Resume Title");
    });
});
