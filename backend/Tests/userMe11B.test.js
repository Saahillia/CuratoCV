import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userService from "../../platform/backend/src/services/userService.js";
import userValidator from "../Validators/userValidator.js";
import User from "../../platform/backend/src/models/User.js";
import { createUser } from "./factories.js";

describe("Phase 11B — Canonical Account/Profile API", () => {
    let user;

    beforeEach(async () => {
        user = await createUser({
            name: "Initial Name",
            email: "user11b@example.com",
            password: "SecurePassword123!",
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("GET /api/users/me (getCurrentUser)", () => {
        it("should return the expected public fields and omit sensitive fields", async () => {
            const dto = await userService.getCurrentUser(user._id);

            expect(dto).toHaveProperty("id");
            expect(dto.id).toBe(user._id.toString());
            expect(dto).toHaveProperty("name", "Initial Name");
            expect(dto).toHaveProperty("email", "user11b@example.com");
            expect(dto).toHaveProperty("emailVerified", false);
            expect(dto).toHaveProperty("createdAt");
            expect(dto).toHaveProperty("updatedAt");

            // Verify sensitive internals are absent
            expect(dto).not.toHaveProperty("password");
            expect(dto).not.toHaveProperty("tokenVersion");
            expect(dto).not.toHaveProperty("otp");
            expect(dto).not.toHaveProperty("passwordResetToken");
        });

        it("should throw NotFound if user does not exist", async () => {
            const nonExistentId = "60c72b2f9b1d8b277c8e9f2a";
            await expect(userService.getCurrentUser(nonExistentId)).rejects.toThrow();
        });
    });

    describe("PATCH /api/users/me (updateCurrentUser & Validator)", () => {
        it("should validate and update name correctly", async () => {
            const validationResult = userValidator.validateProfileUpdate({
                name: "  Updated Name  ",
            });

            expect(validationResult.valid).toBe(true);
            expect(validationResult.data.name).toBe("Updated Name");

            const updatedDto = await userService.updateCurrentUser(
                user._id,
                validationResult.data
            );

            expect(updatedDto.name).toBe("Updated Name");

            const dbUser = await User.findById(user._id);
            expect(dbUser.name).toBe("Updated Name");
        });

        it("should reject empty name", () => {
            const result = userValidator.validateProfileUpdate({ name: "" });
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("should reject whitespace-only name", () => {
            const result = userValidator.validateProfileUpdate({ name: "   " });
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("should reject names longer than 100 characters", () => {
            const longName = "a".repeat(101);
            const result = userValidator.validateProfileUpdate({ name: longName });
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("should reject non-string names", () => {
            const result = userValidator.validateProfileUpdate({ name: 12345 });
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("should reject missing name", () => {
            const result = userValidator.validateProfileUpdate({});
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("should reject unknown/unsupported fields (mass assignment protection)", () => {
            const result = userValidator.validateProfileUpdate({
                name: "Valid Name",
                emailVerified: true,
                tokenVersion: 999,
                password: "hacked",
                email: "attacker@example.com",
            });

            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "emailVerified")).toBe(true);
            expect(result.errors.some((e) => e.field === "tokenVersion")).toBe(true);
            expect(result.errors.some((e) => e.field === "password")).toBe(true);
            expect(result.errors.some((e) => e.field === "email")).toBe(true);
        });
    });
});
