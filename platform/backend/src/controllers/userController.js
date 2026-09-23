// ============================================================
// CuratoCV User Controller
// ============================================================
//
// HTTP controller for user authentication and profile operations.
//
// Responsibilities:
// - Handle authentication HTTP requests
// - Read validated request data
// - Delegate business logic to userService
// - Return safe, structured API responses
// - Handle controller-level errors via next(error)
//
// NOT responsible for:
// - Database queries
// - Password hashing
// - JWT generation
// - Input validation (done by validators)
// - Rate limiting (done by middleware)
// - Error envelope formatting (done by errorMiddleware)
//
// ============================================================

import userService from "../services/userService.js";
import logger from "../../../../backend/Configs/logger.js";

// ============================================================
// User Registration
// ============================================================
//
// POST /api/users/register
// ============================================================

const registerUser = async (req, res, next) => {
    try {
        const result = await userService.registerUser(req.validatedBody);

        // ----------------------------------------------------
        // Audit logging - new user registration
        // ----------------------------------------------------

        logger.info("User registered", {
            userId: result.userId,
            email: result.email,
        });

        return res.status(201).json({
            success: true,
            data: {
                userId: result.userId,
                name: result.name,
                email: result.email,
                emailVerified: result.emailVerified,
                token: result.token,
                createdAt: result.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// User Login
// ============================================================
//
// POST /api/users/login
// ============================================================

const loginUser = async (req, res, next) => {
    try {
        const result = await userService.loginUser(req.validatedBody);

        // ----------------------------------------------------
        // Audit logging - successful login
        // ----------------------------------------------------

        logger.info("User logged in", {
            userId: result.userId,
        });

        return res.status(200).json({
            success: true,
            data: {
                userId: result.userId,
                name: result.name,
                email: result.email,
                emailVerified: result.emailVerified,
                token: result.token,
            },
        });
    } catch (error) {
        // ----------------------------------------------------
        // Security logging: authentication failure
        // ----------------------------------------------------

        if (error?.code === "UNAUTHORIZED") {
            logger.warn("Authentication failure", {
                email: req.validatedBody?.email || "unknown",
            });
        }

        next(error);
    }
};

// ============================================================
// Get Current User
// ============================================================
//
// GET /api/users/data
// ============================================================

const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.userId);

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Get User Resumes
// ============================================================
//
// GET /api/users/resumes
// ============================================================

const getUserResumes = async (req, res, next) => {
    try {
        const resumes = await userService.getUserResumes(req.userId);

        return res.status(200).json({
            success: true,
            data: {
                resumes,
                count: resumes.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Delete User Account
// ============================================================
//
// DELETE /api/users/account
// ============================================================

const deleteAccount = async (req, res, next) => {
    try {
        await userService.deleteUser(req.userId);

        logger.info("User account and associated assets deleted", {
            userId: req.userId,
        });

        return res.status(200).json({
            success: true,
            message: "User account and all associated data have been permanently deleted.",
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Request Email Verification
// ============================================================
//
// POST /api/users/request-email-verification
// ============================================================

const requestEmailVerification = async (req, res, next) => {
    try {
        const result = await userService.requestEmailVerification(req.userId);

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                emailSent: result.emailSent,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Verify Email
// ============================================================
//
// POST /api/users/verify-email
// ============================================================

const verifyEmail = async (req, res, next) => {
    try {
        const { otp } = req.validatedBody;
        const result = await userService.verifyEmail(req.userId, otp);

        logger.info("User completed email verification", {
            userId: result.userId,
            email: result.email,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                emailVerified: true,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Resend Email Verification
// ============================================================
//
// POST /api/users/resend-verification
// ============================================================

const resendVerificationEmail = async (req, res, next) => {
    try {
        const result = await userService.resendVerificationEmail(req.userId);

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                emailSent: result.emailSent,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Forgot Password
// ============================================================
//
// POST /api/users/forgot-password
// ============================================================

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.validatedBody;
        const result = await userService.forgotPassword(email);
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Verify Password Reset OTP
// ============================================================
//
// POST /api/users/verify-password-reset-otp
// ============================================================

const verifyPasswordResetOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.validatedBody;
        const result = await userService.verifyPasswordResetOtp(email, otp);
        return res.status(200).json({ success: true, data: { resetToken: result.resetToken } });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Reset Password
// ============================================================
//
// POST /api/users/reset-password
// ============================================================

const resetPassword = async (req, res, next) => {
    try {
        const { resetToken, password } = req.validatedBody;
        const result = await userService.resetPassword(resetToken, password);
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Get Current User Profile (Canonical 11B)
// ============================================================
//
// GET /api/users/me
// Requires authentication.
// ============================================================

const getMe = async (req, res, next) => {
    try {
        const user = await userService.getCurrentUser(req.userId);

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Update Current User Profile (Canonical 11B)
// ============================================================
//
// PATCH /api/users/me
// Requires authentication.
// ============================================================

const updateMe = async (req, res, next) => {
    try {
        const user = await userService.updateCurrentUser(
            req.userId,
            req.validatedBody
        );

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Export
// ============================================================

const userController = Object.freeze({
    registerUser,
    loginUser,
    getMe,
    updateMe,
    getUserById,
    getUserResumes,
    deleteAccount,
    requestEmailVerification,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    verifyPasswordResetOtp,
    resetPassword,
});


export default userController;