import OpenAI from "openai";

// ============================================================
// OpenAI-compatible AI Client Configuration
// ============================================================
//
// CuratoCV uses an OpenAI-compatible AI provider.
//
// SECURITY REQUIREMENTS
// ------------------------------------------------------------
// - GEMINI_API_KEY must exist ONLY on the backend.
// - Never expose GEMINI_API_KEY through Vite.
// - Never hard-code API credentials.
// - GEMINI_BASE_URL must come from backend environment config.
// - Remote AI communication must use HTTPS.
// ============================================================

// ------------------------------------------------------------
// Environment configuration
// ------------------------------------------------------------

const providerApiKey = process.env.GEMINI_API_KEY?.trim();
const providerBaseUrl = process.env.GEMINI_BASE_URL?.trim();

// ------------------------------------------------------------
// Required environment variables
// ------------------------------------------------------------

if (!providerApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
}

if (!providerBaseUrl) {
    throw new Error("GEMINI_BASE_URL is not configured.");
}

// ------------------------------------------------------------
// Validate base URL
// ------------------------------------------------------------

let parsedBaseUrl;

try {
    parsedBaseUrl = new URL(providerBaseUrl);
} catch {
    throw new Error("AI_BASE_URL is not a valid URL.");
}

// ------------------------------------------------------------
// Validate protocol
// ------------------------------------------------------------
//
// HTTPS is required for remote AI providers.
//
// HTTP is allowed only for local development
// environments such as localhost/127.0.0.1/::1.
// ------------------------------------------------------------

const localDevelopmentHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const isLocalDevelopmentHost = localDevelopmentHosts.has(
    parsedBaseUrl.hostname,
);

if (parsedBaseUrl.protocol !== "https:" && !isLocalDevelopmentHost) {
    throw new Error("AI_BASE_URL must use HTTPS outside local development.");
}

// ------------------------------------------------------------
// Prevent credentials from accidentally being embedded
// inside the provider URL.
// ------------------------------------------------------------

if (parsedBaseUrl.username || parsedBaseUrl.password) {
    throw new Error("AI_BASE_URL must not contain embedded credentials.");
}

// ------------------------------------------------------------
// AI client
// ------------------------------------------------------------

const ai = new OpenAI({
    apiKey: providerApiKey,
    baseURL: parsedBaseUrl.toString(),
});

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

export default ai;
