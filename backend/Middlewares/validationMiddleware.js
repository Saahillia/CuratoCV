// ============================================================
// CuratoCV Validation Middleware
// ============================================================
//
// Centralizes request validation for all API endpoints.
//
// Responsibilities:
// - Validate request bodies against validator functions
// - Validate query parameters
// - Validate route parameters
// - Return structured 400 errors for invalid input
// - Prevent invalid data from reaching controllers
//
// NOT responsible for:
// - Business logic validation
// - Database queries
// - Authentication
// - Response formatting beyond error messages
//
// Validators should be pure functions returning
// { valid: boolean, errors: Array<string> }.
//
// ============================================================

import ApiError from "../Utils/apiError.js";

// ============================================================
// Validation Result Helper
// ============================================================

const formatValidationErrors = (errors) => {
    if (!Array.isArray(errors)) {
        return ["Validation failed."];
    }

    return errors.map((err) => {
        if (typeof err === "string") {
            return err;
        }

        if (err && typeof err === "object" && err.message) {
            return err.message;
        }

        return "Invalid input.";
    });
};

// ============================================================
// Body Validation Middleware
// ============================================================
//
// @param {Function} validator - (body) => { valid, errors }
// @returns {Function} Express middleware
// ============================================================

const validateBody = (validator) => {
    if (typeof validator !== "function") {
        throw new TypeError("validateBody requires a validator function.");
    }

    return function validationMiddleware(req, res, next) {
        try {
            const result = validator(req.body || {});

            if (!result || !result.valid) {
                return next(
                    new ApiError(400, "Validation failed.", {
                        code: "VALIDATION_ERROR",
                        details: formatValidationErrors(
                            result?.errors
                        ),
                    })
                );
            }

            // Attach validated/normalized data to request
            if (result.data !== undefined) {
                req.validatedBody = result.data;
            }

            return next();
        } catch (error) {
            return next(
                new ApiError(500, "Validation error occurred.", {
                    code: "VALIDATION_INTERNAL_ERROR",
                })
            );
        }
    };
};

// ============================================================
// Query Validation Middleware
// ============================================================
//
// @param {Function} validator - (query) => { valid, errors }
// @returns {Function} Express middleware
// ============================================================

const validateQuery = (validator) => {
    if (typeof validator !== "function") {
        throw new TypeError("validateQuery requires a validator function.");
    }

    return function validationMiddleware(req, res, next) {
        try {
            const result = validator(req.query || {});

            if (!result || !result.valid) {
                return next(
                    new ApiError(400, "Invalid query parameters.", {
                        code: "VALIDATION_ERROR",
                        details: formatValidationErrors(
                            result?.errors
                        ),
                    })
                );
            }

            if (result.data !== undefined) {
                req.validatedQuery = result.data;
            }

            return next();
        } catch (error) {
            return next(
                new ApiError(500, "Validation error occurred.", {
                    code: "VALIDATION_INTERNAL_ERROR",
                })
            );
        }
    };
};

// ============================================================
// Params Validation Middleware
// ============================================================
//
// @param {Function} validator - (params) => { valid, errors }
// @returns {Function} Express middleware
// ============================================================

const validateParams = (validator) => {
    if (typeof validator !== "function") {
        throw new TypeError("validateParams requires a validator function.");
    }

    return function validationMiddleware(req, res, next) {
        try {
            const result = validator(req.params || {});

            if (!result || !result.valid) {
                return next(
                    new ApiError(400, "Invalid route parameters.", {
                        code: "VALIDATION_ERROR",
                        details: formatValidationErrors(
                            result?.errors
                        ),
                    })
                );
            }

            if (result.data !== undefined) {
                req.validatedParams = result.data;
            }

            return next();
        } catch (error) {
            return next(
                new ApiError(500, "Validation error occurred.", {
                    code: "VALIDATION_INTERNAL_ERROR",
                })
            );
        }
    };
};

// ============================================================
// Export
// ============================================================

export {
    validateBody,
    validateQuery,
    validateParams,
};
