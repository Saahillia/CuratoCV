// ============================================================
// CuratoCV Authentication Validators
// ============================================================
//
// Input validation for authentication endpoints.
//
// Responsibilities:
// - Validate registration requests
// - Validate login requests
// - Enforce password requirements
// - Enforce email format
// - Return structured validation results
//
// NOT responsible for:
// - Database queries
// - Password hashing
// - Token generation
// - Authentication logic
//
// ============================================================

// ============================================================
// Email Validation
// ============================================================

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => {
    if (
        typeof email !== "string"
    ) {
        return false;
    }

    const trimmed =
        email.trim();

    if (
        trimmed.length < 3 ||
        trimmed.length > 254
    ) {
        return false;
    }

    return EMAIL_REGEX.test(
        trimmed
    );
};

// ============================================================
// Password Validation
// ============================================================
//
// Requirements:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one digit
// - At least one special character
// ============================================================

const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/;

const isValidPassword = (password) => {
    if (
        typeof password !== "string"
    ) {
        return false;
    }

    if (
        password.length <
        PASSWORD_MIN_LENGTH
    ) {
        return false;
    }

    return PASSWORD_REGEX.test(
        password
    );
};

// ============================================================
// Name Validation
// ============================================================

const isValidName = (name) => {
    if (
        typeof name !== "string"
    ) {
        return false;
    }

    const trimmed =
        name.trim();

    if (
        trimmed.length < 2 ||
        trimmed.length > 100
    ) {
        return false;
    }

    // Allow letters, spaces, hyphens, apostrophes
    return /^[a-zA-Z\s\-']+$/.test(
        trimmed
    );
};

// ============================================================
// Registration Validator
// ============================================================
//
// @param {Object} body
// @returns {Object} { valid, errors, data }
// ============================================================

const validateRegister = (body) => {
    const errors = [];

    if (
        !body ||
        typeof body !== "object"
    ) {
        return {
            valid: false,
            errors: [
                "Request body is required.",
            ],
        };
    }

    const name = body.name;
    const email = body.email;
    const password = body.password;

    // --------------------------------------------------------
    // Name validation
    // --------------------------------------------------------

    if (!name) {
        errors.push(
            "Name is required."
        );
    } else if (
        !isValidName(name)
    ) {
        errors.push(
            "Name must be between 2 and 100 characters and contain only letters, spaces, hyphens, and apostrophes.",
        );
    }

    // --------------------------------------------------------
    // Email validation
    // --------------------------------------------------------

    if (!email) {
        errors.push(
            "Email is required."
        );
    } else if (
        !isValidEmail(email)
    ) {
        errors.push(
            "Email must be a valid email address.",
        );
    }

    // --------------------------------------------------------
    // Password validation
    // --------------------------------------------------------

    if (!password) {
        errors.push(
            "Password is required."
        );
    } else if (
        !isValidPassword(password)
    ) {
        errors.push(
            "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (!@#$%^&*).",
        );
    }

    // --------------------------------------------------------
    // Result
    // --------------------------------------------------------

    if (errors.length > 0) {
        return {
            valid: false,
            errors,
        };
    }

    return {
        valid: true,
        data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
        },
    };
};

// ============================================================
// Login Validator
// ============================================================
//
// @param {Object} body
// @returns {Object} { valid, errors, data }
// ============================================================

const validateLogin = (body) => {
    const errors = [];

    if (
        !body ||
        typeof body !== "object"
    ) {
        return {
            valid: false,
            errors: [
                "Request body is required.",
            ],
        };
    }

    const email = body.email;
    const password = body.password;

    // --------------------------------------------------------
    // Email validation
    // --------------------------------------------------------

    if (!email) {
        errors.push(
            "Email is required."
        );
    } else if (
        !isValidEmail(email)
    ) {
        errors.push(
            "Email must be a valid email address.",
        );
    }

    // --------------------------------------------------------
    // Password validation
    // --------------------------------------------------------

    if (!password) {
        errors.push(
            "Password is required."
        );
    } else if (
        typeof password !== "string"
    ) {
        errors.push(
            "Password must be a string.",
        );
    }

    // --------------------------------------------------------
    // Result
    // --------------------------------------------------------

    if (errors.length > 0) {
        return {
            valid: false,
            errors,
        };
    }

    return {
        valid: true,
        data: {
            email: email.trim().toLowerCase(),
            password,
        },
    };
};

// ============================================================
// OTP Validation
// ============================================================

const isValidOtp = (otp) => {
    return typeof otp === "string" && /^\d{6}$/.test(otp.trim());
};

// ============================================================
// Verify Email Validator
// ============================================================
//
// @param {Object} body
// @returns {Object} { valid, errors, data }
// ============================================================
const validateVerifyEmail = (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
        return { valid: false, errors: ["Request body is required."] };
    }
    const email = body.email;
    const otp = body.otp;
    if (!email) {
        errors.push("Email is required.");
    } else if (!isValidEmail(email)) {
        errors.push("Email must be a valid email address.");
    }
    if (!otp) {
        errors.push("OTP is required.");
    } else if (!isValidOtp(otp)) {
        errors.push("OTP must be a 6-digit number.");
    }
    if (errors.length > 0) return { valid: false, errors };
    return { valid: true, data: { email: email.trim().toLowerCase(), otp: otp.trim() } };
};

// ============================================================
// Forgot Password Validator
// ============================================================
const validateForgotPassword = (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
        return { valid: false, errors: ["Request body is required."] };
    }
    const email = body.email;
    if (!email) {
        errors.push("Email is required.");
    } else if (!isValidEmail(email)) {
        errors.push("Email must be a valid email address.");
    }
    if (errors.length > 0) return { valid: false, errors };
    return { valid: true, data: { email: email.trim().toLowerCase() } };
};

// ============================================================
// Verify Password Reset OTP Validator
// ============================================================
const validateVerifyPasswordResetOtp = (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
        return { valid: false, errors: ["Request body is required."] };
    }
    const email = body.email;
    const otp = body.otp;
    if (!email) {
        errors.push("Email is required.");
    } else if (!isValidEmail(email)) {
        errors.push("Email must be a valid email address.");
    }
    if (!otp) {
        errors.push("OTP is required.");
    } else if (!isValidOtp(otp)) {
        errors.push("OTP must be a 6-digit number.");
    }
    if (errors.length > 0) return { valid: false, errors };
    return { valid: true, data: { email: email.trim().toLowerCase(), otp: otp.trim() } };
};

// ============================================================
// Reset Password Validator
// ============================================================
const validateResetPassword = (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
        return { valid: false, errors: ["Request body is required."] };
    }
    const resetToken = body.resetToken;
    const password = body.password;
    if (!resetToken) {
        errors.push("Reset token is required.");
    } else if (typeof resetToken !== "string" || resetToken.length < 64) {
        errors.push("Invalid reset token.");
    }
    if (!password) {
        errors.push("Password is required.");
    } else if (!isValidPassword(password)) {
        errors.push("Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (!@#$%^&*).");
    }
    if (errors.length > 0) return { valid: false, errors };
    return { valid: true, data: { resetToken, password } };
};


// ============================================================
// Export
// ============================================================

const authValidator = Object.freeze({
    validateRegister,
    validateLogin,
    validateVerifyEmail,
    validateForgotPassword,
    validateVerifyPasswordResetOtp,
    validateResetPassword,
});

export default authValidator;
