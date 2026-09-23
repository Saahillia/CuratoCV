import jwt from "jsonwebtoken";
import logger from "../configs/logger.js";
import ApiError from "../utils/apiError.js";
import User from "../models/User.js";

// ============================================================
// Configuration
// ============================================================

const JWT_ALGORITHM = "HS256";
const MAX_AUTHORIZATION_HEADER_LENGTH = 16 * 1024;

// Deployment timestamp for JWT TokenVersion migration
// Epoch time: 2026-09-10T00:00:00.000Z (Tokens issued before this time without tokenVersion are legacy)
const LEGACY_MIGRATION_CUTOFF = new Date("2026-09-10T00:00:00.000Z").getTime();

// ============================================================
// Helpers
// ============================================================

const getBearerToken = (authorizationHeader) => {
    if (typeof authorizationHeader !== "string") {
        return null;
    }

    const authorization = authorizationHeader.trim();

    if (!authorization) {
        return null;
    }

    if (authorization.length > MAX_AUTHORIZATION_HEADER_LENGTH) {
        return null;
    }

    const separatorIndex = authorization.indexOf(" ");

    if (separatorIndex === -1) {
        return null;
    }

    const scheme = authorization.slice(0, separatorIndex).trim();
    const token = authorization.slice(separatorIndex + 1).trim();

    if (scheme.toLowerCase() !== "bearer") {
        return null;
    }

    if (!token) {
        return null;
    }

    if (/\s/.test(token)) {
        return null;
    }

    return token;
};

const isValidUserId = (userId) => {
    return (
        typeof userId === "string" &&
        /^[a-fA-F0-9]{24}$/.test(userId)
    );
};

// ============================================================
// Authentication Middleware
// ============================================================

const protect = async (req, res, next) => {
    const jwtSecret = process.env.JWT_SECRET;

    if (typeof jwtSecret !== "string" || jwtSecret.length < 32) {
        logger.error(
            "Authentication configuration error: JWT_SECRET is missing or too weak."
        );

        return next(
            ApiError.internal("Authentication service is not configured correctly.")
        );
    }

    const token = getBearerToken(req.headers.authorization);

    if (!token) {
        return next(ApiError.unauthorized("Authentication required."));
    }

    try {
        const decoded = jwt.verify(token, jwtSecret, {
            algorithms: [JWT_ALGORITHM],
        });

        if (!decoded || typeof decoded !== "object") {
            return next(ApiError.unauthorized("Authentication failed."));
        }

        if (!decoded.userId) {
            return next(ApiError.unauthorized("Authentication failed."));
        }

        // Convert to string for comparison
        const userIdString = decoded.userId.toString();

        if (!isValidUserId(userIdString)) {
            logger.error(
                "Authentication rejected: JWT does not contain a valid userId."
            );
            return next(ApiError.unauthorized("Authentication failed."));
        }

        // Fetch user from database for tokenVersion validation
        const user = await User.findById(userIdString);
        if (!user) {
            // User doesn't exist - unauthorized
            return next(ApiError.unauthorized("Authentication failed."));
        }

        // Legacy migration policy:
        // - If JWT contains tokenVersion, require exact match
        // - If JWT does NOT contain tokenVersion (legacy token), check if it's within migration window
        if ("tokenVersion" in decoded) {
            // Modern token: require exact tokenVersion match
            if (decoded.tokenVersion !== user.tokenVersion) {
                logger.warn(
                    `Authentication rejected: tokenVersion mismatch. JWT: ${decoded.tokenVersion}, DB: ${user.tokenVersion}`
                );
                return next(ApiError.unauthorized("Authentication failed."));
            }
        } else {
            // Legacy token: accept only if issued before migration cutoff
            const tokenIat = decoded.iat * 1000; // Convert from seconds to milliseconds
            if (tokenIat >= LEGACY_MIGRATION_CUTOFF) {
                logger.warn(
                    `Authentication rejected: legacy token issued after migration cutoff. IAT: ${new Date(
                        tokenIat
                    ).toISOString()}, Cutoff: ${new Date(
                        LEGACY_MIGRATION_CUTOFF
                    ).toISOString()}`
                );
                return next(ApiError.unauthorized("Authentication failed."));
            }
            // Legacy token issued before cutoff is accepted (will naturally expire within 1h of its iat)
        }

        req.userId = userIdString;
        req.auth = decoded;

        return next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn("Authentication rejected: expired token.");
            return next(ApiError.unauthorized("Authentication token has expired."));
        }

        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn("Authentication rejected: invalid token.");
            return next(ApiError.unauthorized("Authentication token is invalid."));
        }

        logger.error("Authentication verification error:", error);
        return next(ApiError.unauthorized("Authentication failed."));
    }
};

export default protect;
