import crypto from "crypto";
import OTP from "../models/OTP.js";
import ApiError from "../../../../backend/Utils/apiError.js";

// ============================================================
// CuratoCV OTP Service
// ============================================================
//
// Single authority for OTP lifecycle operations:
// - Cryptographically secure generation
// - Keyed HMAC-SHA256 hashing
// - Single active challenge replacement & creation
// - Expiration, max-attempt enforcement & atomic single-use verification
//
// SECURITY CONSTRAINTS:
// - Plaintext OTP exist in memory only during creation and are returned ONLY
//   to the internal service caller (for dispatching emails).
// - Plaintext OTP must NEVER be saved to DB, logged, or serialized into HTTP responses.
// - Verification uses constant-time string comparison (`crypto.timingSafeEqual`).
// - Consumption/verification is atomic (`findOneAndDelete`) to prevent race-condition double use.
// ============================================================

// Configuration constants & defaults
const DEFAULT_OTP_TTL_MINUTES = 10;
const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Get OTP hash secret from process.env with fallback for test environments.
 * @returns {string}
 */
const getOtpHashSecret = () => {
    const secret = process.env.OTP_HASH_SECRET;
    if (typeof secret === "string" && secret.trim().length >= 16) {
        return secret.trim();
    }
    if (process.env.NODE_ENV === "test") {
        return "test_otp_hash_secret_32_bytes_min_length_for_hmac!";
    }
    throw ApiError.internal("OTP authentication configuration error: OTP_HASH_SECRET is missing or too weak.");
};

/**
 * Get TTL in minutes from process.env or default.
 * @returns {number}
 */
const getOtpExpiresMinutes = () => {
    const envVal = process.env.OTP_EXPIRES_MINUTES;
    if (envVal) {
        const parsed = parseInt(envVal, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 60) {
            return parsed;
        }
    }
    return DEFAULT_OTP_TTL_MINUTES;
};

// ============================================================
// 1. generateOtp()
// ============================================================
// Cryptographically secure 6-digit numeric string generation.
// Preserves leading zeroes (e.g., "000731").
// ============================================================
const generateOtp = () => {
    const num = crypto.randomInt(0, 1000000);
    return num.toString().padStart(6, "0");
};

// ============================================================
// 2. hashOtp()
// ============================================================
// Keyed HMAC-SHA256 hash using OTP_HASH_SECRET.
// ============================================================
const hashOtp = (plaintextOtp) => {
    if (typeof plaintextOtp !== "string" || !/^\d{6}$/.test(plaintextOtp)) {
        throw ApiError.badRequest("Invalid OTP format for hashing.");
    }
    const secret = getOtpHashSecret();
    return crypto.createHmac("sha256", secret).update(plaintextOtp).digest("hex");
};

// ============================================================
// Validation Helpers
// ============================================================
const requireValidEmail = (email) => {
    if (typeof email !== "string" || !email.trim()) {
        throw ApiError.badRequest("Email is required.");
    }
    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
        throw ApiError.badRequest("Please provide a valid email address.");
    }
    return normalized;
};

const requireValidPurpose = (purpose) => {
    const validPurposes = ["EMAIL_VERIFICATION", "PASSWORD_RESET"];
    if (typeof purpose !== "string" || !validPurposes.includes(purpose)) {
        throw ApiError.badRequest("Invalid OTP purpose.");
    }
    return purpose;
};

// ============================================================
// 3. createOtp()
// ============================================================
// Atomic creation & replacement:
// - Normalizes email & validates purpose
// - Invalidates existing active OTP for (email + purpose)
// - Generates & hashes new OTP
// - Saves OTP document
// - Returns { otpId, otp } (plaintext returned ONLY for email delivery)
// ============================================================
const createOtp = async ({ userId = null, email, purpose }) => {
    const normalizedEmail = requireValidEmail(email);
    const validPurpose = requireValidPurpose(purpose);

    // 1. Invalidate existing active OTP for email + purpose
    await OTP.deleteMany({
        email: normalizedEmail,
        purpose: validPurpose,
    });

    // 2. Generate OTP & compute hash
    const plaintextOtp = generateOtp();
    const otpHash = hashOtp(plaintextOtp);

    // 3. Compute expiration Date
    const ttlMinutes = getOtpExpiresMinutes();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // 4. Create and save OTP document
    const otpDoc = new OTP({
        userId: userId || undefined,
        email: normalizedEmail,
        purpose: validPurpose,
        otpHash,
        expiresAt,
        attempts: 0,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
    });

    await otpDoc.save();

    return {
        otpId: otpDoc._id.toString(),
        otp: plaintextOtp,
    };
};

