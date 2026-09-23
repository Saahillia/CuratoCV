import OpenAI from "openai";
import primaryAi from "./configs/ai.js";
import logger from "../../platform/backend/src/configs/logger.js";

const PRIMARY_PROVIDER = "gemini";
const FALLBACK_PROVIDER = "groq";
const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
const DEFAULT_TIMEOUT_MS = 30_000;

const fallbackApiKey = process.env.GROQ_API_KEY?.trim();
const fallbackBaseUrl =
    process.env.GROQ_BASE_URL?.trim() || DEFAULT_GROQ_BASE_URL;
const fallbackModel = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
const timeoutMs =
    Number(process.env.AI_PROVIDER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

const fallbackEnabled =
    process.env.NODE_ENV !== "test" ||
    process.env.AI_PROVIDER_INTEGRATION_TEST === "true";

const fallbackAi =
    fallbackApiKey && fallbackEnabled
        ? new OpenAI({ apiKey: fallbackApiKey, baseURL: fallbackBaseUrl })
        : null;

const getPrimaryModel = () =>
    process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

const providerStatus = (error) =>
    Number.isInteger(error?.status) ? error.status : null;

const isFallbackEligible = (error) => {
    const status = providerStatus(error);
    const message =
        typeof error?.message === "string" ? error.message.toLowerCase() : "";

    if (status === 401 || status === 403) return false;
    if (status === 400) {
        return (
            message.includes("model") ||
            message.includes("unsupported") ||
            message.includes("unavailable") ||
            message.includes("quota")
        );
    }

    return (
        status === 408 ||
        status === 409 ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        status === 404 ||
        !status
    );
};

const callProvider = async (client, provider, model, request) => {
    const { responseValidator, ...providerRequest } = request;
    const requestPromise = client.chat.completions.create({
        ...providerRequest,
        model,
    });

    let timeoutHandle;
    const timeoutPromise = new Promise((resolve, reject) => {
        timeoutHandle = setTimeout(() => {
            const error = new Error("AI provider request timed out.");
            error.name = "TimeoutError";
            reject(error);
        }, timeoutMs);
    });

    try {
        const response = await Promise.race([requestPromise, timeoutPromise]);

        if (
            fallbackEnabled &&
            typeof responseValidator === "function" &&
            !responseValidator(response)
        ) {
            const error = new Error(
                "AI provider returned invalid extraction data.",
            );
            error.status = 502;
            throw error;
        }

        return response;
    } finally {
        clearTimeout(timeoutHandle);
    }
};

export const generateChatCompletion = async (request) => {
    const primaryModel = getPrimaryModel();

    try {
        const response = await callProvider(
            primaryAi,
            PRIMARY_PROVIDER,
            primaryModel,
            request,
        );

        logger.info("AI provider succeeded", {
            provider: PRIMARY_PROVIDER,
            model: primaryModel,
        });
        return response;
    } catch (primaryError) {
        logger.warn("AI primary provider failed", {
            provider: PRIMARY_PROVIDER,
            model: primaryModel,
            status: providerStatus(primaryError),
            fallbackEligible: isFallbackEligible(primaryError),
        });

        if (!fallbackAi || !isFallbackEligible(primaryError)) {
            throw primaryError;
        }

        logger.warn("AI fallback activated", {
            from: PRIMARY_PROVIDER,
            to: FALLBACK_PROVIDER,
            model: fallbackModel,
        });

        try {
            const response = await callProvider(
                fallbackAi,
                FALLBACK_PROVIDER,
                fallbackModel,
                request,
            );

            logger.info("AI fallback succeeded", {
                provider: FALLBACK_PROVIDER,
                model: fallbackModel,
            });
            return response;
        } catch (fallbackError) {
            logger.error("AI providers failed", {
                primaryProvider: PRIMARY_PROVIDER,
                primaryStatus: providerStatus(primaryError),
                fallbackProvider: FALLBACK_PROVIDER,
                fallbackStatus: providerStatus(fallbackError),
            });
            throw fallbackError;
        }
    }
};

export const classifyProviderFailure = isFallbackEligible;

export default {
    generateChatCompletion,
    classifyProviderFailure,
};
