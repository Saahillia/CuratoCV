import billingService from "../platform/backend/src/services/billingService.js";
import aiProvider from "./aiProvider.js";
import logger from "../Configs/logger.js";

// ============================================================
// CuratoCV AI Service
// ============================================================
//
// Business-logic layer for AI operations with credit
// entitlement enforcement and atomic consumption.
//
// Responsibilities:
// - Check user AI entitlement before generation
// - Call Gemini API with validated prompts
// - Atomically consume credits on success
// - Prevent credit deduction on failure
// - Log AI operations for audit trail
// - Handle AI-specific errors gracefully
//
// NOT responsible for:
// - HTTP req/res
// - Authentication
// - Authorization middleware
// - Resume model operations
// - Direct MongoDB access
// - Email notifications
//
// Controllers delegate AI work to this service.
// Billing service handles atomic credit consumption.
// ============================================================

// ============================================================
// Configuration
// ============================================================

const MAX_PROMPT_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 5000;
const MAX_AI_OUTPUT_LENGTH = 5000;

const AI_TIMEOUT_MS = 30_000;

// ============================================================
// Credit Cost Configuration
// ============================================================
//
// Different AI operations consume different credit amounts.
// These are application-defined costs, not Gemini request
// counts.
//
// ============================================================

const CREDIT_COSTS = Object.freeze({
    GENERATE: 2,
    IMPROVE: 1,
});

// ============================================================
// Helper: Create Abort Signal
// ============================================================

const createAbortSignal = () => {
    return AbortSignal.timeout(AI_TIMEOUT_MS);
};

// ============================================================
// Helper: Strip Control Characters
// ============================================================
//
// Removes null bytes and other control characters that could
// interfere with Gemini processing or be used for injection.
//
// ============================================================

const stripControlCharacters = (text) => {
    if (typeof text !== "string") {
        return "";
    }

    // Remove null bytes and other C0/C1 control characters
    // (except for common whitespace: tab, newline, carriage return)
    return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
};

// ============================================================
// Helper: Validate and Normalize Prompt
// ============================================================

