// ============================================================
// CuratoCV User Service
// ============================================================
//
// Business logic layer for user operations.
//
// Responsibilities:
// - User registration
// - Authentication and password verification
// - User data retrieval
// - Resume access authorization
// - User-related business logic
//
// NOT responsible for:
// - HTTP request/response handling
// - Input validation (done by validators)
// - Token generation (delegated to auth module)
// - Database access (delegated to repository)
// - Password hashing (done by User model pre-save hook)
//
// IMPORTANT SECURITY:
// - Never trust user ID from request body
// - Always verify password with constant-time comparison
// - Always use strong password hashing
// - Never expose password hashes in logs/responses
// - Always validate ownership before returning data
// ============================================================

import User from "../models/User.js";
import Resume from "../../../../backend/Models/Resume.js";
import OTP from "../models/OTP.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import authUtils from "../../../../backend/Utils/authUtils.js";
import ApiError from "../../../../backend/Utils/apiError.js";
import imageService from "../../../../backend/Services/imageService.js";
import emailService from "../../../../backend/Services/emailService.js";
import otpService from "./otpService.js";
import emailConfig from "../../../../backend/Configs/resend.js";
import logger from "../../../../backend/Configs/logger.js";
import resumeRepository from "../../../../backend/Repositories/resumeRepository.js";

// ============================================================
// Validation Helpers
// ============================================================

const requireString = (value, fieldName) => {
    if (typeof value !== "string" || !value.trim()) {
        throw ApiError.badRequest(
            `${fieldName} must be a non-empty string.`
        );
    }
    return value.trim();
};

// ============================================================
// User Registration
// ============================================================
//
// @param {Object} data  — already validated by authValidator
// @param {string} data.name
// @param {string} data.email
// @param {string} data.password  — plaintext; model will hash it
// @returns {Promise<Object>}
// ============================================================

const registerUser = async (data) => {
    const name = requireString(data.name, "Name");
    const email = requireString(data.email, "Email").toLowerCase();
    const password = requireString(data.password, "Password");

    // ----------------------------------------------------
    // Check for existing user
    // ----------------------------------------------------

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw ApiError.conflict(
            "User already exists with this email."
        );
    }

    // ----------------------------------------------------
    // Create new user
    //
    // IMPORTANT: Pass plaintext password. The User model's
    // pre("save") hook hashes it. Do NOT hash here —
    // double-hashing produces an invalid bcrypt hash.
    // ----------------------------------------------------

    const user = new User({
        name,
        email,
        password, // plaintext; model hashes via pre-save hook
    });

    await user.save();

    // ----------------------------------------------------
    // Generate authentication token
    // ----------------------------------------------------

    const token = authUtils.generateToken({
        userId: user._id,
        email: user.email,
        tokenVersion: user.tokenVersion,
    });

    // ----------------------------------------------------
    // Clean up response
    // ----------------------------------------------------

    const userObject = user.toObject();
    delete userObject.password;

    return {
        userId: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        token,
        createdAt: user.createdAt,
    };
};

// ============================================================
// User Login
// ============================================================
//
// @param {Object} data  — already validated by authValidator
// @param {string} data.email
// @param {string} data.password
// @returns {Promise<Object>}
// ============================================================

const loginUser = async (data) => {
    const email = requireString(data.email, "Email").toLowerCase();
    const password = requireString(data.password, "Password");

    // ----------------------------------------------------
    // Find user (request password explicitly)
    // ----------------------------------------------------

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        // ----------------------------------------------------
        // Use generic error to prevent user enumeration
        // ----------------------------------------------------

        throw ApiError.unauthorized(
            "Invalid credentials."
        );
    }

    // ----------------------------------------------------
    // Verify password (constant-time comparison via model)
    // ----------------------------------------------------

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw ApiError.unauthorized(
            "Invalid credentials."
        );
    }

    // ----------------------------------------------------
    // Generate authentication token
    // ----------------------------------------------------

    const token = authUtils.generateToken({
        userId: user._id,
        email: user.email,
        tokenVersion: user.tokenVersion,
    });

    // ----------------------------------------------------
    // Clean up response
    // ----------------------------------------------------

    const userObject = user.toObject();
    delete userObject.password;

    return {
        userId: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        token,
    };
};

// ============================================================
// Get User by ID
// ============================================================
//
// @param {string|ObjectId} userId
// @returns {Promise<Object>}
// ============================================================

const getUserById = async (userId) => {
    const normalizedUserId = requireString(String(userId), "User ID");

    const user = await User.findById(normalizedUserId);

    if (!user) {
        throw ApiError.notFound(
            "User not found."
        );
    }

    return user.toObject();
};

// ============================================================
// Get User Resumes
// ============================================================
//
// @param {string|ObjectId} userId
// @returns {Promise<Array>}
// ============================================================

