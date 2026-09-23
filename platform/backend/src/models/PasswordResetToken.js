import mongoose from "mongoose";
import crypto from "crypto";

// ============================================================
// CuratoCV Password Reset Token Model
// ============================================================
//
// Responsible for:
// - Storing short-lived password reset credentials
// - Tracking token usage and expiration
//
// NOT responsible for:
// - OTP generation/verification (handled by otpService)
// - HTTP responses
// - Password hashing
// ============================================================

// ============================================================
// Configuration
// ============================================================

const RESET_TOKEN_EXPIRES_MINUTES = parseInt(process.env.RESET_TOKEN_EXPIRES_MINUTES, 10) || 10;
const RESET_TOKEN_BYTES = 32;

// ============================================================
// Schema
// ============================================================

const passwordResetTokenSchema = new mongoose.Schema(
    {
        // ----------------------------------------------------
        // User Reference
        // ----------------------------------------------------

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // ----------------------------------------------------
        // Token Hash
        // ----------------------------------------------------
        //
        // Only the hash is stored. The plaintext token is
        // returned to the client exactly once upon creation.
        // ----------------------------------------------------

        tokenHash: {
            type: String,
            required: true,
            select: false,
        },

        // ----------------------------------------------------
        // Expiration
        // ----------------------------------------------------

        expiresAt: {
            type: Date,
            required: true,
            // TTL index for automatic cleanup of expired tokens
            // expires: 0 means document expires when expiresAt is reached
        },

        // ----------------------------------------------------
        // Usage Tracking
        // ----------------------------------------------------

        usedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,

        minimize: false,

        strict: true,

        versionKey: "__v",
    }
);

// ============================================================
// Indexes
// ============================================================

// TTL index: automatically remove documents when expiresAt is reached
passwordResetTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

// Compound index for efficient lookup: find valid unused token by user
passwordResetTokenSchema.index(
    { userId: 1, usedAt: 1, expiresAt: 1 },
    { name: "password_reset_token_lookup" }
);

// ============================================================
// Static Methods
// ============================================================

/**
 * Generate a cryptographically secure random reset token.
 *
 * @returns {Object} { token: string, tokenHash: string, expiresAt: Date }
 */
passwordResetTokenSchema.statics.generateToken = function () {
    const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

    return { token, tokenHash, expiresAt };
};

/**
 * Hash a plaintext token for comparison.
 *
 * @param {string} token
 * @returns {string}
 */
passwordResetTokenSchema.statics.hashToken = function (token) {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Find a valid (unused, not expired) reset token by hash.
 *
 * @param {string} tokenHash
 * @returns {Promise<Document|null>}
 */
passwordResetTokenSchema.statics.findValidToken = async function (tokenHash) {
    return this.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
    });
};

/**
 * Atomically consume a reset token.
 * Uses findOneAndUpdate to ensure only one request succeeds.
 *
 * @param {string} tokenHash
 * @returns {Promise<Document|null>} The consumed token document, or null if not found/already used/expired
 */
passwordResetTokenSchema.statics.consumeToken = async function (tokenHash) {
    return this.findOneAndUpdate(
        {
            tokenHash,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        },
        {
            $set: { usedAt: new Date() },
        },
        { returnDocument: "after" }
    );
};

/**
 * Invalidate all reset tokens for a user (e.g., after successful password reset).
 *
 * @param {mongoose.Types.ObjectId|string} userId
 * @returns {Promise<void>}
 */
passwordResetTokenSchema.statics.invalidateUserTokens = async function (userId) {
    await this.updateMany(
        { userId, usedAt: null },
        { $set: { usedAt: new Date() } }
    );
};

// ============================================================
// Model
// ============================================================

const PasswordResetToken =
    mongoose.models.PasswordResetToken ||
    mongoose.model("PasswordResetToken", passwordResetTokenSchema);

export default PasswordResetToken;