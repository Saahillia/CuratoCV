import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../../platform/backend/src/models/User.js";
import OTP from "../../platform/backend/src/models/OTP.js";
import userController from "../../platform/backend/src/controllers/userController.js";
import errorMiddleware from "../../platform/backend/src/middlewares/errorMiddleware.js";
import otpService from "../../platform/backend/src/services/otpService.js";
import emailService from "../../platform/backend/src/services/emailService.js";

// ============================================================
// Phase 10F: Email Verification API Endpoint Tests
// ============================================================
//
// Tests the HTTP endpoints:
//   POST /api/users/request-email-verification
//   POST /api/users/verify-email
//   POST /api/users/resend-verification
//
// Uses a minimal Express app with mock auth middleware
// and real MongoDB (same pattern as accountDeletion.test.js).
// ============================================================

// ----------------------------------------------------
// Mock email service (non-blocking email sending)
// ----------------------------------------------------

vi.mock("../../platform/backend/src/services/emailService.js", () => {
    return {
        default: {
            sendEmailVerification: vi.fn().mockResolvedValue({ success: true }),
            sendWelcome: vi.fn(),
            sendVerificationReminder: vi.fn(),
            sendPasswordReset: vi.fn(),
            sendRenderedEmail: vi.fn(),
        },
    };
});

// ----------------------------------------------------
// Express test app
// ----------------------------------------------------

const app = express();
app.use(express.json());

// Mock auth middleware — extracts userId from header
app.use((req, res, next) => {
    req.userId = req.headers["x-user-id"];
    next();
});

// Wire controller endpoints directly
app.post(
    "/api/users/request-email-verification",
    (req, res, next) => userController.requestEmailVerification(req, res, next)
);

app.post(
    "/api/users/verify-email",
    (req, res, next) => {
        // Simulate validation middleware — attach validatedBody
        const { otp } = req.body;
        if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
            return res.status(400).json({
                success: false,
                errors: ["OTP must be a 6-digit number."],
            });
        }
        req.validatedBody = { otp: String(otp).trim() };
        next();
    },
    (req, res, next) => userController.verifyEmail(req, res, next)
);

app.post(
    "/api/users/resend-verification",
    (req, res, next) => userController.resendVerificationEmail(req, res, next)
);

app.use(errorMiddleware);

// ----------------------------------------------------
// Tests
// ----------------------------------------------------

