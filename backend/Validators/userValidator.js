// ============================================================
// CuratoCV User Validators
// ============================================================
//
// Request-level validation for user-related operations.
//
// Responsibilities:
// - Validate registration input
// - Validate login input
// - Validate profile update input
// - Normalize safe string input
// - Enforce API-level field constraints
//
// NOT responsible for:
// - MongoDB queries
// - Password hashing
// - JWT creation
// - Authentication
// - Authorization
// - HTTP responses
// - Business logic
//
// Flow:
//
// Controller
//     ↓
// Validator
//     ↓
// Service
//     ↓
// Repository
//     ↓
// MongoDB
// ============================================================

// ============================================================
// Constants
// ============================================================

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 120;

const EMAIL_MAX_LENGTH = 254;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const URL_MAX_LENGTH = 2048;

// ============================================================
// Regular Expressions
// ============================================================

const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const URL_PATTERN =
    /^https?:\/\/[^\s]+$/i;

// ============================================================
// Helpers
// ============================================================

const isPlainObject = (
    value
) => {
    if (
        value === null ||
        typeof value !== "object"
    ) {
        return false;
    }

    const prototype =
        Object.getPrototypeOf(
            value
        );

    return (
        prototype ===
            Object.prototype ||
        prototype === null
    );
};

const normalizeString = (
    value
) => {
    if (
        typeof value !== "string"
    ) {
        return value;
    }

    return value.trim();
};

const normalizeEmail = (
    value
) => {
    if (
        typeof value !== "string"
    ) {
        return value;
    }

    return value
        .trim()
        .toLowerCase();
};

const createValidationError =
    (
        field,
        message
    ) => ({
        field,
        message,
    });

const createValidationResult =
    (
        errors
    ) => ({
        valid:
            errors.length === 0,

        errors,
    });

// ============================================================
// Name Validation
// ============================================================

const validateName = (
    name
) => {
    const errors = [];

    if (
        typeof name !==
        "string"
    ) {
        errors.push(
            createValidationError(
                "name",
                "Name must be a string."
            )
        );

        return errors;
    }

    const normalizedName =
        normalizeString(name);

    if (
        normalizedName.length <
        NAME_MIN_LENGTH
    ) {
        errors.push(
            createValidationError(
                "name",
                `Name must contain at least ${NAME_MIN_LENGTH} characters.`
            )
        );
    }

    if (
        normalizedName.length >
        NAME_MAX_LENGTH
    ) {
        errors.push(
            createValidationError(
                "name",
                `Name cannot exceed ${NAME_MAX_LENGTH} characters.`
            )
        );
    }

    return errors;
};

// ============================================================
// Email Validation
// ============================================================

const validateEmail = (
    email
) => {
    const errors = [];

    if (
        typeof email !==
        "string"
    ) {
        errors.push(
            createValidationError(
                "email",
                "Email must be a string."
            )
        );

        return errors;
    }

    const normalizedEmail =
        normalizeEmail(email);

    if (
        !normalizedEmail
    ) {
        errors.push(
            createValidationError(
                "email",
                "Email is required."
            )
        );

        return errors;
    }

    if (
        normalizedEmail.length >
        EMAIL_MAX_LENGTH
    ) {
        errors.push(
            createValidationError(
                "email",
                `Email cannot exceed ${EMAIL_MAX_LENGTH} characters.`
            )
        );
    }

    if (
        !EMAIL_PATTERN.test(
            normalizedEmail
        )
    ) {
        errors.push(
            createValidationError(
                "email",
                "Please provide a valid email address."
            )
        );
    }

    return errors;
};

// ============================================================
// Password Validation
// ============================================================
//
// We intentionally do NOT require arbitrary complexity rules
// such as:
// - special characters
// - uppercase letters
// - numbers
//
// unless the product explicitly decides to require them.
//
// A reasonable minimum length plus a strong password policy
// gives us a better foundation without making registration
// unnecessarily difficult.
//
// IMPORTANT:
// Never trim passwords.
// A password is user input and whitespace can legitimately be
// part of it.
// ============================================================

const validatePassword = (
    password
) => {
    const errors = [];

    if (
        typeof password !==
        "string"
    ) {
        errors.push(
            createValidationError(
                "password",
                "Password must be a string."
            )
        );

        return errors;
    }

    if (
        password.length <
        PASSWORD_MIN_LENGTH
    ) {
        errors.push(
            createValidationError(
                "password",
                `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`
            )
        );
    }

    if (
        password.length >
        PASSWORD_MAX_LENGTH
    ) {
        errors.push(
            createValidationError(
                "password",
                `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`
            )
        );
    }

    return errors;
};

// ============================================================
// URL Validation
// ============================================================

const validateOptionalUrl = (
    value,
    field
) => {
    const errors = [];

    if (
        value ===
            undefined ||
        value === null ||
        value === ""
    ) {
        return errors;
    }

    if (
        typeof value !==
        "string"
    ) {
        errors.push(
            createValidationError(
                field,
                `${field} must be a string.`
            )
        );

        return errors;
    }

    const normalizedValue =
        normalizeString(value);

    if (
        normalizedValue.length >
        URL_MAX_LENGTH
    ) {
        errors.push(
            createValidationError(
                field,
                `${field} cannot exceed ${URL_MAX_LENGTH} characters.`
            )
        );

        return errors;
    }

    if (
        !URL_PATTERN.test(
            normalizedValue
        )
    ) {
        errors.push(
            createValidationError(
                field,
                `${field} must be a valid HTTP or HTTPS URL.`
            )
        );
    }

    return errors;
};

// ============================================================
// Registration Validation
// ============================================================

