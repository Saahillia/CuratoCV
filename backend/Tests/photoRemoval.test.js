import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../../platform/backend/src/models/User.js";
import Resume from "../Models/Resume.js";
import * as resumeController from "../Controllers/resumeController.js";
import imageService from "../Services/imageService.js";
import errorMiddleware from "../Middlewares/errorMiddleware.js";

// ============================================================
// CuratoCV Explicit Photo Removal API Tests (Step 6F-4)
// ============================================================

vi.mock("../Services/imageService.js", () => ({
    default: {
        deleteImage: vi.fn(),
    },
}));

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
    req.userId = req.headers["x-user-id"];
    next();
});

// Put /api/resumes/update/:resumeId
app.put("/api/resumes/update/:resumeId", resumeController.updateResume);
app.use(errorMiddleware);

describe("Step 6F-4: Explicit Photo Removal Lifecycle", () => {
    let testUser;
    let otherUser;
    let testResumeId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Resume.deleteMany({});
        vi.clearAllMocks();

        testUser = await User.create({
            name: "Removal Tester",
            email: `rem-tester-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });

        otherUser = await User.create({
            name: "Other Tester",
            email: `other-tester-${Date.now()}@example.com`,
            password: "HashedPassword123!",
        });

        const resume = await Resume.create({
            userId: testUser._id,
            title: "Removal Test Resume",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/pic.jpg", fileId: "pic123" }
            }
        });
        testResumeId = resume._id.toString();
    });

    it("should remove photo from DB and deleteImage from ImageKit when photo explicitly cleared", async () => {
        imageService.deleteImage.mockResolvedValueOnce(true);

        const response = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                })
            });

        expect(response.status).toBe(200);
        expect(response.body.data.resume.personalInfo.photo.url).toBe("");
        expect(response.body.data.resume.personalInfo.photo.fileId).toBe("");

        // Verify ImageKit asset was explicitly removed
        expect(imageService.deleteImage).toHaveBeenCalledWith("pic123");
    });

    it("should handle ImageKit deletion failure gracefully without rolling back DB update", async () => {
        imageService.deleteImage.mockRejectedValueOnce(new Error("IK Failure"));

        const response = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                })
            });

        // The DB update succeeded, so 200 is correct despite IK failure
        expect(response.status).toBe(200);
        expect(response.body.data.resume.personalInfo.photo.url).toBe("");
        expect(response.body.data.resume.personalInfo.photo.fileId).toBe("");
        expect(imageService.deleteImage).toHaveBeenCalledWith("pic123");
    });

    it("should handle removal when resume has no existing photo (no-op for ImageKit)", async () => {
        const noPhotoResume = await Resume.create({
            userId: testUser._id,
            title: "No Photo Resume",
            personalInfo: {
                photo: { url: "", fileId: "" }
            }
        });

        const response = await request(app)
            .put(`/api/resumes/update/${noPhotoResume._id.toString()}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                })
            });

        expect(response.status).toBe(200);
        expect(imageService.deleteImage).not.toHaveBeenCalled();
    });

    it("should handle removal when photo has a legacy URL but empty fileId (no-op for ImageKit)", async () => {
        const legacyPhotoResume = await Resume.create({
            userId: testUser._id,
            title: "Legacy Photo Resume",
            personalInfo: {
                photo: { url: "https://ik.imagekit.io/curatocv/legacy.jpg", fileId: "" }
            }
        });

        const response = await request(app)
            .put(`/api/resumes/update/${legacyPhotoResume._id.toString()}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                })
            });

        expect(response.status).toBe(200);
        expect(response.body.data.resume.personalInfo.photo.url).toBe("");
        expect(imageService.deleteImage).not.toHaveBeenCalled();
    });

    it("should reject removal and NOT delete from ImageKit when version conflict occurs (409)", async () => {
        const response = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                }),
                expectedVersion: 999 // Concurrency mismatch
            });

        expect(response.status).toBe(409);
        expect(imageService.deleteImage).not.toHaveBeenCalled();

        // Verify photo remains intact in DB
        const resumeInDb = await Resume.findById(testResumeId);
        expect(resumeInDb.personalInfo.photo.fileId).toBe("pic123");
    });

    it("should prevent unauthorized users from removing photos of another user (404/ownership)", async () => {
        const response = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", otherUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                })
            });

        expect(response.status).toBe(404);
        expect(imageService.deleteImage).not.toHaveBeenCalled();

        // Verify photo remains intact in DB
        const resumeInDb = await Resume.findById(testResumeId);
        expect(resumeInDb.personalInfo.photo.fileId).toBe("pic123");
    });

    it("should be idempotent when removal is repeated", async () => {
        imageService.deleteImage.mockResolvedValueOnce(true);

        // First removal
        const res1 = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                })
            });

        expect(res1.status).toBe(200);
        expect(imageService.deleteImage).toHaveBeenCalledTimes(1);

        // Second removal (repeat)
        const res2 = await request(app)
            .put(`/api/resumes/update/${testResumeId}`)
            .set("x-user-id", testUser._id.toString())
            .send({
                resumeData: JSON.stringify({
                    personalInfo: {
                        photo: { url: "", fileId: "" }
                    }
                })
            });

        expect(res2.status).toBe(200);
        // Should not have called deleteImage again since fileId in DB is now empty
        expect(imageService.deleteImage).toHaveBeenCalledTimes(1);
    });
});