describe("Phase 10F: Email Verification API Endpoints", () => {
    let testUser;

    beforeEach(async () => {
        await User.deleteMany({});
        await OTP.deleteMany({});
        vi.clearAllMocks();
        emailService.sendEmailVerification.mockResolvedValue({ success: true });
        process.env.NODE_ENV = "test";

        testUser = await User.create({
            name: "Verify Tester",
            email: "verify@example.com",
            password: "TestPassword123!",
            emailVerified: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ============================================================
    // POST /request-email-verification
    // ============================================================

    describe("POST /api/users/request-email-verification", () => {
        it("should send verification email for unverified user", async () => {
            const res = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/sent/i);
            expect(res.body.data.emailSent).toBe(true);
            expect(emailService.sendEmailVerification).toHaveBeenCalledTimes(1);
        });

        it("should reject if user is already verified", async () => {
            await User.findByIdAndUpdate(testUser._id, { emailVerified: true });

            const res = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it("should return 404 for non-existent user", async () => {
            const fakeId = new (await import("mongoose")).default.Types.ObjectId();
            const res = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", fakeId.toString())
                .expect(404);

            expect(res.body.success).toBe(false);
        });

        it("should create an OTP document in the database", async () => {
            await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(200);

            const otpDoc = await OTP.findOne({
                email: testUser.email.toLowerCase(),
                purpose: "EMAIL_VERIFICATION",
            }).select("+otpHash");

            expect(otpDoc).not.toBeNull();
            expect(otpDoc.otpHash).toBeTruthy();
            expect(otpDoc.expiresAt).toBeInstanceOf(Date);
        });
    });

    // ============================================================
    // POST /verify-email
    // ============================================================

    describe("POST /api/users/verify-email", () => {
        it("should verify email with correct OTP", async () => {
            // Create OTP directly
            const { otp } = await otpService.createOtp({
                userId: testUser._id.toString(),
                email: testUser.email,
                purpose: "EMAIL_VERIFICATION",
            });

            const res = await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.emailVerified).toBe(true);

            // Confirm user is now verified in DB
            const updated = await User.findById(testUser._id);
            expect(updated.emailVerified).toBe(true);
        });

        it("should reject with invalid OTP", async () => {
            // Create a valid OTP so there's an active challenge
            await otpService.createOtp({
                userId: testUser._id.toString(),
                email: testUser.email,
                purpose: "EMAIL_VERIFICATION",
            });

            const res = await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp: "000000" })
                .expect(400);

            expect(res.body.success).toBe(false);

            // User should NOT be verified
            const user = await User.findById(testUser._id);
            expect(user.emailVerified).toBe(false);
        });

        it("should reject OTP that has already been consumed (single-use)", async () => {
            const { otp } = await otpService.createOtp({
                userId: testUser._id.toString(),
                email: testUser.email,
                purpose: "EMAIL_VERIFICATION",
            });

            // First verification — should succeed
            await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp })
                .expect(200);

            // Second verification with same OTP — should fail (OTP consumed)
            const res = await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it("should reject 4-digit OTP via validation", async () => {
            const res = await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp: "1234" })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it("should reject if user is already verified", async () => {
            await User.findByIdAndUpdate(testUser._id, { emailVerified: true });

            const { otp } = await otpService.createOtp({
                userId: testUser._id.toString(),
                email: testUser.email,
                purpose: "EMAIL_VERIFICATION",
            });

            const res = await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // ============================================================
    // POST /resend-verification
    // ============================================================

    describe("POST /api/users/resend-verification", () => {
        it("should resend verification email for unverified user", async () => {
            const res = await request(app)
                .post("/api/users/resend-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.emailSent).toBe(true);
        });

        it("should replace existing active OTP on resend", async () => {
            // Create first OTP
            const first = await otpService.createOtp({
                userId: testUser._id.toString(),
                email: testUser.email,
                purpose: "EMAIL_VERIFICATION",
            });

            // Resend — should replace the first OTP
            await request(app)
                .post("/api/users/resend-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(200);

            // Old OTP should no longer work
            await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp: first.otp })
                .expect(400);

            // Only one OTP should exist
            const otpCount = await OTP.countDocuments({
                email: testUser.email.toLowerCase(),
                purpose: "EMAIL_VERIFICATION",
            });
            expect(otpCount).toBe(1);
        });

        it("should reject if user is already verified", async () => {
            await User.findByIdAndUpdate(testUser._id, { emailVerified: true });

            const res = await request(app)
                .post("/api/users/resend-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // ============================================================
    // Full Lifecycle: Request → Verify
    // ============================================================

    describe("Full Lifecycle: Request → Verify", () => {
        it("should complete full email verification flow via API", async () => {
            // 1. Request verification email
            const reqRes = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(200);

            expect(reqRes.body.data.emailSent).toBe(true);

            // 2. Extract OTP from DB (simulates reading email)
            const otpDoc = await OTP.findOne({
                email: testUser.email.toLowerCase(),
                purpose: "EMAIL_VERIFICATION",
            }).select("+otpHash");

            expect(otpDoc).not.toBeNull();

            // We can't recover plaintext from hash — create a new OTP for verification test
            const { otp } = await otpService.createOtp({
                userId: testUser._id.toString(),
                email: testUser.email,
                purpose: "EMAIL_VERIFICATION",
            });

            // 3. Verify email
            const verifyRes = await request(app)
                .post("/api/users/verify-email")
                .set("x-user-id", testUser._id.toString())
                .send({ otp })
                .expect(200);

            expect(verifyRes.body.data.emailVerified).toBe(true);

            // 4. Confirm user is verified
            const user = await User.findById(testUser._id);
            expect(user.emailVerified).toBe(true);

            // 5. Subsequent requests should be rejected
            await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .expect(400);
        });
    });
});
