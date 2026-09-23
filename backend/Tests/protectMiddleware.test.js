import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import protect from "../Middlewares/authMiddleware.js";
import User from "../../platform/backend/src/models/User.js";
import { createUser } from "./factories.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_tests_that_is_32_chars_long!!";
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = JWT_SECRET;

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

describe("protect() Middleware", () => {
    let user;
    
    beforeEach(async () => {
        user = await createUser();
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should authorize a valid modern token with matching tokenVersion", async () => {
        const token = jwt.sign(
            { userId: user._id.toString(), tokenVersion: user.tokenVersion },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const req = mockRequest(token);
        const res = mockResponse();
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalledWith(); // Called without error
        expect(req.userId).toBe(user._id.toString());
        expect(req.auth.tokenVersion).toBe(user.tokenVersion);
    });

    it("should reject a modern token with mismatched tokenVersion", async () => {
        const token = jwt.sign(
            { userId: user._id.toString(), tokenVersion: user.tokenVersion + 1 },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const req = mockRequest(token);
        const res = mockResponse();
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        const arg = next.mock.calls[0][0];
        expect(arg.statusCode).toBe(401);
        expect(arg.message).toMatch(/Authentication failed/);
    });

    it("should reject token for deleted/non-existent user", async () => {
        const token = jwt.sign(
            { userId: user._id.toString(), tokenVersion: user.tokenVersion },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        await User.findByIdAndDelete(user._id);

        const req = mockRequest(token);
        const res = mockResponse();
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        const arg = next.mock.calls[0][0];
        expect(arg.statusCode).toBe(401);
    });

    it("should reject legacy token (NO tokenVersion) issued AFTER cutoff", async () => {
        // Cutoff is 2026-09-10T00:00:00.000Z
        const afterCutoffIat = Math.floor(new Date("2026-09-11T00:00:00.000Z").getTime() / 1000);
        
        const token = jwt.sign(
            { userId: user._id.toString(), iat: afterCutoffIat },
            JWT_SECRET
        );
        
        const req = mockRequest(token);
        const res = mockResponse();
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        const arg = next.mock.calls[0][0];
        expect(arg.statusCode).toBe(401);
    });

    it("should authorize legacy token (NO tokenVersion) issued BEFORE cutoff", async () => {
        // Cutoff is 2026-09-10T00:00:00.000Z
        const beforeCutoffIat = Math.floor(new Date("2026-09-09T00:00:00.000Z").getTime() / 1000);
        
        const token = jwt.sign(
            { userId: user._id.toString(), iat: beforeCutoffIat },
            JWT_SECRET
        );
        
        const req = mockRequest(token);
        const res = mockResponse();
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalledWith(); // Authorized
        expect(req.userId).toBe(user._id.toString());
    });
    
    it("should reject invalid signatures", async () => {
        const token = jwt.sign(
            { userId: user._id.toString(), tokenVersion: user.tokenVersion },
            "wrong_secret"
        );
        const req = mockRequest(token);
        const res = mockResponse();
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        const arg = next.mock.calls[0][0];
        expect(arg.statusCode).toBe(401);
    });
    
    it("should reject if userId is invalid format", async () => {
        const token = jwt.sign(
            { userId: "invalid_id_format" },
            JWT_SECRET
        );
        const req = mockRequest(token);
        const res = mockResponse();
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        const arg = next.mock.calls[0][0];
        expect(arg.statusCode).toBe(401);
    });
});
