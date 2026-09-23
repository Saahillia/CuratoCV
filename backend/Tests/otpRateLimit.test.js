import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import User from "../Models/User.js";
import OTP from "../Models/OTP.js";
import userController from "../Controllers/userController.js";
import errorMiddleware from "../Middlewares/errorMiddleware.js";
import {
    otpIpLimitMiddleware,
    otpCooldownMiddleware,
    otpEmailHourlyLimitMiddleware,
    otpVerifyIpLimitMiddleware,
    _clearRateLimitStore,
    createRateLimiter,
    createEmailPurposeRateLimiter
} from "../Middlewares/rateLimitMiddleware.js";
import emailService from "../Services/emailService.js";
import otpService from "../Services/otpService.js";

// Mock email service
vi.mock("../Services/emailService.js", () => ({
    default: {
        sendEmailVerification: vi.fn().mockResolvedValue({ success: true }),
        sendWelcome: vi.fn(),
        sendVerificationReminder: vi.fn(),
        sendPasswordReset: vi.fn(),
        sendRenderedEmail: vi.fn(),
    },
}));

// Setup minimal app with test user injection and real route-like rate limiter chains
const app = express();
app.use(express.json());

// Inject user id & email info
app.use((req, res, next) => {
    req.userId = req.headers["x-user-id"];
    if (req.headers["x-client-ip"]) {
        req.ip = req.headers["x-client-ip"];
    }
    next();
});

// Middleware for parsing validated body
app.use((req, res, next) => {
    req.validatedBody = req.body;
    next();
});

// Real endpoint handlers
app.post(
    "/api/users/request-email-verification",
    otpIpLimitMiddleware,
    otpEmailHourlyLimitMiddleware,
    otpCooldownMiddleware,
    (req, res, next) => userController.requestEmailVerification(req, res, next)
);

app.post(
    "/api/users/verify-email",
    otpVerifyIpLimitMiddleware,
    (req, res, next) => userController.verifyEmail(req, res, next)
);

app.post(
    "/api/users/resend-verification",
    otpIpLimitMiddleware,
    otpEmailHourlyLimitMiddleware,
    otpCooldownMiddleware,
    (req, res, next) => userController.resendVerificationEmail(req, res, next)
);

app.use(errorMiddleware);

