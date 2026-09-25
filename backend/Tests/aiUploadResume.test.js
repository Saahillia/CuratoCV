import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import User from "../../platform/backend/src/models/User.js";
import Resume from "../../resumebuilder/backend/src/models/Resume.js";
import Subscription from "../../platform/backend/src/models/Subscription.js";
import { uploadResume } from "../../resumebuilder/backend/src/controllers/aiControllers.js";
import billingService from "../../platform/backend/src/services/billingService.js";
import errorMiddleware from "../../platform/backend/src/middlewares/errorMiddleware.js";
import ai from "../../resumebuilder/backend/src/configs/ai.js";

vi.mock("../../resumebuilder/backend/src/configs/ai.js", () => ({
	default: {
		chat: {
			completions: {
				create: vi.fn(),
			},
		},
	},
}));

vi.mock("../../platform/backend/src/services/billingService.js", () => ({
	default: {
		getResumeLimit: vi.fn(),
	},
}));

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
	req.userId = req.headers["x-user-id"];
	next();
});

app.post("/api/ai/upload-resume", uploadResume);
app.use(errorMiddleware);

describe("AI Resume Upload Controller (BUG-001 Fix)", () => {
	let testUser;

	beforeEach(async () => {
		await User.deleteMany({});
		await Resume.deleteMany({});
		await Subscription.deleteMany({});
		vi.clearAllMocks();

		testUser = await User.create({
			name: "AI Upload Tester",
			email: `ai-upload-${Date.now()}@example.com`,
			password: "HashedPassword123!",
		});

		// Default to no resume limit for tests unless overridden
		billingService.getResumeLimit.mockResolvedValue(null);

		// Default mock AI response
		ai.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							professional_summary: "Test summary",
							personal_info: {
								full_name: "Test User",
								email: "test@example.com",
							},
							skills: ["React", "Node.js"],
							experience: [
								{
									company: "Test Corp",
									position: "Developer",
									start_date: "2020-01-01",
									end_date: "2022-01-01",
									description: "Test experience",
								},
							],
							education: [
								{
									institution: "Test University",
									degree: "BS",
									field: "Computer Science",
									graduation_date: "2020-01-01",
									gpa: "3.5",
								},
							],
							project: [],
						}),
					},
				},
			],
		});
	});

	it("should accept valid JSON payload with title and resumeText", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "My React Developer Resume",
				resumeText: "Experienced React developer with 5 years of professional full-stack development experience.",
			});

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("resumeId");
		expect(response.body.data.resume.title).toBe("My React Developer Resume");

		// Verify resume was created in DB
		const resumeInDb = await Resume.findById(response.body.resumeId);
		expect(resumeInDb).not.toBeNull();
		expect(resumeInDb.title).toBe("My React Developer Resume");
		expect(resumeInDb.personalInfo.fullName).toBe("Test User");
	});

	it("should default title to 'Untitled Resume' if omitted but resumeText is valid", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				resumeText: "Experienced React developer with 5 years of professional full-stack development experience.",
			});

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("resumeId");
		expect(response.body.data.resume.title).toBe("Untitled Resume");
	});

	it("should default title to 'Untitled Resume' if title is empty string or only spaces", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "   ",
				resumeText: "Experienced React developer with 5 years of professional full-stack development experience.",
			});

		expect(response.status).toBe(201);
		expect(response.body.data.resume.title).toBe("Untitled Resume");
	});

	it("should return 400 Bad Request if resumeText is missing", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "My React Developer Resume",
			});

		expect(response.status).toBe(400);
		expect(response.body.message).toMatch(/Resume content cannot be empty/i);
	});

	it("should return 400 Bad Request if resumeText is empty string and spaces", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "My React Developer Resume",
				resumeText: "    \n   ",
			});

		expect(response.status).toBe(400);
		expect(response.body.message).toMatch(/Resume content cannot be empty/i);
	});

	it("should return 400 Bad Request if body is completely empty (e.g. invalid FormData)", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({});

		expect(response.status).toBe(400);
		expect(response.body.message).toMatch(/Resume content cannot be empty/i);
	});
});

describe("AI Resume Upload Error Mapping", () => {
	let testUser;

	beforeEach(async () => {
		await User.deleteMany({});
		await Resume.deleteMany({});
		await Subscription.deleteMany({});
		vi.clearAllMocks();

		testUser = await User.create({
			name: "Error Mapping Tester",
			email: `error-mapping-${Date.now()}@example.com`,
			password: "HashedPassword123!",
		});

		billingService.getResumeLimit.mockResolvedValue(null);
	});

	it("should return 502 when AI returns no data", async () => {
		ai.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content: null,
					},
				},
			],
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard but not enough for AI extraction.",
			});

		expect(response.status).toBe(502);
		expect(response.body.message).toBe("AI returned no resume data.");
	});

	it("should return 502 when AI returns invalid JSON", async () => {
		ai.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content: "not valid json {{{",
					},
				},
			],
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(502);
		expect(response.body.message).toBe("Unable to process the extracted resume data.");
	});

	it("should return 504 when AI request times out", async () => {
		ai.chat.completions.create.mockRejectedValue({
			name: "TimeoutError",
			message: "Request timed out after 30000ms",
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(504);
		expect(response.body.message).toBe("Resume processing timed out. Please try again.");
	});

	it("should return 401 when user is not authenticated", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(401);
		expect(response.body.message).toBe("Unauthorized.");
	});

	it("should return 403 when resume limit is reached", async () => {
		billingService.getResumeLimit.mockResolvedValue(0);

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(403);
		expect(response.body.message).toContain("Resume limit reached");
	});

	it("should return 400 for invalid resume title", async () => {
		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "A".repeat(150),
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(400);
	});

	it("should return 429 for rate-limited AI service", async () => {
		ai.chat.completions.create.mockRejectedValue({
			status: 429,
			error: { message: "Rate limit exceeded" },
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(429);
		expect(response.body.message).toContain("rate-limited");
	});

	it("should return 502 for AI provider errors with 401 status", async () => {
		ai.chat.completions.create.mockRejectedValue({
			status: 401,
			error: { message: "Invalid API key" },
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(502);
		expect(response.body.message).toBe("AI service rejected the request. Please contact support if this persists.");
	});

	it("should return 502 for AI provider errors with 403 status", async () => {
		ai.chat.completions.create.mockRejectedValue({
			status: 403,
			error: { message: "Credit quota exceeded" },
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(502);
		expect(response.body.message).toBe("AI service rejected the request. Please contact support if this persists.");
	});

	it("should return 429 for AI provider errors with 429 status", async () => {
		ai.chat.completions.create.mockRejectedValue({
			status: 429,
			error: { message: "Too many requests" },
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(429);
		expect(response.body.message).toContain("rate-limited");
	});

	it("should return 500 for unexpected server errors", async () => {
		ai.chat.completions.create.mockRejectedValue({
			name: "InternalError",
			message: "Unexpected server error",
		});

		const response = await request(app)
			.post("/api/ai/upload-resume")
			.set("x-user-id", testUser._id.toString())
			.send({
				title: "Test Resume",
				resumeText: "Enough text to pass the 50 char guard. Now extending the length to ensure it definitely passes the 50 character limit check.",
			});

		expect(response.status).toBe(500);
		expect(response.body.message).toBe("An unexpected error occurred. Please try again later.");
	});
});