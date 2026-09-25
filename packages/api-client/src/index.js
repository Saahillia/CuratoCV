// ============================================================
// CuratoCV API Client
// ============================================================
//
// Centralized axios instance for the CuratoCV frontend.
//
// Responsibilities:
// - Provide a single configured axios instance (baseURL + token)
// - Auto-attach the Bearer token from localStorage
// - Centralize the API base URL configuration
//
// SECURITY NOTES
// ------------------------------------------------------------
// - The token is read from localStorage at request time. Never
//   embed secrets (Razorpay secret, JWT secret, etc.) here.
// - This client is for authenticated API calls only. Razorpay
//   checkout uses VITE_RAZORPAY_KEY_ID separately in the UI.
// - Pricing, limits, and authorization are enforced by the
//   backend. The frontend NEVER authorizes itself.
// ============================================================

import axios from "axios";

// ============================================================
// Configuration
// ============================================================

let rawBaseUrl =
    (typeof import.meta !== "undefined" && import.meta.env && (
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_BASE_URL
    )) ||
    "http://localhost:5000/api";

if (rawBaseUrl.endsWith("/")) {
    rawBaseUrl = rawBaseUrl.slice(0, -1);
}

const API_BASE_URL = rawBaseUrl.endsWith("/api")
    ? rawBaseUrl
    : `${rawBaseUrl}/api`;

// localStorage key used to persist the JWT. Must match the key
// used by authService when storing/removing the token.
export const TOKEN_STORAGE_KEY = "curatocv_token";

// Callback handler for 401 Unauthorized events (e.g. Redux logout dispatch)
let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};

// ============================================================
// Axios instance
// ============================================================

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

// ============================================================
// Request interceptor
// ============================================================

api.interceptors.request.use(
    (config) => {
        try {
            if (typeof localStorage !== "undefined") {
                const token = localStorage.getItem(TOKEN_STORAGE_KEY);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.warn("Unable to read auth token from storage:", error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// Response interceptor
// ============================================================

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Global 401 handling
        if (error.response && error.response.status === 401) {
            if (typeof unauthorizedHandler === "function") {
                try {
                    unauthorizedHandler();
                } catch (handlerErr) {
                    console.error("Error executing unauthorizedHandler:", handlerErr);
                }
            }
            if (typeof window !== "undefined" && window.location) {
                window.location.href = "/login";
            }
        }
        // Attach a friendly string message when the backend provides one.
        if (error.response && error.response.data) {
            const apiError = error.response.data.error;
            const extractedMsg =
                error.response.data.message ||
                (typeof apiError === "string" ? apiError : apiError?.message);

            if (typeof extractedMsg === "string" && extractedMsg.trim()) {
                error.message = extractedMsg;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
