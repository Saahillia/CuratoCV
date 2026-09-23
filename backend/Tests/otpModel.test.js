import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import OTP from "../../platform/backend/src/models/OTP.js";
import { createUser } from "./factories.js";

describe("OTP Model Schema Tests", () => {
    it("should accept a valid OTP document with defaults", async () => {
        const validOTPData = {
            email: "test@example.com",
            purpose: "EMAIL_VERIFICATION",
            otpHash: "$2b$12$eImiTXuWVxfM37uY4JANjOL.81F8Rze.V3vI6S9D8/VdY2g.e8yKO", // sample hash
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        };

        const otp = new OTP(validOTPData);
        await otp.save();

        expect(otp._id).toBeDefined();
        expect(otp.email).toBe("test@example.com");
        expect(otp.purpose).toBe("EMAIL_VERIFICATION");
        expect(otp.attempts).toBe(0);
        expect(otp.maxAttempts).toBe(5);
        expect(otp.createdAt).toBeDefined();
        expect(otp.updatedAt).toBeDefined();
    });

    it("should accept optional userId as ObjectId", async () => {
        const user = await createUser();

        const otp = new OTP({
            userId: user._id,
            email: user.email,
            purpose: "EMAIL_VERIFICATION",
            otpHash: "hashed_otp_value",
            expiresAt: new Date(Date.now() + 600000),
        });

        await otp.save();

        expect(otp.userId).toEqual(user._id);
    });

    it("should normalize email to lowercase and trim spaces", async () => {
        const otp = new OTP({
            email: "  User.TEST@Example.COM  ",
            purpose: "PASSWORD_RESET",
            otpHash: "hashed_otp_value",
            expiresAt: new Date(Date.now() + 600000),
        });

        await otp.save();

        expect(otp.email).toBe("user.test@example.com");
    });

    it("should accept valid purpose EMAIL_VERIFICATION and PASSWORD_RESET", async () => {
        const otpVerification = new OTP({
            email: "user1@example.com",
            purpose: "EMAIL_VERIFICATION",
            otpHash: "hash1",
            expiresAt: new Date(Date.now() + 600000),
        });
        await otpVerification.save();
        expect(otpVerification.purpose).toBe("EMAIL_VERIFICATION");

        const otpReset = new OTP({
            email: "user2@example.com",
            purpose: "PASSWORD_RESET",
            otpHash: "hash2",
            expiresAt: new Date(Date.now() + 600000),
        });
        await otpReset.save();
        expect(otpReset.purpose).toBe("PASSWORD_RESET");
    });

    it("should reject invalid purpose enum values", async () => {
        const otpInvalid = new OTP({
            email: "user@example.com",
            purpose: "INVALID_PURPOSE",
            otpHash: "hash",
            expiresAt: new Date(Date.now() + 600000),
        });

        await expect(otpInvalid.save()).rejects.toThrow();
    });

    it("should require email, purpose, otpHash, and expiresAt", async () => {
        const incompleteOTP = new OTP({});

        let error;
        try {
            await incompleteOTP.save();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.purpose).toBeDefined();
        expect(error.errors.otpHash).toBeDefined();
        expect(error.errors.expiresAt).toBeDefined();
    });

    it("should exclude otpHash from normal query projections (select: false)", async () => {
        const otp = await OTP.create({
            email: "secret@example.com",
            purpose: "EMAIL_VERIFICATION",
            otpHash: "top_secret_hash_value",
            expiresAt: new Date(Date.now() + 600000),
        });

        const queriedOTP = await OTP.findById(otp._id);
        expect(queriedOTP.otpHash).toBeUndefined();

        const queriedWithSecret = await OTP.findById(otp._id).select("+otpHash");
        expect(queriedWithSecret.otpHash).toBe("top_secret_hash_value");
    });

    it("should enforce attempt bounds (min 0 for attempts; min 1, max 10 for maxAttempts)", async () => {
        const otpNegativeAttempts = new OTP({
            email: "test@example.com",
            purpose: "EMAIL_VERIFICATION",
            otpHash: "hash",
            expiresAt: new Date(Date.now() + 600000),
            attempts: -1,
        });
        await expect(otpNegativeAttempts.save()).rejects.toThrow();

        const otpZeroMaxAttempts = new OTP({
            email: "test@example.com",
            purpose: "EMAIL_VERIFICATION",
            otpHash: "hash",
            expiresAt: new Date(Date.now() + 600000),
            maxAttempts: 0,
        });
        await expect(otpZeroMaxAttempts.save()).rejects.toThrow();

        const otpExcessiveMaxAttempts = new OTP({
            email: "test@example.com",
            purpose: "EMAIL_VERIFICATION",
            otpHash: "hash",
            expiresAt: new Date(Date.now() + 600000),
            maxAttempts: 11,
        });
        await expect(otpExcessiveMaxAttempts.save()).rejects.toThrow();
    });

    it("should verify defined schema indexes including TTL and compound lookup index", async () => {
        const indexes = OTP.schema.indexes();

        // Check for TTL index on expiresAt
        const ttlIndex = indexes.find(
            ([fields, options]) => fields.expiresAt === 1 && options?.expireAfterSeconds === 0
        );
        expect(ttlIndex).toBeDefined();

        // Check for compound index on email, purpose, createdAt
        const compoundIndex = indexes.find(
            ([fields]) => fields.email === 1 && fields.purpose === 1 && fields.createdAt === -1
        );
        expect(compoundIndex).toBeDefined();
    });

    it("should NOT have unique constraint on email, userId, or purpose (allowing multiple purposes)", async () => {
        const email = "shared@example.com";

        // Create verification OTP
        await OTP.create({
            email,
            purpose: "EMAIL_VERIFICATION",
            otpHash: "hash1",
            expiresAt: new Date(Date.now() + 600000),
        });

        // Create password reset OTP for the same email simultaneously without unique conflict
        await expect(
            OTP.create({
                email,
                purpose: "PASSWORD_RESET",
                otpHash: "hash2",
                expiresAt: new Date(Date.now() + 600000),
            })
        ).resolves.toBeDefined();
    });
});
