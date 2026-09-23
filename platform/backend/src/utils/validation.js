// ============================================================
// CuratoCV Validation Utilities
// ============================================================
//
// Low-level reusable validation helpers.
//
// Responsibilities:
// - Validate primitive values
// - Validate strings
// - Validate arrays
// - Validate objects
// - Validate emails
// - Validate URLs
// - Validate enums
// - Validate numbers/booleans
// - Validate MongoDB ObjectIds
// - Provide consistent validation errors
//
// NOT responsible for:
// - HTTP responses
// - Authentication
// - Authorization
// - MongoDB queries
// - Resume-specific business rules
// - User-specific business rules
//
// Domain-specific validation belongs in:
//
//     Validators/
//         userValidator.js
//         resumeValidator.js
//         aiValidator.js
//         uploadValidator.js
//
// ============================================================

import {
    isValidObjectId,
} from "./objectId.js";

// ============================================================
// Validation Error
// ============================================================
//
// This utility represents validation failures.
//
// Domain validators can use this class to provide structured
// validation information.
//
// The HTTP/error middleware layer is responsible for converting
// validation failures into API responses.
// ============================================================

class ValidationError extends Error {
    constructor(
        message,
        details = []
    ) {
        super(message);

        this.name =
            "ValidationError";

        this.details =
            Array.isArray(details)
                ? details
                : [];

        if (
            Error.captureStackTrace
        ) {
            Error.captureStackTrace(
                this,
                ValidationError
            );
        }
    }
}

// ============================================================
// Validation Detail
// ============================================================

const createDetail = (
    field,
    message,
    value
) => ({
    field,
    message,
    value,
});

// ============================================================
// Type Helpers
// ============================================================

const isString = (
    value
) => {
    return (
        typeof value ===
        "string"
    );
};

const isNonEmptyString = (
    value
) => {
    return (
        isString(value) &&
        value.trim().length > 0
    );
};