const validateRegister = (
    payload
) => {
    const errors = [];

    if (
        !isPlainObject(
            payload
        )
    ) {
        return createValidationResult([
            createValidationError(
                "body",
                "Request body must be a valid object."
            ),
        ]);
    }

    errors.push(
        ...validateName(
            payload.name
        )
    );

    errors.push(
        ...validateEmail(
            payload.email
        )
    );

    errors.push(
        ...validatePassword(
            payload.password
        )
    );

    return createValidationResult(
        errors
    );
};

// ============================================================
// Login Validation
// ============================================================

const validateLogin = (
    payload
) => {
    const errors = [];

    if (
        !isPlainObject(
            payload
        )
    ) {
        return createValidationResult([
            createValidationError(
                "body",
                "Request body must be a valid object."
            ),
        ]);
    }

    errors.push(
        ...validateEmail(
            payload.email
        )
    );

    if (
        typeof payload.password !==
        "string"
    ) {
        errors.push(
            createValidationError(
                "password",
                "Password is required."
            )
        );
    } else if (
        payload.password.length ===
        0
    ) {
        errors.push(
            createValidationError(
                "password",
                "Password is required."
            )
        );
    }

    /*
     * We intentionally do not expose password policy details
     * during login. Authentication failures should remain
     * generic so the endpoint does not reveal unnecessary
     * information.
     */

    return createValidationResult(
        errors
    );
};

// ============================================================
// Profile Update Validation
// ============================================================
//
// Only explicitly supported profile fields are accepted.
//
// This prevents clients from attempting to modify fields such
// as:
//
// - _id
// - password
// - createdAt
// - updatedAt
// - roles
// - permissions
//
// Password changes should have their own dedicated validator
// and service operation.
// ============================================================

const validateProfileUpdate = (
    payload
) => {
    const errors = [];

    if (
        !isPlainObject(
            payload
        )
    ) {
        return createValidationResult([
            createValidationError(
                "body",
                "Request body must be a valid object."
            ),
        ]);
    }

    const allowedFields = new Set([
        "name",
    ]);

    for (
        const field of
            Object.keys(payload)
    ) {
        if (
            !allowedFields.has(
                field
            )
        ) {
            errors.push(
                createValidationError(
                    field,
                    `Field '${field}' cannot be updated through this endpoint.`
                )
            );
        }
    }

    if (
        !Object.prototype.hasOwnProperty.call(
            payload,
            "name"
        )
    ) {
        errors.push(
            createValidationError(
                "name",
                "Name is required."
            )
        );
    } else {
        const name = payload.name;

        if (typeof name !== "string") {
            errors.push(
                createValidationError(
                    "name",
                    "Name must be a string."
                )
            );
        } else {
            const trimmedName = name.trim();
            if (trimmedName.length === 0) {
                errors.push(
                    createValidationError(
                        "name",
                        "Name cannot be empty or whitespace-only."
                    )
                );
            } else if (trimmedName.length > 100) {
                errors.push(
                    createValidationError(
                        "name",
                        "Name cannot exceed 100 characters."
                    )
                );
            }
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            errors,
        };
    }

    return {
        valid: true,
        data: {
            name: payload.name.trim(),
        },
    };
};

// ============================================================
// Password Change Validation
// ============================================================

const validatePasswordChange = (
    payload
) => {
    const errors = [];

    if (
        !isPlainObject(
            payload
        )
    ) {
        return createValidationResult([
            createValidationError(
                "body",
                "Request body must be a valid object."
            ),
        ]);
    }

    const allowedFields = new Set([
        "currentPassword",
        "newPassword",
    ]);

    for (
        const field of
            Object.keys(payload)
    ) {
        if (
            !allowedFields.has(
                field
            )
        ) {
            errors.push(
                createValidationError(
                    field,
                    `Field '${field}' cannot be used for password changes.`
                )
            );
        }
    }

    if (
        typeof payload.currentPassword !==
        "string" ||
        payload.currentPassword.length ===
            0
    ) {
        errors.push(
            createValidationError(
                "currentPassword",
                "Current password is required."
            )
        );
    }

    errors.push(
        ...validatePassword(
            payload.newPassword
        ).map(
            (error) => ({
                ...error,
                field:
                    error.field ===
                    "password"
                        ? "newPassword"
                        : error.field,
            })
        )
    );

    if (
        typeof payload.currentPassword ===
            "string" &&
        typeof payload.newPassword ===
            "string" &&
        payload.currentPassword ===
            payload.newPassword
    ) {
        errors.push(
            createValidationError(
                "newPassword",
                "New password must be different from the current password."
            )
        );
    }

    return createValidationResult(
        errors
    );
};

// ============================================================
// Normalizers
// ============================================================
//
// Validation and normalization are kept separate so callers
// can decide when normalized data should actually be used.
//
// Never normalize passwords.
// ============================================================

const normalizeRegistrationData = (
    payload
) => ({
    name:
        normalizeString(
            payload.name
        ),

    email:
        normalizeEmail(
            payload.email
        ),

    password:
        payload.password,
});

const normalizeLoginData = (
    payload
) => ({
    email:
        normalizeEmail(
            payload.email
        ),

    password:
        payload.password,
});

const normalizeProfileUpdateData = (
    payload
) => {
    const normalized = {};

    if (
        Object.prototype.hasOwnProperty.call(
            payload,
            "name"
        )
    ) {
        normalized.name =
            normalizeString(
                payload.name
            );
    }

    return normalized;
};

// ============================================================
// Export
// ============================================================

const userValidator = Object.freeze({
    validateRegister,

    validateLogin,

    validateProfileUpdate,

    validatePasswordChange,

    normalizeRegistrationData,

    normalizeLoginData,

    normalizeProfileUpdateData,
});

export default userValidator;