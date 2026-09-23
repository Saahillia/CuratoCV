// ============================================================
// CuratoCV Authentication Utilities
// ============================================================
//
// Authentication-specific utilities.
//
// Responsibilities:
// - Password hashing
// - Password verification
// - JWT generation
// - JWT validation
//
// NOT responsible for:
// - HTTP request handling
// - Database operations
// - User existence checks
// - Authorization decisions
//
// SECURITY REQUIREMENTS:
// - Use strong password hashing (bcrypt)
// - Use constant-time password comparison
// - Use secure JWT configuration
// - Never expose implementation details
// ============================================================

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ============================================================
// Configuration
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET?.trim();
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRY = "1h";

const BCRYPT_SALT_ROUNDS = 12;

// ============================================================
// Password Hashing
// ============================================================

/**
 * Hash a password using bcrypt.
 *
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
const hashPassword = async (plainPassword) => {
    if (typeof plainPassword !== "string" || !plainPassword.trim()) {
        throw new TypeError("Password must be a non-empty string.");
    }

    return await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
};

// ============================================================
// Password Verification
// ============================================================

/**
 * Verify a password against a hash using bcrypt.
 *
 * This uses bcrypt.compare() which is constant-time.
 *
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
    if (typeof plainPassword !== "string" || !plainPassword.trim()) {
        return false;
    }

    if (typeof hashedPassword !== "string" || !hashedPassword.trim()) {
        return false;
    }

    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch {
        return false;
    }
};

// ============================================================
// JWT Generation
// ============================================================

/**
 * Generate a JWT for a user.
 *
 * @param {Object} payload
 * @param {string|ObjectId} payload.userId
 * @param {string} [payload.email]
 * @param {number} [payload.tokenVersion] - User's current tokenVersion from DB
 * @returns {string}
 */
const generateToken = (payload) => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    if (!payload || typeof payload !== "object") {
        throw new TypeError("JWT payload must be an object.");
    }

    if (!payload.userId) {
        throw new TypeError("JWT payload must contain a userId.");
    }

    const tokenVersion = typeof payload.tokenVersion === "number" ? payload.tokenVersion : 0;

    return jwt.sign(
        {
            userId: payload.userId.toString(),
            ...(payload.email && { email: payload.email }),
            tokenVersion,
            iss: "curatocv",
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            algorithm: JWT_ALGORITHM,
            expiresIn: JWT_EXPIRY,
        }
    );
};

// ============================================================
// JWT Verification
// ============================================================

/**
 * Verify a JWT and return the decoded payload.
 *
 * @param {string} token
 * @returns {Promise<Object>}
 */
const verifyToken = async (token) => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    if (typeof token !== "string" || !token.trim()) {
        throw new TypeError("JWT token must be a non-empty string.");
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: [JWT_ALGORITHM],
        });

        if (!decoded || typeof decoded !== "object") {
            throw new jwt.JsonWebTokenError("Invalid token payload.");
        }

        if (!decoded.userId) {
            throw new jwt.JsonWebTokenError("Token does not contain a userId.");
        }

        return decoded;
    } catch (error) {
        // ----------------------------------------------------
        // Map JWT errors to standardized error messages
        // ----------------------------------------------------

        if (error instanceof jwt.TokenExpiredError) {
            const authError = new Error("Authentication token has expired.");
            authError.code = "TOKEN_EXPIRED";
            throw authError;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            const authError = new Error("Authentication token is invalid.");
            authError.code = "INVALID_TOKEN";
            throw authError;
        }

        // ----------------------------------------------------
        // Re-throw with application error code
        // ----------------------------------------------------

        const authError = new Error("Authentication token verification failed.");
        authError.code = "AUTHENTICATION_ERROR";
        throw authError;
    }
};

// ============================================================
// Export
// ============================================================

const authUtils = Object.freeze({
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
});

export default authUtils;