describe("Phase 10G: OTP Rate Limiting & Abuse Protection Test Suite", () => {
    let testUser;
    let otherUser;

    beforeEach(async () => {
        _clearRateLimitStore();
        await User.deleteMany({});
        await OTP.deleteMany({});
        vi.clearAllMocks();
        emailService.sendEmailVerification.mockResolvedValue({ success: true });

        testUser = await User.create({
            name: "RateLimit User",
            email: "target@example.com",
            password: "Password123!",
            emailVerified: false,
        });

        otherUser = await User.create({
            name: "Other User",
            email: "other@example.com",
            password: "Password123!",
            emailVerified: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ============================================================
    // 1. 60-Second Cooldown per Email + Purpose
    // ============================================================

    describe("1. Cooldown Policy (1 req / 60s per Email + Purpose)", () => {
        it("should allow first request and block immediate second request with 429", async () => {
            // First request - 200 OK
            const res1 = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(200);

            expect(res1.body.success).toBe(true);
            expect(emailService.sendEmailVerification).toHaveBeenCalledTimes(1);

            // Immediate second request - 429
            const res2 = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(429);

            expect(res2.body.success).toBe(false);
            expect(res2.body.error.code).toBe("OTP_COOLDOWN_EXCEEDED");
            expect(res2.headers["retry-after"]).toBeDefined();
            expect(Number(res2.headers["retry-after"])).toBeGreaterThan(0);

            // External email sending service must NOT have been called again
            expect(emailService.sendEmailVerification).toHaveBeenCalledTimes(1);
        });

        it("should not create additional OTP document in DB when rate limited", async () => {
            await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(200);

            // Second request hits cooldown
            await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(429);

            const otpCount = await OTP.countDocuments({ email: testUser.email });
            expect(otpCount).toBe(1);
        });
    });

    // ============================================================
    // 2. Purpose Separation
    // ============================================================

    describe("2. Purpose Separation", () => {
        it("should separate cooldown buckets for different purposes on the same email", async () => {
            const customApp = express();
            customApp.use(express.json());
            customApp.use((req, res, next) => {
                req.validatedBody = req.body;
                next();
            });

            customApp.post(
                "/api/test-otp-purpose",
                otpCooldownMiddleware,
                (req, res) => res.status(200).json({ success: true })
            );
            customApp.use(errorMiddleware);

            // Request for EMAIL_VERIFICATION
            await request(customApp)
                .post("/api/test-otp-purpose")
                .send({ email: "user@example.com", purpose: "EMAIL_VERIFICATION" })
                .expect(200);

            // Request for PASSWORD_RESET with same email in same second -> should succeed
            const resetRes = await request(customApp)
                .post("/api/test-otp-purpose")
                .send({ email: "user@example.com", purpose: "PASSWORD_RESET" })
                .expect(200);

            expect(resetRes.body.success).toBe(true);

            // Second EMAIL_VERIFICATION request -> blocked
            await request(customApp)
                .post("/api/test-otp-purpose")
                .send({ email: "user@example.com", purpose: "EMAIL_VERIFICATION" })
                .expect(429);
        });
    });

    // ============================================================
    // 3. User & Email Isolation
    // ============================================================

    describe("3. User Isolation", () => {
        it("should not rate limit User B when User A hits cooldown", async () => {
            // User A requests verification
            await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(200);

            // User A is now rate-limited
            await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(429);

            // User B requests verification -> should succeed
            const resB = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", otherUser._id.toString())
                .send({ email: otherUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(200);

            expect(resB.body.success).toBe(true);
        });
    });

    // ============================================================
    // 4. Hourly Email Limit (5 per hour)
    // ============================================================

    describe("4. Hourly Email Limit (5 requests / hour / email)", () => {
        it("should enforce maximum of 5 requests per hour even across distinct cooldowns", async () => {
            const hourlyApp = express();
            hourlyApp.use(express.json());
            hourlyApp.use((req, res, next) => {
                req.validatedBody = req.body;
                next();
            });

            // Use only hourly limiter
            hourlyApp.post(
                "/api/test-hourly",
                otpEmailHourlyLimitMiddleware,
                (req, res) => res.status(200).json({ success: true })
            );
            hourlyApp.use(errorMiddleware);

            // Make 5 successful requests
            for (let i = 1; i <= 5; i++) {
                const res = await request(hourlyApp)
                    .post("/api/test-hourly")
                    .send({ email: "hourly@example.com", purpose: "EMAIL_VERIFICATION" })
                    .expect(200);
                expect(res.headers["x-ratelimit-remaining"]).toBe(String(5 - i));
            }

            // 6th request should hit 429
            const res6 = await request(hourlyApp)
                .post("/api/test-hourly")
                .send({ email: "hourly@example.com", purpose: "EMAIL_VERIFICATION" })
                .expect(429);

            expect(res6.body.error.code).toBe("OTP_EMAIL_LIMIT_EXCEEDED");
            expect(res6.headers["retry-after"]).toBeDefined();
        });
    });

    // ============================================================
    // 5. IP Hourly Limit (10 per hour)
    // ============================================================

    describe("5. IP-Based Abuse Protection (10 requests / hour / IP)", () => {
        it("should enforce maximum 10 OTP generation requests from a single IP", async () => {
            const ipApp = express();
            ipApp.use(express.json());
            ipApp.use((req, res, next) => {
                req.userId = req.headers["x-client-ip"] || "ip-127.0.0.1";
                req.validatedBody = req.body;
                next();
            });

            ipApp.post(
                "/api/test-ip-limit",
                otpIpLimitMiddleware,
                (req, res) => res.status(200).json({ success: true })
            );
            ipApp.use(errorMiddleware);

            // 10 requests from same client IP across different dummy emails
            for (let i = 1; i <= 10; i++) {
                await request(ipApp)
                    .post("/api/test-ip-limit")
                    .set("x-client-ip", "198.51.100.42")
                    .send({ email: `victim${i}@example.com`, purpose: "EMAIL_VERIFICATION" })
                    .expect(200);
            }

            // 11th request from same IP should be blocked
            const blockedRes = await request(ipApp)
                .post("/api/test-ip-limit")
                .set("x-client-ip", "198.51.100.42")
                .send({ email: "victim11@example.com", purpose: "EMAIL_VERIFICATION" })
                .expect(429);

            expect(blockedRes.body.error.code).toBe("OTP_IP_LIMIT_EXCEEDED");

            // But a different IP should still be allowed
            await request(ipApp)
                .post("/api/test-ip-limit")
                .set("x-client-ip", "198.51.100.99")
                .send({ email: "victim11@example.com", purpose: "EMAIL_VERIFICATION" })
                .expect(200);
        });
    });

    // ============================================================
    // 6. Response Headers and Structure Verification
    // ============================================================

    describe("6. Standard Rate Limit Headers and Error Response", () => {
        it("should include X-RateLimit-Limit, Remaining, Reset, and Retry-After on 429", async () => {
            await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(200);

            const res = await request(app)
                .post("/api/users/request-email-verification")
                .set("x-user-id", testUser._id.toString())
                .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
                .expect(429);

            expect(res.headers).toHaveProperty("x-ratelimit-limit");
            expect(res.headers).toHaveProperty("x-ratelimit-remaining");
            expect(res.headers).toHaveProperty("x-ratelimit-reset");
            expect(res.headers).toHaveProperty("retry-after");

            expect(res.body).toEqual({
                success: false,
                error: {
                    code: "OTP_COOLDOWN_EXCEEDED",
                    message: "Please wait 60 seconds before requesting another verification code.",
                },
            });
        });
    });

    // ============================================================
    // 7. Concurrent Request Handling (Race Condition Defense)
    // ============================================================

    describe("7. Concurrency & Parallel Request Handling", () => {
        it("should only allow exactly 1 request through when 10 requests fire in parallel", async () => {
            const parallelRequests = Array.from({ length: 10 }).map(() =>
                request(app)
                    .post("/api/users/request-email-verification")
                    .set("x-user-id", testUser._id.toString())
                    .send({ email: testUser.email, purpose: "EMAIL_VERIFICATION" })
            );

            const responses = await Promise.all(parallelRequests);

            const successResponses = responses.filter((r) => r.status === 200);
            const rateLimitedResponses = responses.filter((r) => r.status === 429);

            expect(successResponses.length).toBe(1);
            expect(rateLimitedResponses.length).toBe(9);

            // Exactly 1 email sent
            expect(emailService.sendEmailVerification).toHaveBeenCalledTimes(1);
        });
    });
});
