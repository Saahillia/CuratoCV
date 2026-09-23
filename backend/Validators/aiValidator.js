// ============================================================
// CuratoCV AI Request Validator
// ============================================================
//
// Responsible for validating incoming AI-related request data.
//
// This validator:
// - validates request body structure
// - validates supported AI operations
// - validates resume text/content limits
// - prevents unexpectedly large AI requests
// - rejects unknown/invalid values
//
// This validator does NOT:
// - call Gemini/OpenAI
// - generate AI responses
// - access MongoDB
// - create HTTP responses
// - authenticate users
//
// Those responsibilities belong to the service/controller/
// middleware layers.
// ============================================================

import limits from "../Constants/limits.js";

// ============================================================
// Configuration
// ============================================================

const AI_LIMITS = Object.freeze({
    prompt: {
        minLength: 1,
        maxLength: 20_000,
    },

    text: {
        minLength: 1,
        maxLength: 20_000,
    },

    instructions: {
        minLength: 1,
        maxLength: 10_000,
    },
});

// ============================================================
// Supported AI Operations
// ============================================================
//
// Keep this list synchronized with the operations implemented
// by aiService.js.
//
// The validator should reject unsupported operations rather
// than allowing arbitrary provider/model behavior from the
// client.
// ============================================================

const SUPPORTED_OPERATIONS = Object.freeze([
    "improve",
    "summarize",
    "generate",
    "rewrite",
    "suggest",
]);

// ============================================================
// Helpers
// ============================================================

const isPlainObject = (value) => {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
};

const isNonEmptyString = (value) => {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
};

const assertStringLength = (
    value,
    fieldName,
    {
        minLength = 0,
        maxLength,
    }
) => {
    if (
        typeof value !== "string"
    ) {
        throw new Error(
            `${fieldName} must be a string.`
        );
    }

    const length =
        value.trim().length;

    if (
        length < minLength
    ) {
        throw new Error(
            `${fieldName} must contain at least ${minLength} characters.`
        );
    }

    if (
        length > maxLength
    ) {
        throw new Error(
            `${fieldName} cannot exceed ${maxLength} characters.`
        );
    }
};

// ============================================================
// Validate AI Operation
// ============================================================

const validateOperation = (
    operation
) => {
    if (
        typeof operation !==
        "string"
    ) {
        throw new Error(
            "AI operation must be a string."
        );
    }

    if (
        !SUPPORTED_OPERATIONS.includes(
            operation
        )
    ) {
        throw new Error(
            `Unsupported AI operation: ${operation}.`
        );
    }

    return operation;
};

// ============================================================
// Validate Prompt
// ============================================================

const validatePrompt = (
    prompt
) => {
    assertStringLength(
        prompt,
        "Prompt",
        AI_LIMITS.prompt
    );

    return prompt.trim();
};

// ============================================================
// Validate Resume Text
// ============================================================

const validateResumeText = (
    text
) => {
    assertStringLength(
        text,
        "Resume text",
        AI_LIMITS.text
    );

    return text.trim();
};

// ============================================================
// Validate Instructions
// ============================================================

const validateInstructions = (
    instructions
) => {
    if (
        instructions ===
        undefined
    ) {
        return "";
    }

    assertStringLength(
        instructions,
        "Instructions",
        AI_LIMITS.instructions
    );

    return instructions.trim();
};

// ============================================================
// Validate AI Request Body
// ============================================================
//
// Supported shape:
//
// {
//     operation: "improve",
//     text: "...",
//     prompt: "...",
//     instructions: "..."
// }
//
// Not every operation necessarily requires every field.
// The service layer can apply operation-specific business
// requirements after this structural validation.
// ============================================================

const validateAIRequest = (
    body
) => {
    if (
        !isPlainObject(body)
    ) {
        throw new Error(
            "AI request body must be an object."
        );
    }

    const {
        operation,
        prompt,
        text,
        instructions,
    } = body;

    const validated = {
        operation:
            validateOperation(
                operation
            ),
    };

    if (
        prompt !== undefined
    ) {
        validated.prompt =
            validatePrompt(
                prompt
            );
    }

    if (
        text !== undefined
    ) {
        validated.text =
            validateResumeText(
                text
            );
    }

    if (
        instructions !==
        undefined
    ) {
        validated.instructions =
            validateInstructions(
                instructions
            );
    }

    // --------------------------------------------------------
    // At least one AI input is required.
    // --------------------------------------------------------

    if (
        !isNonEmptyString(
            prompt
        ) &&
        !isNonEmptyString(
            text
        )
    ) {
        throw new Error(
            "AI request must include either prompt or text."
        );
    }

    return validated;
};

// ============================================================
// Express Middleware
// ============================================================
//
// Usage:
//
// router.post(
//     "/improve",
//     authMiddleware,
//     validateAIRequestMiddleware,
//     aiController.improve
// );
//
// The validated payload is placed on req.validatedAIRequest
// instead of mutating req.body.
// ============================================================

export const validateAIRequestMiddleware = (
    req,
    res,
    next
) => {
    try {
        req.validatedAIRequest =
            validateAIRequest(
                req.body
            );

        return next();
    } catch (error) {
        return res.status(400).json({
            success: false,

            message:
                error?.message ||
                "Invalid AI request.",
        });
    }
};

// ============================================================
// Pure Validator Export
// ============================================================
//
// Useful for services/tests that need to validate an AI
// payload without going through Express.
// ============================================================

export {
    AI_LIMITS,
    SUPPORTED_OPERATIONS,
    validateAIRequest,
    validateOperation,
    validatePrompt,
    validateResumeText,
    validateInstructions,
};

export default validateAIRequest;