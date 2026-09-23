import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userService from "../../platform/backend/src/services/userService.js";
import emailService from "../../platform/backend/src/services/emailService.js";
import otpService from "../../platform/backend/src/services/otpService.js";
import User from "../../platform/backend/src/models/User.js";
import PasswordResetToken from "../../platform/backend/src/models/PasswordResetToken.js";
import OTP from "../../platform/backend/src/models/OTP.js";
import protect from "../../platform/backend/src/middlewares/authMiddleware.js";
import authUtils from "../../platform/backend/src/utils/authUtils.js";
import { createUser } from "./factories.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const mockRequest = (token) => ({
    headers: {
        authorization: token ? `Bearer ${token}` : "",
    },
});

const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe("10H-6 Password Reset Flow Test Suite", () => {
    let user;

    beforeEach(async () => {
        user = await createUser({
            name: "Test User",
            email: "resetuser@example.com",
            password: "OldPassword123!",
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ============================================================
    // 1. Forgot Password Endpoint & Enumeration Protection
    // ============================================================
    describe("Forgot Password", () => {
        it("should return identical generic response for existing email", async () => {
            const result = await userService.forgotPassword(user.email);
            expect(result).toEqual({
                message: "If an account exists, a reset instruction has been sent.",
            });
        });

        it("should return identical generic response for unknown email", async () => {
            const result = await userService.forgotPassword("nonexistent@example.com");
            expect(result).toEqual({
                message: "If an account exists, a reset instruction has been sent.",
            });
        });

        it("should generate PASSWORD_RESET OTP and send email for existing user", async () => {
            const sendSpy = vi.spyOn(emailService, "sendPasswordReset").mockResolvedValue({ success: true });

            await userService.forgotPassword(user.email);

            expect(sendSpy).toHaveBeenCalledTimes(1);
            expect(sendSpy).toHaveBeenCalledWith(user.email, expect.objectContaining({
                userName: user.name,
                resetUrl: expect.stringContaining("/reset-password"),
            }));

            // Verify OTP document created in DB with PASSWORD_RESET purpose
            const otpDoc = await OTP.findOne({ email: user.email, purpose: "PASSWORD_RESET" });
            expect(otpDoc).not.toBeNull();
            expect(otpDoc.purpose).toBe("PASSWORD_RESET");
        });

        it("should handle email delivery failure by invalidating created OTP", async () => {
            vi.spyOn(emailService, "sendPasswordReset").mockResolvedValue({ success: false });

            const result = await userService.forgotPassword(user.email);

            // Client receives generic success response
            expect(result.message).toBe("If an account exists, a reset instruction has been sent.");

            // OTP should be invalidated (deleted) due to email delivery failure
            const otpDoc = await OTP.findOne({ email: user.email, purpose: "PASSWORD_RESET" });
            expect(otpDoc).toBeNull();
        });
    });

    // ============================================================
    // 2. OTP Verification & Purpose Isolation
    // ============================================================
    describe("Reset OTP Verification", () => {
        it("should verify correct OTP and return reset token", async () => {
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });

            const result = await userService.verifyPasswordResetOtp(user.email, otp);

            expect(result).toHaveProperty("resetToken");
            expect(typeof result.resetToken).toBe("string");
            expect(result.resetToken.length).toBeGreaterThanOrEqual(64);
            expect(result.resetToken).not.toBe(otp); // Plaintext token returned, not OTP

            // Verify token document created in DB
            const tokenHash = PasswordResetToken.hashToken(result.resetToken);
            const tokenDoc = await PasswordResetToken.findOne({ tokenHash });
            expect(tokenDoc).not.toBeNull();
            expect(tokenDoc.userId.toString()).toBe(user._id.toString());
        });

        it("should reject wrong OTP", async () => {
            await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });

            await expect(userService.verifyPasswordResetOtp(user.email, "000000")).rejects.toThrow(
                "Invalid or expired verification code."
            );
        });

        it("should reject expired OTP", async () => {
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });

            // Fast-forward OTP expiration
            await OTP.updateOne({ email: user.email, purpose: "PASSWORD_RESET" }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

            await expect(userService.verifyPasswordResetOtp(user.email, otp)).rejects.toThrow(
                "Invalid or expired verification code."
            );
        });

        it("should reject reused OTP (single-use enforcement)", async () => {
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });

            // First verification succeeds
            await userService.verifyPasswordResetOtp(user.email, otp);

            // Second verification fails
            await expect(userService.verifyPasswordResetOtp(user.email, otp)).rejects.toThrow(
                "Invalid or expired verification code."
            );
        });

        it("should enforce PURPOSE ISOLATION: EMAIL_VERIFICATION OTP cannot verify password reset", async () => {
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "EMAIL_VERIFICATION",
            });

            // Attempting to verify reset with email verification OTP must fail
            await expect(userService.verifyPasswordResetOtp(user.email, otp)).rejects.toThrow(
                "Invalid or expired verification code."
            );
        });
    });

    // ============================================================
    // 3. Reset Credential & Atomic Concurrency
    // ============================================================
    describe("Reset Credential & Password Reset", () => {
        it("should hash reset token at rest in MongoDB", async () => {
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });

            const { resetToken } = await userService.verifyPasswordResetOtp(user.email, otp);

            // Plaintext resetToken must NOT be found in DB
            const directSearch = await PasswordResetToken.findOne({ tokenHash: resetToken });
            expect(directSearch).toBeNull();

            // SHA-256 hashed token MUST be in DB
            const tokenHash = PasswordResetToken.hashToken(resetToken);
            const hashSearch = await PasswordResetToken.findOne({ tokenHash });
            expect(hashSearch).not.toBeNull();
        });

        it("should reject invalid reset token", async () => {
            const invalidToken = "a".repeat(64);
            await expect(userService.resetPassword(invalidToken, "NewSecurePassword123!")).rejects.toThrow(
                "Invalid or expired reset token."
            );
        });

        it("should reject expired reset token", async () => {
            const { token, tokenHash } = PasswordResetToken.generateToken();
            await PasswordResetToken.create({
                userId: user._id,
                tokenHash,
                expiresAt: new Date(Date.now() - 1000), // Expired 1 sec ago
            });

            await expect(userService.resetPassword(token, "NewSecurePassword123!")).rejects.toThrow(
                "Invalid or expired reset token."
            );
        });

        it("should reject already used reset token", async () => {
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });
            const { resetToken } = await userService.verifyPasswordResetOtp(user.email, otp);

            // First reset succeeds
            await userService.resetPassword(resetToken, "NewSecurePassword123!");

            // Second reset with same token fails
            await expect(userService.resetPassword(resetToken, "AnotherPassword123!")).rejects.toThrow(
                "Invalid or expired reset token."
            );
        });

        it("should ensure atomic single-use under high concurrency (10 concurrent requests -> 1 succeeds, 9 fail)", async () => {
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });
            const { resetToken } = await userService.verifyPasswordResetOtp(user.email, otp);

            const requests = Array.from({ length: 10 }, (_, i) =>
                userService.resetPassword(resetToken, `NewPassword${i + 1}23!`)
                    .then((res) => ({ status: "fulfilled", value: res }))
                    .catch((err) => ({ status: "rejected", reason: err }))
            );

            const results = await Promise.all(requests);

            const fulfilled = results.filter((r) => r.status === "fulfilled");
            const rejected = results.filter((r) => r.status === "rejected");

            expect(fulfilled).toHaveLength(1);
            expect(rejected).toHaveLength(9);
            expect(fulfilled[0].value.message).toBe("Password reset successfully.");
            rejected.forEach((r) => {
                expect(r.reason.message).toBe("Invalid or expired reset token.");
            });
        });

        // ============================================================
        // 4. Credential Update, Hashing & JWT tokenVersion Revocation
        // ============================================================
        it("should save new password hashed, increment tokenVersion, and revoke old JWTs", async () => {
            const oldToken = authUtils.generateToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });

            // Verify old token works before reset
            const reqBefore = mockRequest(oldToken);
            const resBefore = mockResponse();
            const nextBefore = vi.fn();
            await protect(reqBefore, resBefore, nextBefore);
            expect(nextBefore).toHaveBeenCalledWith();

            // Execute reset
            const { otp } = await otpService.createOtp({
                userId: user._id,
                email: user.email,
                purpose: "PASSWORD_RESET",
            });
            const { resetToken } = await userService.verifyPasswordResetOtp(user.email, otp);
            await userService.resetPassword(resetToken, "BrandNewPassword123!");

            // Verify User DB record
            const updatedUser = await User.findById(user._id).select("+password");
            expect(updatedUser.tokenVersion).toBe(user.tokenVersion + 1);

            // Verify old password fails login
            await expect(userService.loginUser({ email: user.email, password: "OldPassword123!" })).rejects.toThrow();

            // Verify new password succeeds login
            const loginResult = await userService.loginUser({ email: user.email, password: "BrandNewPassword123!" });
            expect(loginResult).toHaveProperty("token");

            // Verify OLD JWT is rejected by protect middleware (tokenVersion mismatch)
            const reqAfter = mockRequest(oldToken);
            const resAfter = mockResponse();
            const nextAfter = vi.fn();
            await protect(reqAfter, resAfter, nextAfter);
            expect(nextAfter).toHaveBeenCalled();
            const errArg = nextAfter.mock.calls[0][0];
            expect(errArg.statusCode).toBe(401);

            // Verify NEW JWT works on protected endpoints
            const reqNew = mockRequest(loginResult.token);
            const resNew = mockResponse();
            const nextNew = vi.fn();
            await protect(reqNew, resNew, nextNew);
            expect(nextNew).toHaveBeenCalledWith();
            expect(reqNew.userId).toBe(user._id.toString());
        });
    });
});
