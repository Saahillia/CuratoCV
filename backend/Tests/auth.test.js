import { describe, it, expect, beforeEach, vi } from "vitest";
import { createUser, createAuthToken } from "./factories.js";
import userService from "../../platform/backend/src/services/userService.js";
import authUtils from "../Utils/authUtils.js";
import User from "../../platform/backend/src/models/User.js";
import jwt from "jsonwebtoken";

describe("Authentication Tests", () => {
    describe("User Registration", () => {
        it("should register a new user with valid credentials", async () => {
            const userData = {
                name: "Test User",
                email: "newuser@example.com",
                password: "SecurePassword123!",
            };

            const result = await userService.registerUser(userData);

            expect(result).toHaveProperty("userId");
            expect(result).toHaveProperty("token");
            expect(result.email).toBe(userData.email);
            expect(result.name).toBe(userData.name);
            expect(result).not.toHaveProperty("password");

            // Verify User document receives emailVerified: false
            const userInDb = await User.findById(result.userId);
            expect(userInDb.emailVerified).toBe(false);
        });

        it("should reject registration with duplicate email", async () => {
            const email = "duplicate@example.com";

            await createUser({ email });

            await expect(
                userService.registerUser({
                    name: "Another User",
                    email,
                    password: "Password123!",
                })
            ).rejects.toThrow();
        });

        it("should hash password before storing", async () => {
            const password = "PlainPassword123!";

            const user = await createUser({ password });

            const userWithPassword = await User.findById(user._id).select("+password");
            expect(userWithPassword.password).not.toBe(password);
        });
    });

    describe("User Login", () => {
        beforeEach(async () => {
            await createUser({
                email: "login@example.com",
                password: "TestPassword123!",
            });
        });

        it("should login with correct credentials", async () => {
            const result = await userService.loginUser({
                email: "login@example.com",
                password: "TestPassword123!",
            });

            expect(result).toHaveProperty("userId");
            expect(result).toHaveProperty("token");
            expect(result.email).toBe("login@example.com");
        });

        it("should reject login with incorrect password", async () => {
            await expect(
                userService.loginUser({
                    email: "login@example.com",
                    password: "WrongPassword123!",
                })
            ).rejects.toThrow();
        });

        it("should reject login with non-existent email", async () => {
            await expect(
                userService.loginUser({
                    email: "nonexistent@example.com",
                    password: "TestPassword123!",
                })
            ).rejects.toThrow();
        });
    });

    describe("JWT Token Validation", () => {
        it("should generate valid JWT token", async () => {
            const user = await createUser();
            const token = createAuthToken(user);

            expect(token).toBeTruthy();
            expect(typeof token).toBe("string");
            expect(token.split(".")).toHaveLength(3);
        });

        it("should include tokenVersion in generated token", async () => {
            const user = await createUser();
            const token = createAuthToken(user);

            const decoded = await authUtils.verifyToken(token);

            expect(decoded).toHaveProperty("userId");
            expect(decoded).toHaveProperty("tokenVersion");
            expect(decoded.userId).toBe(user._id.toString());
            expect(decoded.tokenVersion).toBe(user.tokenVersion);
        });

        it("should verify and decode valid token", async () => {
            const user = await createUser();
            const token = createAuthToken(user);

            const decoded = await authUtils.verifyToken(token);

            expect(decoded).toHaveProperty("userId");
            expect(decoded.userId).toBe(user._id.toString());
        });

        it("should reject invalid or expired tokens", async () => {
            const invalidToken = "invalid.jwt.token";

            await expect(authUtils.verifyToken(invalidToken)).rejects.toThrow();
        });

        it("should not be controllable by client input", async () => {
            const user = await createUser();
            const token = createAuthToken(user);

            const decoded = jwt.decode(token);
            expect(decoded.tokenVersion).toBe(user.tokenVersion);

            // Verify that payload is correct in DB
            const dbUser = await User.findById(user._id);
            expect(dbUser.tokenVersion).toBe(user.tokenVersion);
        });
    });

    describe("User Schema emailVerified & compatibility", () => {
        it("should set emailVerified to false by default for new users", async () => {
            const user = await createUser();
            expect(user.emailVerified).toBe(false);

            const userInDb = await User.findById(user._id);
            expect(userInDb.emailVerified).toBe(false);
        });

        it("should not contain OTP or password reset fields in User schema", () => {
            const schemaPaths = Object.keys(User.schema.paths);
            expect(schemaPaths).not.toContain("otpHash");
            expect(schemaPaths).not.toContain("otpExpiry");
            expect(schemaPaths).not.toContain("passwordResetToken");
            expect(schemaPaths).not.toContain("passwordResetExpiry");
        });

        it("should allow existing users without emailVerified to log in without enforcement", async () => {
            // Simulate legacy user in DB without emailVerified
            const legacyEmail = "legacy@example.com";
            const legacyPassword = "LegacyPassword123!";

            const legacyUser = await createUser({
                email: legacyEmail,
                password: legacyPassword,
            });

            // Strip emailVerified field directly in MongoDB
            await User.collection.updateOne(
                { _id: legacyUser._id },
                { $unset: { emailVerified: "" } }
            );

            // Legacy user can still login normally
            const loginResult = await userService.loginUser({
                email: legacyEmail,
                password: legacyPassword,
            });

            expect(loginResult).toHaveProperty("userId");
            expect(loginResult).toHaveProperty("token");
            expect(loginResult.email).toBe(legacyEmail);
        });
    });
});