// ============================================================
// 4. verifyOtp()
// ============================================================
// Validates supplied OTP against stored challenge:
// - Must exist for (email + purpose)
// - Must not be expired (`expiresAt > Date.now()`)
// - Must not have reached `maxAttempts`
// - Compares hash using constant-time `crypto.timingSafeEqual`
// - On failure: atomically increments attempts
// - On success: ATOMICALLY consumes (deletes) the document using `findOneAndDelete`
//   ensuring single-use even under concurrent verify requests.
// ============================================================
const verifyOtp = async ({ email, purpose, otp }) => {
    const normalizedEmail = requireValidEmail(email);
    const validPurpose = requireValidPurpose(purpose);

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
        throw ApiError.badRequest("Invalid or expired verification code.");
    }

    // 1. Find active OTP challenge including hash
    const otpDoc = await OTP.findOne({
        email: normalizedEmail,
        purpose: validPurpose,
    }).select("+otpHash");

    if (!otpDoc) {
        throw ApiError.badRequest("Invalid or expired verification code.");
    }

    // 2. Expiration check
    if (otpDoc.expiresAt <= new Date()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw ApiError.badRequest("Invalid or expired verification code.");
    }

    // 3. Max attempts check
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw ApiError.badRequest("Maximum verification attempts exceeded. Please request a new code.");
    }

    // 4. Constant-time Hash Comparison
    const candidateHash = hashOtp(otp);
    const candidateBuffer = Buffer.from(candidateHash, "hex");
    const storedBuffer = Buffer.from(otpDoc.otpHash, "hex");

    let isMatch = false;
    if (candidateBuffer.length === storedBuffer.length) {
        isMatch = crypto.timingSafeEqual(candidateBuffer, storedBuffer);
    }

    if (!isMatch) {
        // Increment attempts atomically
        const updated = await OTP.findOneAndUpdate(
            { _id: otpDoc._id, attempts: { $lt: otpDoc.maxAttempts } },
            { $inc: { attempts: 1 } },
            { returnDocument: "after" }
        );

        if (!updated || updated.attempts >= otpDoc.maxAttempts) {
            await OTP.deleteOne({ _id: otpDoc._id });
            throw ApiError.badRequest("Maximum verification attempts exceeded. Please request a new code.");
        }

        throw ApiError.badRequest("Invalid or expired verification code.");
    }

    // 5. ATOMIC CONSUMPTION
    // Atomically find and delete the document ONLY IF it still exists.
    // In concurrent scenarios, only ONE request's findOneAndDelete will succeed.
    const consumed = await OTP.findOneAndDelete({ _id: otpDoc._id });

    if (!consumed) {
        // Another concurrent request consumed the OTP first
        throw ApiError.badRequest("Invalid or expired verification code.");
    }

    return {
        success: true,
        userId: consumed.userId ? consumed.userId.toString() : null,
        email: consumed.email,
        purpose: consumed.purpose,
    };
};

// ============================================================
// 5. invalidateOtp()
// ============================================================
// Explicitly invalidate any active OTP challenge for (email + purpose).
// ============================================================
const invalidateOtp = async (email, purpose) => {
    const normalizedEmail = requireValidEmail(email);
    const validPurpose = requireValidPurpose(purpose);

    await OTP.deleteMany({
        email: normalizedEmail,
        purpose: validPurpose,
    });

    return true;
};

// ============================================================
// Service Export
// ============================================================
const otpService = Object.freeze({
    generateOtp,
    hashOtp,
    createOtp,
    verifyOtp,
    invalidateOtp,
});

export default otpService;