const isPlainObject = (
    value
) => {
    if (
        value === null ||
        typeof value !==
            "object"
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

const isArray = (
    value
) => {
    return Array.isArray(
        value
    );
};

const isBoolean = (
    value
) => {
    return (
        typeof value ===
        "boolean"
    );
};

const isNumber = (
    value
) => {
    return (
        typeof value ===
            "number" &&
        Number.isFinite(value)
    );
};

const isInteger = (
    value
) => {
    return Number.isInteger(
        value
    );
};

// ============================================================
// Email Validation
// ============================================================
//
// This checks email syntax only.
//
// It does NOT verify that the address:
// - exists
// - belongs to the user
// - can receive mail
//
// Email ownership verification is a separate feature.
// ============================================================

const isValidEmail = (
    value
) => {
    if (
        typeof value !==
        "string"
    ) {
        return false;
    }

    const email =
        value.trim();

    if (
        email.length === 0 ||
        email.length > 254
    ) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
};

// ============================================================
// URL Validation
// ============================================================
//
// By default only HTTP(S) URLs are accepted.
//
// This is important for resume links because arbitrary
// protocols such as javascript: should never be accepted as
// normal resume URLs.
// ============================================================

const isValidUrl = (
    value,
    options = {}
) => {
    if (
        typeof value !==
        "string"
    ) {
        return false;
    }

    const normalized =
        value.trim();

    if (!normalized) {
        return false;
    }

    if (
        normalized.length >
        2048
    ) {
        return false;
    }

    let url;

    try {
        url = new URL(
            normalized
        );
    } catch {
        return false;
    }

    const allowedProtocols =
        Array.isArray(
            options.allowedProtocols
        )
            ? options.allowedProtocols
            : [
                  "http:",
                  "https:",
              ];

    return allowedProtocols.includes(
        url.protocol
    );
};

// ============================================================
// Enum Validation
// ============================================================

const isAllowedEnum = (
    value,
    allowedValues
) => {
    if (
        !Array.isArray(
            allowedValues
        )
    ) {
        return false;
    }

    return allowedValues.includes(
        value
    );
};

// ============================================================
// Required Validation
// ============================================================

const validateRequired = (
    value,
    field
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return createDetail(
            field,
            `${field} is required.`,
            value
        );
    }

    if (
        typeof value ===
            "string" &&
        value.trim().length === 0
    ) {
        return createDetail(
            field,
            `${field} is required.`,
            value
        );
    }

    return null;
};

// ============================================================
// String Validation
// ============================================================

const validateString = (
    value,
    field,
    options = {}
) => {
    const {
        required = false,
        minLength,
        maxLength,
        allowEmpty = true,
    } = options;

    if (
        value === undefined ||
        value === null
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        typeof value !==
        "string"
    ) {
        return createDetail(
            field,
            `${field} must be a string.`,
            value
        );
    }

    const length =
        value.trim().length;

    if (
        !allowEmpty &&
        length === 0
    ) {
        return createDetail(
            field,
            `${field} cannot be empty.`,
            value
        );
    }

    if (
        Number.isInteger(
            minLength
        ) &&
        length <
            minLength
    ) {
        return createDetail(
            field,
            `${field} must be at least ${minLength} characters long.`,
            value
        );
    }

    if (
        Number.isInteger(
            maxLength
        ) &&
        length >
            maxLength
    ) {
        return createDetail(
            field,
            `${field} must not exceed ${maxLength} characters.`,
            value
        );
    }

    return null;
};

// ============================================================
// Email Validation
// ============================================================

const validateEmail = (
    value,
    field = "Email",
    options = {}
) => {
    const {
        required = false,
    } = options;

    if (
        value === undefined ||
        value === null ||
        (
            typeof value ===
                "string" &&
            value.trim() === ""
        )
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !isValidEmail(value)
    ) {
        return createDetail(
            field,
            `${field} must be a valid email address.`,
            value
        );
    }

    return null;
};

// ============================================================
// URL Validation
// ============================================================

const validateUrl = (
    value,
    field = "URL",
    options = {}
) => {
    const {
        required = false,
        allowedProtocols,
    } = options;

    if (
        value === undefined ||
        value === null ||
        (
            typeof value ===
                "string" &&
            value.trim() === ""
        )
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !isValidUrl(
            value,
            {
                allowedProtocols,
            }
        )
    ) {
        return createDetail(
            field,
            `${field} must be a valid URL.`,
            value
        );
    }

    return null;
};

// ============================================================
// Boolean Validation
// ============================================================

const validateBoolean = (
    value,
    field,
    options = {}
) => {
    const {
        required = false,
    } = options;

    if (
        value === undefined ||
        value === null
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !isBoolean(value)
    ) {
        return createDetail(
            field,
            `${field} must be a boolean.`,
            value
        );
    }

    return null;
};

// ============================================================
// Number Validation
// ============================================================

const validateNumber = (
    value,
    field,
    options = {}
) => {
    const {
        required = false,
        integer = false,
        min,
        max,
    } = options;

    if (
        value === undefined ||
        value === null
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !isNumber(value)
    ) {
        return createDetail(
            field,
            `${field} must be a valid number.`,
            value
        );
    }

    if (
        integer &&
        !Number.isInteger(value)
    ) {
        return createDetail(
            field,
            `${field} must be an integer.`,
            value
        );
    }

    if (
        typeof min ===
            "number" &&
        value < min
    ) {
        return createDetail(
            field,
            `${field} must be at least ${min}.`,
            value
        );
    }

    if (
        typeof max ===
            "number" &&
        value > max
    ) {
        return createDetail(
            field,
            `${field} must not exceed ${max}.`,
            value
        );
    }

    return null;
};

// ============================================================
// Array Validation
// ============================================================

const validateArray = (
    value,
    field,
    options = {}
) => {
    const {
        required = false,
        minLength,
        maxLength,
    } = options;

    if (
        value === undefined ||
        value === null
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !Array.isArray(value)
    ) {
        return createDetail(
            field,
            `${field} must be an array.`,
            value
        );
    }

    if (
        Number.isInteger(
            minLength
        ) &&
        value.length <
            minLength
    ) {
        return createDetail(
            field,
            `${field} must contain at least ${minLength} items.`,
            value
        );
    }

    if (
        Number.isInteger(
            maxLength
        ) &&
        value.length >
            maxLength
    ) {
        return createDetail(
            field,
            `${field} must not contain more than ${maxLength} items.`,
            value
        );
    }

    return null;
};

// ============================================================
// Object Validation
// ============================================================

const validateObject = (
    value,
    field,
    options = {}
) => {
    const {
        required = false,
    } = options;

    if (
        value === undefined ||
        value === null
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !isPlainObject(value)
    ) {
        return createDetail(
            field,
            `${field} must be an object.`,
            value
        );
    }

    return null;
};

// ============================================================
// ObjectId Validation
// ============================================================
//
// Delegates to Utils/objectId.js so ObjectId behavior exists in
// exactly one place in the backend.
// ============================================================

const validateObjectId = (
    value,
    field = "ID",
    options = {}
) => {
    const {
        required = false,
    } = options;

    if (
        value === undefined ||
        value === null ||
        (
            typeof value ===
                "string" &&
            value.trim() === ""
        )
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !isValidObjectId(value)
    ) {
        return createDetail(
            field,
            `${field} must be a valid MongoDB ObjectId.`,
            value
        );
    }

    return null;
};

// ============================================================
// Enum Validation
// ============================================================

const validateEnum = (
    value,
    field,
    allowedValues,
    options = {}
) => {
    const {
        required = false,
    } = options;

    if (
        value === undefined ||
        value === null
    ) {
        if (required) {
            return createDetail(
                field,
                `${field} is required.`,
                value
            );
        }

        return null;
    }

    if (
        !isAllowedEnum(
            value,
            allowedValues
        )
    ) {
        return createDetail(
            field,
            `${field} must be one of: ${allowedValues.join(
                ", "
            )}.`,
            value
        );
    }

    return null;
};

// ============================================================
// Unique Array Validation
// ============================================================
//
// String comparisons are case-insensitive and whitespace is
// ignored.
//
// Example:
//
// ["React", " react "]
//
// is considered a duplicate.
// ============================================================

const validateUniqueArray = (
    value,
    field
) => {
    if (
        !Array.isArray(value)
    ) {
        return createDetail(
            field,
            `${field} must be an array.`,
            value
        );
    }

    const normalized =
        value.map(
            (item) => {
                if (
                    typeof item ===
                    "string"
                ) {
                    return item
                        .trim()
                        .toLowerCase();
                }

                return item;
            }
        );

    const unique =
        new Set(
            normalized
        );

    if (
        unique.size !==
        normalized.length
    ) {
        return createDetail(
            field,
            `${field} must not contain duplicate values.`,
            value
        );
    }

    return null;
};

// ============================================================
// Validate Fields
// ============================================================
//
// Runs multiple validation functions and collects the
// non-null validation details.
//
// ============================================================

const validateFields = (
    validators
) => {
    if (
        !Array.isArray(
            validators
        )
    ) {
        throw new TypeError(
            "validators must be an array."
        );
    }

    return validators.filter(
        Boolean
    );
};

// ============================================================
// Assert Valid
// ============================================================
//
// Throws ValidationError when one or more validation errors
// exist.
// ============================================================

const assertValid = (
    details
) => {
    const errors =
        Array.isArray(details)
            ? details.filter(
                  Boolean
              )
            : [];

    if (
        errors.length > 0
    ) {
        throw new ValidationError(
            "Validation failed.",
            errors
        );
    }

    return true;
};

// ============================================================
// Export
// ============================================================

const validation =
    Object.freeze({
        ValidationError,

        isString,

        isNonEmptyString,

        isPlainObject,

        isArray,

        isBoolean,

        isNumber,

        isInteger,

        isMongoObjectId:
            isValidObjectId,

        isValidEmail,

        isValidUrl,

        isAllowedEnum,

        validateRequired,

        validateString,

        validateEmail,

        validateUrl,

        validateBoolean,

        validateNumber,

        validateArray,

        validateObject,

        validateObjectId,

        validateEnum,

        validateUniqueArray,

        validateFields,

        assertValid,
    });

export {
    ValidationError,

    isString,

    isNonEmptyString,

    isPlainObject,

    isArray,

    isBoolean,

    isNumber,

    isInteger,

    isValidObjectId,

    isValidEmail,

    isValidUrl,

    isAllowedEnum,

    validateRequired,

    validateString,

    validateEmail,

    validateUrl,

    validateBoolean,

    validateNumber,

    validateArray,

    validateObject,

    validateObjectId,

    validateEnum,

    validateUniqueArray,

    validateFields,

    assertValid,
};

export default validation;