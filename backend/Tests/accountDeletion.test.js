import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../../platform/backend/src/models/User.js";
import Resume from "../../resumebuilder/backend/src/models/Resume.js";
import userController from "../../platform/backend/src/controllers/userController.js";
import imageService from "../../resumebuilder/backend/src/services/imageService.js";
import errorMiddleware from "../../platform/backend/src/middlewares/errorMiddleware.js";

// ============================================================
// CuratoCV User Account Deletion Asset Cleanup Tests (Step 6F-6)
// ============================================================

vi.mock("../../resumebuilder/backend/src/services/imageService.js", () => ({
    default: {
        deleteImage: vi.fn(),
        listImages: vi.fn(),
    },
}));

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
    req.userId = req.headers["x-user-id"];
    next();
});

// Attach controller directly to bypass real auth middleware
app.delete("/api/users/account", (req, res, next) => userController.deleteAccount(req, res, next));
app.use(errorMiddleware);

describe("Step 6F-6: Account Deletion Asset Cleanup", () => {
    let testUser;

    beforeEach(async () => {
        await User.deleteMany({});
        await Resume.deleteMany({});
        vi.clearAllMocks();

        testUser = await User.create({
            name: "Account Deletion Tester",
            email: `acc-del-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });
    });

    it("should delete user, their resumes, and associated ImageKit photos", async () => {
        // Create multiple resumes to verify bulk cleanup
        await Resume.create({
            userId: testUser._id,
            title: "Resume With Photo 1",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/photo1.jpg", fileId: "ik_file_del_1" },
            },
        });

        await Resume.create({
            userId: testUser._id,
            title: "Resume Without Photo",
            personalInfo: {
                photo: { url: "", fileId: "" },
            },
        });

        await Resume.create({
            userId: testUser._id,
            title: "Resume With Photo 2",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/photo2.jpg", fileId: "ik_file_del_2" },
            },
        });

        // Ensure promises resolve for deleteImage mock
        imageService.deleteImage.mockResolvedValue(true);

        const response = await request(app)
            .delete("/api/users/account")
            .set("x-user-id", testUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.message).toMatch(/permanently deleted/);

        // Allow async image deletion to fire (fire-and-forget in service, run in background)
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Assert ImageKit deletions were called with correct file IDs
        expect(imageService.deleteImage).toHaveBeenCalledTimes(2);
        expect(imageService.deleteImage).toHaveBeenCalledWith("ik_file_del_1");
        expect(imageService.deleteImage).toHaveBeenCalledWith("ik_file_del_2");

        // Verify Resumes were deleted
        const resumesFound = await Resume.find({ userId: testUser._id });
        expect(resumesFound.length).toBe(0);

        // Verify User was deleted
        const userFound = await User.findById(testUser._id);
        expect(userFound).toBeNull();
    });

    it("should proceed with account deletion even if ImageKit deletion fails for one or more files", async () => {
        await Resume.create({
            userId: testUser._id,
            title: "Resume With Photo",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/photo1.jpg", fileId: "ik_file_del_1" },
            },
        });

        // Simulate ImageKit failure
        imageService.deleteImage.mockRejectedValue(new Error("ImageKit Unavailable"));

        const response = await request(app)
            .delete("/api/users/account")
            .set("x-user-id", testUser._id.toString());

        expect(response.status).toBe(200);

        await new Promise((resolve) => setTimeout(resolve, 50));

        // It still called it
        expect(imageService.deleteImage).toHaveBeenCalledTimes(1);

        // Resumes still deleted
        const resumesFound = await Resume.find({ userId: testUser._id });
        expect(resumesFound.length).toBe(0);

        // User still deleted
        const userFound = await User.findById(testUser._id);
        expect(userFound).toBeNull();
    });

    it("should return 404 Not Found if user is already deleted", async () => {
        await User.findByIdAndDelete(testUser._id);

        const response = await request(app)
            .delete("/api/users/account")
            .set("x-user-id", testUser._id.toString());

        expect(response.status).toBe(404);
        expect(imageService.deleteImage).not.toHaveBeenCalled();
    });
});