const validatePrompt = (value) => {
    if (typeof value !== "string") {
        return {
            valid: false,
            message: "Prompt must be text.",
        };
    }

    const cleaned = stripControlCharacters(value.trim());

    if (!cleaned) {
        return {
            valid: false,
            message: "Prompt cannot be empty.",
        };
    }

    if (cleaned.length > MAX_PROMPT_LENGTH) {
        return {
            valid: false,
            message: `Prompt exceeds the maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
        };
    }

    return {
        valid: true,
        prompt: cleaned,
    };
};

// ============================================================
// Helper: Validate and Normalize Content
// ============================================================

const validateContent = (value) => {
    if (typeof value !== "string") {
        return {
            valid: false,
            message: "Content must be text.",
        };
    }

    const cleaned = stripControlCharacters(value.trim());

    if (!cleaned) {
        return {
            valid: false,
            message: "Content cannot be empty.",
        };
    }

    if (cleaned.length > MAX_CONTENT_LENGTH) {
        return {
            valid: false,
            message: `Content exceeds the maximum allowed length of ${MAX_CONTENT_LENGTH} characters.`,
        };
    }

    return {
        valid: true,
        content: cleaned,
    };
};

// ============================================================
// Helper: Extract Message Content
// ============================================================

const getMessageContent = (response) => {
    const content = response?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
        return "";
    }

    return content.trim();
};

// ============================================================
// Check AI Entitlement
// ============================================================
//
// Verifies the user has remaining AI credits available.
//
// @param {string} userId
// @returns {Object} { enabled, remaining }
// @throws {Error} 403 if AI is disabled or credits exhausted
//
// ============================================================

export const checkAIEntitlement = async (userId) => {
    if (userId && typeof userId === "object" && userId.toString) {
        userId = userId.toString();
    }
    if (typeof userId !== "string" || !userId.trim()) {
        throw new Error("Invalid user ID.");
    }

    const entitlement = await billingService.getUserAIEntitlement(userId);

    if (!entitlement.enabled) {
        const error = new Error(
            "AI credit quota exceeded. Upgrade your subscription for more credits.",
        );
        error.statusCode = 403;
        throw error;
    }

    const remaining = entitlement.creditsGranted - entitlement.creditsUsed;

    if (remaining <= 0) {
        const error = new Error(
            "AI credit quota exceeded. Upgrade your subscription for more credits.",
        );
        error.statusCode = 403;
        throw error;
    }

    return {
        enabled: true,
        remaining,
        creditsGranted: entitlement.creditsGranted,
        creditsUsed: entitlement.creditsUsed,
    };
};

// ============================================================
// Generate Content
// ============================================================
//
// Calls Gemini to generate new content based on a prompt.
//
// Flow:
// 1. Check entitlement (403 if no credits)
// 2. Validate prompt (400 if invalid)
// 3. Call Gemini API
// 4. On success, atomically consume credits
// 5. On failure, don't charge user
// 6. Return generated content
//
// @param {string} userId
// @param {string} prompt - User instruction
// @param {string} systemPrompt - AI system context
// @param {number} [maxTokens=300]
// @returns {Object} { generated, creditsConsumed }
// @throws {Error} with statusCode property
//
// ============================================================

export const generateContent = async (
    userId,
    prompt,
    systemPrompt,
    maxTokens = 300,
) => {
    // ====================================================
    // Check Entitlement
    // ====================================================

    const entitlement = await checkAIEntitlement(userId);

    const creditsNeeded = CREDIT_COSTS.GENERATE;

    if (entitlement.remaining < creditsNeeded) {
        const error = new Error(
            "AI credit quota exceeded. Upgrade your subscription for more credits.",
        );
        error.statusCode = 403;
        throw error;
    }

    // ====================================================
    // Validate Prompt
    // ====================================================

    const promptValidation = validatePrompt(prompt);

    if (!promptValidation.valid) {
        const error = new Error(promptValidation.message);
        error.statusCode = 400;
        throw error;
    }

    // ====================================================
    // Call Gemini API
    // ====================================================

    let response;

    try {
        response = await aiProvider.generateChatCompletion({
            model: process.env.GEMINI_MODEL,

            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },

                {
                    role: "user",
                    content: promptValidation.prompt,
                },
            ],

            max_tokens: maxTokens,
        });
    } catch (error) {
        // ================================================
        // Log Failed Generation
        // ================================================

        console.error("AI generation failed:", {
            userId,
            name: error?.name,
            message: error?.message,
            status: error?.status,
            code: error?.code,
        });

        // ================================================
        // Map Error to HTTP Status
        // ================================================

        if (error?.name === "TimeoutError") {
            const err = new Error(
                "The AI service took too long to respond. Please try again.",
            );
            err.statusCode = 504;
            throw err;
        }

        if (error?.status === 429) {
            const err = new Error(
                "Rate limit reached. Try again in a few moments.",
            );
            err.statusCode = 429;
            throw err;
        }

        if (error?.status === 503) {
            const err = new Error(
                "AI service temporarily unavailable. Please try again later.",
            );
            err.statusCode = 503;
            throw err;
        }

        // Generic error (never expose Gemini details)
        const err = new Error("Unable to generate content. Please try again.");
        err.statusCode = 502;
        throw err;
    }

    // ====================================================
    // Extract Generated Content
    // ====================================================

    const generatedContent = getMessageContent(response);

    if (!generatedContent || generatedContent.length > MAX_AI_OUTPUT_LENGTH) {
        console.error("AI returned invalid content:", {
            userId,
            contentLength: generatedContent?.length,
        });

        const error = new Error(
            "Unable to generate content. Please try again.",
        );
        error.statusCode = 502;
        throw error;
    }

    // ====================================================
    // Atomically Consume Credits
    // ====================================================

    try {
        const consumption = await billingService.consumeUserAICredits(
            userId,
            creditsNeeded,
        );

        // ================================================
        // Log Successful Generation
        // ================================================

        console.info("AI generation succeeded:", {
            userId,
            type: "generate",
            creditsConsumed: creditsNeeded,
            creditsRemaining: consumption.creditsRemaining,
            timestamp: new Date().toISOString(),
        });

        return {
            generated: generatedContent,
            creditsConsumed: creditsNeeded,
            creditsRemaining: consumption.creditsRemaining,
        };
    } catch (error) {
        // ================================================
        // Log Credit Exhaustion
        // ================================================

        console.warn("AI credit exhaustion detected:", {
            userId,
            attemptedCreditsNeeded: creditsNeeded,
            availableCredits: entitlement.remaining,
            timestamp: new Date().toISOString(),
        });

        // ================================================
        // Re-throw Error
        // ================================================

        const err = new Error(
            "AI credit quota exceeded. Upgrade your subscription for more credits.",
        );
        err.statusCode = 403;
        throw err;
    }
};

// ============================================================
// Improve Content
// ============================================================
//
// Calls Gemini to improve existing content based on instruction.
//
// Flow:
// 1. Check entitlement (403 if no credits)
// 2. Validate content + instruction (400 if invalid)
// 3. Call Gemini API
// 4. On success, atomically consume credits
// 5. On failure, don't charge user
// 6. Return improved content
//
// @param {string} userId
// @param {string} content - Existing content to improve
// @param {string} instruction - User improvement request
// @param {string} systemPrompt - AI system context
// @param {number} [maxTokens=300]
// @returns {Object} { improved, creditsConsumed }
// @throws {Error} with statusCode property
//
// ============================================================

export const improveContent = async (
    userId,
    content,
    instruction,
    systemPrompt,
    maxTokens = 300,
) => {
    // ====================================================
    // Check Entitlement
    // ====================================================

    const entitlement = await checkAIEntitlement(userId);

    const creditsNeeded = CREDIT_COSTS.IMPROVE;

    if (entitlement.remaining < creditsNeeded) {
        const error = new Error(
            "AI credit quota exceeded. Upgrade your subscription for more credits.",
        );
        error.statusCode = 403;
        throw error;
    }

    // ====================================================
    // Validate Content
    // ====================================================

    const contentValidation = validateContent(content);

    if (!contentValidation.valid) {
        const error = new Error(contentValidation.message);
        error.statusCode = 400;
        throw error;
    }

    // ====================================================
    // Validate Instruction
    // ====================================================

    const instructionValidation = validatePrompt(instruction);

    if (!instructionValidation.valid) {
        const error = new Error(instructionValidation.message);
        error.statusCode = 400;
        throw error;
    }

    // ====================================================
    // Call Gemini API
    // ====================================================

    let response;

    try {
        response = await aiProvider.generateChatCompletion({
            model: process.env.GEMINI_MODEL,

            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },

                {
                    role: "user",
                    content: [
                        `Content to improve:\n\n${contentValidation.content}`,
                        `\n\nImprovement instruction:\n\n${instructionValidation.prompt}`,
                    ].join(""),
                },
            ],

            max_tokens: maxTokens,
        });
    } catch (error) {
        // ================================================
        // Log Failed Improvement
        // ================================================

        console.error("AI improvement failed:", {
            userId,
            name: error?.name,
            message: error?.message,
            status: error?.status,
            code: error?.code,
        });

        // ================================================
        // Map Error to HTTP Status
        // ================================================

        if (error?.name === "TimeoutError") {
            const err = new Error(
                "The AI service took too long to respond. Please try again.",
            );
            err.statusCode = 504;
            throw err;
        }

        if (error?.status === 429) {
            const err = new Error(
                "Rate limit reached. Try again in a few moments.",
            );
            err.statusCode = 429;
            throw err;
        }

        if (error?.status === 503) {
            const err = new Error(
                "AI service temporarily unavailable. Please try again later.",
            );
            err.statusCode = 503;
            throw err;
        }

        // Generic error (never expose Gemini details)
        const err = new Error("Unable to improve content. Please try again.");
        err.statusCode = 502;
        throw err;
    }

    // ====================================================
    // Extract Improved Content
    // ====================================================

    const improvedContent = getMessageContent(response);

    if (!improvedContent || improvedContent.length > MAX_AI_OUTPUT_LENGTH) {
        console.error("AI returned invalid content:", {
            userId,
            contentLength: improvedContent?.length,
        });

        const error = new Error("Unable to improve content. Please try again.");
        error.statusCode = 502;
        throw error;
    }

    // ====================================================
    // Atomically Consume Credits
    // ====================================================

    try {
        const consumption = await billingService.consumeUserAICredits(
            userId,
            creditsNeeded,
        );

        // ================================================
        // Log Successful Improvement
        // ================================================

        console.info("AI improvement succeeded:", {
            userId,
            type: "improve",
            creditsConsumed: creditsNeeded,
            creditsRemaining: consumption.creditsRemaining,
            timestamp: new Date().toISOString(),
        });

        return {
            improved: improvedContent,
            creditsConsumed: creditsNeeded,
            creditsRemaining: consumption.creditsRemaining,
        };
    } catch (error) {
        // ================================================
        // Log Credit Exhaustion
        // ================================================

        console.warn("AI credit exhaustion detected:", {
            userId,
            attemptedCreditsNeeded: creditsNeeded,
            availableCredits: entitlement.remaining,
            timestamp: new Date().toISOString(),
        });

        // ================================================
        // Re-throw Error
        // ================================================

        const err = new Error(
            "AI credit quota exceeded. Upgrade your subscription for more credits.",
        );
        err.statusCode = 403;
        throw err;
    }
};

// ============================================================
// Export
// ============================================================

export default {
    checkAIEntitlement,
    generateContent,
    improveContent,
};
