import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../Models/User.js";
import Resume from "../Models/Resume.js";
import * as resumeController from "../Controllers/resumeController.js";
import imageService from "../Services/imageService.js";
import { validateSafeImage } from "../Utils/imageValidation.js";

// ============================================================
// CuratoCV Image Replacement Lifecycle API Tests (Step 6F-3)
// ============================================================

vi.mock("../Services/imageService.js", () => ({
    default: {
        uploadImage: vi.fn(),
        deleteImage: vi.fn(),
        replaceImage: vi.fn(),
        processProfileImage: vi.fn(),
    },
}));

vi.mock("../Utils/imageValidation.js", () => ({
    validateSafeImage: vi.fn(),
}));

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
    req.userId = req.headers["x-user-id"];
    next();
});

// We only need the update route for these lifecycle tests
app.put("/api/resumes/update/:resumeId", (req, res, next) => {
    // Multer mock
    if (req.body.mockFile) {
        req.file = {
            buffer: Buffer.from("fake-image"),
            mimetype: "image/jpeg",
            size: 1024,
            originalname: "photo.jpg"
        };
    }
    next();
}, resumeController.updateResume);

describe("Step 6F-3: Atomic Photo Replacement Integration", () => {
    let testUser;
    let testResumeId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Resume.deleteMany({});
        vi.clearAllMocks();

        testUser = await User.create({
            name: "Controller Tester",
            email: `con-tester-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });

        const resume = await Resume.create({
            userId: testUser._id,
            title: "Integration Resume",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/old-pic.jpg", fileId: "oldId123" }
            }
        });
        testResumeId = resume._id.toString();
    });

    it("should upload a new photo, persist it, and invoke deleteImage on the old photo", async () => {
        imageService.processProfileImage.mockResolvedValueOnce({
            url: "https://ik.imagekit.io/curatocv/new-pic.jpg",
            fileId: "newId456"
        });

        validateSafeImage.mockResolvedValueOnce({
            format: "jpeg",
            width: 300,
            height: 300
        });

        imageService.deleteImage.mockResolvedValueOnce(true);

        const response = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({}),
                mockFile: true
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.resume.personalInfo.photo.fileId).toBe("newId456");

        // Verify that existing fileId was deleted AFTER successful update
        expect(imageService.deleteImage).toHaveBeenCalledTimes(1);
        expect(imageService.deleteImage).toHaveBeenCalledWith("oldId123");
    });

    it("should successfully rollback new upload if database update fails", async () => {
        imageService.processProfileImage.mockResolvedValueOnce({
            url: "https://ik.imagekit.io/curatocv/fail-pic.jpg",
            fileId: "failId999"
        });

        validateSafeImage.mockResolvedValueOnce({
            format: "jpeg",
            width: 300,
            height: 300
        });

        const response = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({}),
                mockFile: true,
                expectedVersion: 999 // Force concurrency conflict (409)
            });

        expect(response.status).toBe(409);

        // Verify that the newly uploaded (but failed to persist) fileId is rolled back
        expect(imageService.deleteImage).toHaveBeenCalledTimes(1);
        expect(imageService.deleteImage).toHaveBeenCalledWith("failId999");
    });
});
