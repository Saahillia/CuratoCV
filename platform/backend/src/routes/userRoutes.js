// ============================================================
// CuratoCV User Routes
// ============================================================
//
// HTTP routes for user authentication and profile operations.
//
// Responsibilities:
// - Define user API endpoints
// - Apply authentication where required
// - Apply validation middleware
// - Apply rate limiting
// - Delegate requests to userController
//
// NOT responsible for:
// - User business logic
// - Password hashing
// - Token generation
// - Database access
// - Input validation logic
//
// SECURITY:
// - Authentication endpoints are rate-limited
// - All input is validated before reaching controllers
// - User ID comes from JWT, not request body
// ============================================================

import express from "express";

import userController from "../controllers/userController.js";

import authMiddleware from "../../../../backend/Middlewares/authMiddleware.js";
import { validateBody } from "../../../../backend/Middlewares/validationMiddleware.js";
import {
    authRateLimitMiddleware,
    otpIpLimitMiddleware,
    otpVerifyIpLimitMiddleware,
    otpCooldownMiddleware,
    otpEmailHourlyLimitMiddleware
} from "../../../../backend/Middlewares/rateLimitMiddleware.js";

import authValidator from "../../../../backend/Validators/authValidator.js";
import userValidator from "../../../../backend/Validators/userValidator.js";

// ============================================================
// Router
// ============================================================

const router = express.Router();

// ============================================================
// User Registration
// ============================================================
//
// POST /api/users/register
//
// Rate limited: authRateLimitMiddleware (10 attempts per 15 min)
//
// Body validation: authValidator.validateRegister
// ============================================================

router.post(
    "/register",

    authRateLimitMiddleware,

    validateBody(authValidator.validateRegister),

    userController.registerUser
);

// ============================================================
// User Login
// ============================================================
//
// POST /api/users/login
//
// Rate limited: authRateLimitMiddleware (10 attempts per 15 min)
//
// Body validation: authValidator.validateLogin
// ============================================================

router.post(
    "/login",

    authRateLimitMiddleware,

    validateBody(authValidator.validateLogin),

    userController.loginUser
);

// ============================================================
// Get Current User Profile (Canonical 11B)
// ============================================================
//
// GET /api/users/me
//
// Authentication required.
// Returns canonical public account DTO.
// ============================================================

router.get(
    "/me",

    authMiddleware,

    userController.getMe
);

// ============================================================
// Update Current User Profile (Canonical 11B)
// ============================================================
//
// PATCH /api/users/me
//
// Authentication required.
// Body validation: userValidator.validateProfileUpdate
// Only accepts { name }. Rejects unrecognized/forbidden fields.
// ============================================================

router.patch(
    "/me",

    authMiddleware,

    validateBody(userValidator.validateProfileUpdate),

    userController.updateMe
);

// ============================================================
// Get Current User Profile (Legacy / Compatibility)
// ============================================================
//
// GET /api/users/data
//
// Authentication required.
//
// Returns authenticated user's profile.
// ============================================================

router.get(
    "/data",

    authMiddleware,

    userController.getUserById
);

// ============================================================
// Get User Resumes
// ============================================================
//
// GET /api/users/resumes
//
// Authentication required.
//
// Returns authenticated user's resumes.
// ============================================================

router.get(
    "/resumes",

    authMiddleware,

    userController.getUserResumes
);

// ============================================================
// Delete User Account
// ============================================================
//
// DELETE /api/users/account
//
// Authentication required.
//
// Cascade deletes user profile, all resumes, and external image assets.
// ============================================================

router.delete(
    "/account",

    authMiddleware,

    userController.deleteAccount
);

// ============================================================
// Request Email Verification
// ============================================================
//
// POST /api/users/request-email-verification
//
// Authentication required.
// Rate limited: IP throttling, email cooldown, hourly limit.
// ============================================================

router.post(
    "/request-email-verification",

    authMiddleware,

    otpIpLimitMiddleware,
    otpEmailHourlyLimitMiddleware,
    otpCooldownMiddleware,

    userController.requestEmailVerification
);

// ============================================================
// Verify Email
// ============================================================
//
// POST /api/users/verify-email
//
// Authentication required.
// Rate limited: global verification limits (max 5 per OTP in service).
// Body validation: authValidator.validateVerifyEmail
// ============================================================

router.post(
    "/verify-email",

    authMiddleware,

    otpVerifyIpLimitMiddleware,

    validateBody(authValidator.validateVerifyEmail),

    userController.verifyEmail
);

// ============================================================
// Resend Email Verification
// ============================================================
//
// POST /api/users/resend-verification
//
// Authentication required.
// Rate limited: IP throttling, email cooldown, hourly limit.
// ============================================================

router.post(
    "/resend-verification",

    authMiddleware,

    otpIpLimitMiddleware,
    otpEmailHourlyLimitMiddleware,
    otpCooldownMiddleware,

    userController.resendVerificationEmail
);

// ============================================================
// Forgot Password
// ============================================================
//
// POST /api/users/forgot-password
//
// Rate limited: authRateLimitMiddleware
//
// Body validation: authValidator.validateForgotPassword
// ============================================================

router.post(
    "/forgot-password",

    authRateLimitMiddleware,

    validateBody(authValidator.validateForgotPassword),

    userController.forgotPassword
);

// ============================================================
// Verify Password Reset OTP
// ============================================================
//
// POST /api/users/verify-password-reset-otp
//
// Rate limited: otpVerifyIpLimitMiddleware
//
// Body validation: authValidator.validateVerifyPasswordResetOtp
// ============================================================

router.post(
    "/verify-password-reset-otp",

    otpVerifyIpLimitMiddleware,

    validateBody(authValidator.validateVerifyPasswordResetOtp),

    userController.verifyPasswordResetOtp
);

// ============================================================
// Reset Password
// ============================================================
//
// POST /api/users/reset-password
//
// Rate limited: authRateLimitMiddleware
//
// Body validation: authValidator.validateResetPassword
// ============================================================

router.post(
    "/reset-password",

    authRateLimitMiddleware,

    validateBody(authValidator.validateResetPassword),

    userController.resetPassword
);

export default router;