const getUserResumes = async (userId) => {
    const normalizedUserId = requireString(String(userId), "User ID");

    // ----------------------------------------------------
    // Verify user exists
    // ----------------------------------------------------

    const user = await User.findById(normalizedUserId);

    if (!user) {
        throw ApiError.notFound(
            "User not found."
        );
    }

    // ----------------------------------------------------
    // Retrieve user's resumes
    // ----------------------------------------------------

    const resumes = await Resume.find({ userId: normalizedUserId })
        .sort({ createdAt: -1 });

    return resumes;
};

// ============================================================
// Request Email Verification
// ============================================================
//
// Creates OTP and sends verification email.
// Does not verify if already verified.
//
// @param {string|ObjectId} userId
// @returns {Promise<Object>}
// ============================================================

const requestEmailVerification = async (userId) => {
    const normalizedUserId = requireString(String(userId), "User ID");

    const user = await User.findById(normalizedUserId);

    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    if (user.emailVerified) {
        throw ApiError.badRequest("Email is already verified.");
    }

    // Create OTP with EMAIL_VERIFICATION purpose
    const { otp } = await otpService.createOtp({
        userId: normalizedUserId,
        email: user.email,
        purpose: "EMAIL_VERIFICATION",
    });

    // Build verification URL: ${APP_URL}/verify-email?code=${otp}
    const appUrl = emailConfig.appUrl || "http://localhost:5173";
    const verifyUrl = `${appUrl}/verify-email?code=${otp}`;

    // Send verification email (non-blocking)
    const emailResult = await emailService.sendEmailVerification(user.email, {
        userName: user.name,
        verifyUrl,
        appUrl,
        otp,
    });

    const isSent = emailResult?.success ?? false;

    logger.info("Email verification requested", {
        userId: normalizedUserId,
        emailSent: isSent,
    });

    return {
        message: "Verification email sent successfully.",
        emailSent: isSent,
    };
};

// ============================================================
// Verify Email with OTP
// ============================================================
//
// Verifies OTP and marks email as verified.
// Returns updated user data.
//
// @param {string|ObjectId} userId
// @param {string} otp - 6-digit code
// @returns {Promise<Object>}
// ============================================================

const verifyEmail = async (userId, otp) => {
    const normalizedUserId = requireString(String(userId), "User ID");

    const user = await User.findById(normalizedUserId);

    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    if (user.emailVerified) {
        throw ApiError.badRequest("Email is already verified.");
    }

    // Verify OTP
    const result = await otpService.verifyOtp({
        email: user.email,
        purpose: "EMAIL_VERIFICATION",
        otp,
    });

    if (!result.success) {
        throw ApiError.badRequest("Invalid or expired verification code.");
    }

    // Mark email as verified
    await User.findByIdAndUpdate(normalizedUserId, {
        emailVerified: true,
    });

    logger.info("Email verified", {
        userId: normalizedUserId,
        email: user.email,
    });

    return {
        message: "Email verified successfully.",
        userId: normalizedUserId,
        email: user.email,
    };
};

// ============================================================
// Resend Verification Email
// ============================================================
//
// Creates new OTP and sends new verification email.
// Does not verify if already verified.
//
// @param {string|ObjectId} userId
// @returns {Promise<Object>}
// ============================================================

const resendVerificationEmail = async (userId) => {
    return requestEmailVerification(userId);
};

// ============================================================
// Forgot Password
// ============================================================
const forgotPassword = async (email) => {
    const normalizedEmail = requireString(email, "Email").toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
        const { otp } = await otpService.createOtp({
            userId: user._id,
            email: normalizedEmail,
            purpose: "PASSWORD_RESET",
        });

        const appUrl = emailConfig.appUrl || "http://localhost:5173";
        const emailResult = await emailService.sendPasswordReset(normalizedEmail, {
            userName: user.name,
            resetUrl: `${appUrl}/reset-password`,
            appUrl,
            otp,
        });

        if (!emailResult?.success) {
            await otpService.invalidateOtp(normalizedEmail, "PASSWORD_RESET");
            logger.warn("Password reset email delivery failed; OTP invalidated", { userId: user._id });
        } else {
            logger.info("Password reset requested", { userId: user._id });
        }
    }

    return { message: "If an account exists, a reset instruction has been sent." };
};

// ============================================================
// Verify Password Reset OTP
// ============================================================
const verifyPasswordResetOtp = async (email, otp) => {
    const normalizedEmail = requireString(email, "Email").toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw ApiError.unauthorized("Invalid credentials.");
    }

    const result = await otpService.verifyOtp({
        email: normalizedEmail,
        purpose: "PASSWORD_RESET",
        otp,
    });

    if (!result.success) {
        throw ApiError.badRequest("Invalid or expired verification code.");
    }

    const { token, tokenHash, expiresAt } = PasswordResetToken.generateToken();
    await PasswordResetToken.create({
        userId: user._id,
        tokenHash,
        expiresAt,
    });

    return { resetToken: token };
};

