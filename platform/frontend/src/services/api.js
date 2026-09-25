// ============================================================
// CuratoCV API Client
// ============================================================
//
// Re-exports the shared @curatocv/api-client package.
// This file delegates to the canonical shared HTTP client
// and only adds platform-specific configuration if needed.
//
// ============================================================

export { default } from "@curatocv/api-client";
export { TOKEN_STORAGE_KEY, setUnauthorizedHandler } from "@curatocv/api-client";
