import mongoose from "mongoose";

// ============================================================
// CuratoCV OTP Model
// ============================================================
//
// Short-lived OTP challenges for email verification and password reset.
// Represents a transient challenge, NOT permanent user data.
//
// Responsible for:
// - OTP challenge persistence (hashed form only)
// - Expiration bounds (via TTL and explicit query validation)
// - Attempt counting constraints
// - Basic schema-level validation
//
// NOT responsible for:
// - OTP generation or hashing (belongs in otpService)
// - Sending emails or notifications
// - Resend cooldowns, rate limits, or replacement logic
// - Pre/post save hooks (deliberately simple model)
//
// SECURITY CONSTRAINTS:
// - `otpHash` uses `select: false` to prevent accidental inclusion
// - Plaintext OTPs must NEVER be stored, logged, or serialized
// - Indexes MUST NOT be declared `unique: true` across email/userId
//   (allowing different purposes to coexist until replaced by service)
// ============================================================

const otpSchema = new mongoose.Schema(
    {
        // ----------------------------------------------------
        // User Reference (Optional)
        // ----------------------------------------------------
        // Optional because password-reset requests must not expose
        // whether an email belongs to an existing account.
        // ----------------------------------------------------

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true,
        },

        // ----------------------------------------------------
        // Email (Normalized)
        // ----------------------------------------------------

        email: {
            type: String,
            required: [true, "Email is required."],
            trim: true,
            lowercase: true,
            maxlength: 254,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address.",
            ],
            index: true,
        },

        // ----------------------------------------------------
        // Purpose Enum
        // ----------------------------------------------------

        purpose: {
            type: String,
            required: [true, "Purpose is required."],
            enum: {
                values: ["EMAIL_VERIFICATION", "PASSWORD_RESET"],
                message: "{VALUE} is not a valid OTP purpose.",
            },
            index: true,
        },

        // ----------------------------------------------------
        // Hashed OTP
        // ----------------------------------------------------
        // Hidden from default query projections.
        // ----------------------------------------------------

        otpHash: {
            type: String,
            required: [true, "OTP hash is required."],
            select: false,
        },

        // ----------------------------------------------------
        // Expiration Date
        // ----------------------------------------------------

        expiresAt: {
            type: Date,
            required: [true, "Expiration date is required."],
            index: true,
        },

        // ----------------------------------------------------
        // Verification Attempt Tracker
        // ----------------------------------------------------

        attempts: {
            type: Number,
            default: 0,
            min: [0, "Attempts cannot be negative."],
        },

        // ----------------------------------------------------
        // Maximum Allowed Attempts
        // ----------------------------------------------------
        // Policy owned by otpService, bounded by model.
        // ----------------------------------------------------

        maxAttempts: {
            type: Number,
            default: 5,
            min: [1, "Max attempts must be at least 1."],
            max: [10, "Max attempts cannot exceed 10."],
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

// ----------------------------------------------------
// TTL Index for automatic MongoDB cleanup
// ----------------------------------------------------
// Automatic document deletion once `expiresAt` is reached.
// Note: Service must STILL explicitly check `expiresAt <= Date.now()`
// because TTL removal is a background process.
// ----------------------------------------------------

otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "otp_expires_at_ttl" }
);

// ----------------------------------------------------
// Compound index for active-challenge lookups
// ----------------------------------------------------
// Efficient lookup for: find latest OTP by email + purpose
// ----------------------------------------------------

otpSchema.index(
    { email: 1, purpose: 1, createdAt: -1 },
    { name: "otp_email_purpose_created_at" }
);

// ============================================================
// Model Export
// ============================================================

const OTP = mongoose.models.OTP || mongoose.model("OTP", otpSchema);

export default OTP;
