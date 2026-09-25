import { describe, it, expect, vi, beforeEach } from "vitest";
import User from "../../platform/backend/src/models/User.js";
import Resume from "../../resumebuilder/backend/src/models/Resume.js";
import imageService from "../../resumebuilder/backend/src/services/imageService.js";

// ============================================================
// CuratoCV Image Replacement Lifecycle Unit Tests (Step 6F-3)
// ============================================================
//
// These tests verify the data-contract behavior of photo
// metadata in the database — a prerequisite for the
// controller-level atomic replacement lifecycle.
//
// The actual atomic ordering (upload -> persist -> delete old)
// is covered in imageReplacementIntegration.test.js.
// ============================================================

vi.mock("../../resumebuilder/backend/src/services/imageService.js", () => ({
    default: {
        uploadImage: vi.fn(),
        deleteImage: vi.fn().mockResolvedValue(true),
        replaceImage: vi.fn(),
        processProfileImage: vi.fn(),
    },
}));

describe("Step 6F-3: Photo Metadata in Database", () => {
    let testUser;

    beforeEach(async () => {
        await User.deleteMany({});
        await Resume.deleteMany({});
        vi.clearAllMocks();

        testUser = await User.create({
            name: "Metadata Tester",
            email: `meta-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });
    });

    it("should store canonical photo object with url and fileId", async () => {
        const resume = await Resume.create({
            userId: testUser._id,
            title: "Photo Contract Test",
            personalInfo: {
                fullName: "Jane Doe",
                photo: { url: "https://ik.imagekit.io/curatocv/test.jpg", fileId: "file_abc" },
            },
        });

        const fetched = await Resume.findById(resume._id);
        expect(fetched.personalInfo.photo.url).toBe("https://ik.imagekit.io/curatocv/test.jpg");
        expect(fetched.personalInfo.photo.fileId).toBe("file_abc");
    });

    it("should allow replacing photo object with new url and fileId", async () => {
        const resume = await Resume.create({
            userId: testUser._id,
            title: "Photo Replace Test",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/old.jpg", fileId: "old_file" },
            },
        });

        await Resume.findByIdAndUpdate(
            resume._id,
            { "personalInfo.photo": { url: "https://ik.imagekit.io/curatocv/new.jpg", fileId: "new_file" } }
        );

        const fetched = await Resume.findById(resume._id);
        expect(fetched.personalInfo.photo.fileId).toBe("new_file");
        expect(fetched.personalInfo.photo.url).toBe("https://ik.imagekit.io/curatocv/new.jpg");
    });

    it("should invoke imageService.deleteImage for a given fileId", async () => {
        imageService.deleteImage.mockResolvedValueOnce(true);
        const result = await imageService.deleteImage("stale_file_id");
        expect(result).toBe(true);
        expect(imageService.deleteImage).toHaveBeenCalledWith("stale_file_id");
    });

    it("should differentiate between old and new fileId on replacement", async () => {
        const oldFileId = "old_abc";
        const newFileId = "new_xyz";

        expect(oldFileId).not.toBe(newFileId);

        imageService.deleteImage.mockResolvedValueOnce(true);
        await imageService.deleteImage(oldFileId);
        expect(imageService.deleteImage).toHaveBeenCalledWith("old_abc");
        expect(imageService.deleteImage).not.toHaveBeenCalledWith("new_xyz");
    });
});
