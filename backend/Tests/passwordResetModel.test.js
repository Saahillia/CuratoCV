import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import User from "../Models/User.js";
import PasswordResetToken from "../Models/PasswordResetToken.js";
import errorMiddleware from "../Middlewares/errorMiddleware.js";

// Mock App Setup
const app = express();
app.use(express.json());
app.use(errorMiddleware);

describe("PasswordResetToken Model", () => {
    let testUser;

    beforeEach(async () => {
        // Clear collections
        await User.deleteMany({});
        await PasswordResetToken.deleteMany({});

        testUser = await User.create({
            name: "Test User",
            email: "test-" + Date.now() + "@example.com",
            password: "TestPassword123!",
        });
    });

    describe("generateToken", () => {
        it("should generate a token with required fields", () => {
            const { token, tokenHash, expiresAt } = PasswordResetToken.generateToken();

            expect(token).toBeDefined();
            expect(tokenHash).toBeDefined();
            expect(expiresAt).toBeDefined();

            const crypto = require("crypto");
            const expectedHash = crypto.createHash("sha256").update(token).digest("hex");
            expect(tokenHash).toBe(expectedHash);
        });

        it("should set expiresAt according to config", () => {
            const { expiresAt } = PasswordResetToken.generateToken();
            const now = new Date();
            const diffMinutes = (expiresAt - now) / (1000 * 60);
            // Default is 10 min
            expect(diffMinutes).toBeCloseTo(10, 0);
        });
    });

    describe("consumeToken", () => {
        it("should consume token and return document", async () => {
            const { tokenHash, expiresAt } = PasswordResetToken.generateToken();
            const resetToken = new PasswordResetToken({
                userId: testUser._id,
                tokenHash,
                expiresAt,
            });
            await resetToken.save();

            const consumed = await PasswordResetToken.consumeToken(tokenHash);
            expect(consumed).not.toBeNull();
            expect(consumed.usedAt).not.toBeNull();
            expect(consumed.userId.toString()).toBe(testUser._id.toString());

            // Check if already used
            const doubleConsumed = await PasswordResetToken.consumeToken(tokenHash);
            expect(doubleConsumed).toBeNull();
        });

        it("should not consume expired token", async () => {
            const { tokenHash } = PasswordResetToken.generateToken();
            const expiredAt = new Date(Date.now() - 1000 * 60); // 1 min ago
            const resetToken = new PasswordResetToken({
                userId: testUser._id,
                tokenHash,
                expiresAt: expiredAt,
            });
            await resetToken.save();

            const consumed = await PasswordResetToken.consumeToken(tokenHash);
            expect(consumed).toBeNull();
        });
    });
});