// ============================================================
// Reset Password
// ============================================================
const resetPassword = async (token, newPassword) => {
    const tokenHash = PasswordResetToken.hashToken(token);
    const resetDoc = await PasswordResetToken.consumeToken(tokenHash);

    if (!resetDoc) {
        throw ApiError.badRequest("Invalid or expired reset token.");
    }

    const user = await User.findById(resetDoc.userId).select("+password");
    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await PasswordResetToken.invalidateUserTokens(user._id);

    return { message: "Password reset successfully." };
};

// ============================================================
// Delete User Account (Step 6F-6 Asset Cleanup)
// ============================================================
//
// @param {string|ObjectId} userId
// @returns {Promise<boolean>}
// ============================================================

const deleteUser = async (userId) => {
    const normalizedUserId = requireString(String(userId), "User ID");

    // 1. Verify user exists
    const user = await User.findById(normalizedUserId);

    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    // 2. Cascade delete all resumes and associated ImageKit assets
    try {
        const deletedResumes = await resumeRepository.deleteAllByUserId(normalizedUserId);

        for (const resume of deletedResumes) {
            const photoFileId = resume.personalInfo?.photo?.fileId;
            if (photoFileId) {
                // Remove photo after resume deletion
                imageService.deleteImage(photoFileId).catch((error) => {
                    logger.warn("Failed to delete photo from external storage during account deletion. Orphaned asset may require manual cleanup.", {
                        userId: normalizedUserId,
                        resumeId: resume._id.toString(),
                        fileId: photoFileId,
                        error: error.message,
                    });
                });
            }
        }

        // --- Orphan Asset Cleanup (Reconciliation) ---
        // List all files in the user's folder to ensure no orphaned images remain.
        try {
            const userFolder = `curatocv/resumes/${normalizedUserId}`;
            const files = await imageService.listImages({
                path: userFolder,
            });

            if (files && Array.isArray(files)) {
                for (const file of files) {
                    // Delete any file in user folder not referenced by the user's deleted resumes
                    // The above loop already deleted referenced assets.
                    await imageService.deleteImage(file.fileId).catch((error) => {
                        logger.warn("Failed to delete orphaned photo during account deletion.", {
                            userId: normalizedUserId,
                            fileId: file.fileId,
                            error: error.message,
                        });
                    });
                }
            }
        } catch (error) {
            logger.warn("Image reconciliation during account deletion failed.", {
                userId: normalizedUserId,
                error: error.message,
            });
        }
    } catch (error) {
        logger.error("Error during cascaded resume cleanup on account deletion:", {
            userId: normalizedUserId,
            error: error.message,
        });
        // We still proceed to delete the user to prevent broken state
    }

    // 3. Delete user document
    await User.findByIdAndDelete(normalizedUserId);

    return true;
};

// ============================================================
// Public Account DTO (Phase 11B Canonical Representation)
// ============================================================
// Explicitly constructs public account representation.
// Defense-in-depth: Never relies solely on select: false or toJSON.
// ============================================================

const toPublicUserDTO = (user) => {
    const raw = typeof user.toObject === "function" ? user.toObject() : user;

    return {
        id: String(raw._id || raw.id),
        name: raw.name,
        email: raw.email,
        emailVerified: Boolean(raw.emailVerified),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
};

// ============================================================
// Get Current User Profile (Canonical 11B)
// ============================================================
//
// @param {string|ObjectId} userId
// @returns {Promise<Object>} Public Account DTO
// ============================================================

const getCurrentUser = async (userId) => {
    const normalizedUserId = requireString(String(userId), "User ID");

    const user = await User.findById(normalizedUserId);

    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    return toPublicUserDTO(user);
};

// ============================================================
// Update Current User Profile (Canonical 11B)
// ============================================================
//
// @param {string|ObjectId} userId
// @param {Object} updates - already validated by userValidator.validateProfileUpdate
// @param {string} [updates.name]
// @returns {Promise<Object>} Public Account DTO
// ============================================================

const updateCurrentUser = async (userId, updates) => {
    const normalizedUserId = requireString(String(userId), "User ID");

    const user = await User.findById(normalizedUserId);

    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    if (updates && typeof updates.name === "string") {
        user.name = updates.name.trim();
    }

    await user.save();

    logger.info("User profile updated", {
        userId: normalizedUserId,
    });

    return toPublicUserDTO(user);
};

// ============================================================
// Export
// ============================================================

const userService = Object.freeze({
    registerUser,
    loginUser,
    getUserById,
    getCurrentUser,
    updateCurrentUser,
    getUserResumes,
    deleteUser,
    requestEmailVerification,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    verifyPasswordResetOtp,
    resetPassword,
});

export default userService;
