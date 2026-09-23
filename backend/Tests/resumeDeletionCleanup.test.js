import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../Models/User.js";
import Resume from "../Models/Resume.js";
import * as resumeController from "../Controllers/resumeController.js";
import imageService from "../Services/imageService.js";
import errorMiddleware from "../Middlewares/errorMiddleware.js";

// ============================================================
// CuratoCV Resume Deletion Asset Cleanup Tests (Step 6F-5)
// ============================================================

vi.mock("../Services/imageService.js", () => ({
    default: {
        deleteImage: vi.fn(),
    },
}));

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    req.userId = req.headers["x-user-id"];
    next();
});

app.delete("/api/resumes/:resumeId", resumeController.deleteResume);
app.use(errorMiddleware);

describe("Step 6F-5: Resume Deletion Asset Cleanup", () => {
    let testUser;

    beforeEach(async () => {
        await User.deleteMany({});
        await Resume.deleteMany({});
        vi.clearAllMocks();

        testUser = await User.create({
            name: "Deletion Cleanup Tester",
            email: `del-cleanup-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });
    });

    it("should delete photo from ImageKit when resume with photo is deleted", async () => {
        const resume = await Resume.create({
            userId: testUser._id,
            title: "Resume With Photo",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/photo.jpg", fileId: "ik_file_123" },
            },
        });

        imageService.deleteImage.mockResolvedValueOnce(true);

        const response = await request(app)
            .delete(`/api/resumes/${resume._id}`)
            .set("x-user-id", testUser._id.toString());

        expect(response.status).toBe(200);
        expect(imageService.deleteImage).toHaveBeenCalledWith("ik_file_123");

        const deleted = await Resume.findById(resume._id);
        expect(deleted).toBeNull();
    });

    it("should not call ImageKit when resume has no photo fileId", async () => {
        const resume = await Resume.create({
            userId: testUser._id,
            title: "Resume No Photo",
            personalInfo: {
                photo: { url: "", fileId: "" },
            },
        });

        const response = await request(app)
            .delete(`/api/resumes/${resume._id}`)
            .set("x-user-id", testUser._id.toString());

        expect(response.status).toBe(200);
        expect(imageService.deleteImage).not.toHaveBeenCalled();
    });

    it("should return 200 even if ImageKit deletion fails", async () => {
        const resume = await Resume.create({
            userId: testUser._id,
            title: "Resume IK Fail",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/pic.jpg", fileId: "ik_file_456" },
            },
        });

        imageService.deleteImage.mockRejectedValueOnce(new Error("ImageKit down"));

        const response = await request(app)
            .delete(`/api/resumes/${resume._id}`)
            .set("x-user-id", testUser._id.toString());

        expect(response.status).toBe(200);
        expect(imageService.deleteImage).toHaveBeenCalledWith("ik_file_456");

        const deleted = await Resume.findById(resume._id);
        expect(deleted).toBeNull();
    });

    it("should return 404 for non-existent resume", async () => {
        const fakeId = "507f1f77bcf86cd799439011";

        const response = await request(app)
            .delete(`/api/resumes/${fakeId}`)
            .set("x-user-id", testUser._id.toString());

        expect(response.status).toBe(404);
        expect(imageService.deleteImage).not.toHaveBeenCalled();
    });

    it("should prevent unauthorized user from deleting another user's resume", async () => {
        const otherUser = await User.create({
            name: "Other",
            email: `other-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });

        const resume = await Resume.create({
            userId: testUser._id,
            title: "Private Resume",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/secret.jpg", fileId: "ik_secret" },
            },
        });

        const response = await request(app)
            .delete(`/api/resumes/${resume._id}`)
            .set("x-user-id", otherUser._id.toString());

        expect(response.status).toBe(404);
        expect(imageService.deleteImage).not.toHaveBeenCalled();

        const stillExists = await Resume.findById(resume._id);
        expect(stillExists).not.toBeNull();
    });
});
