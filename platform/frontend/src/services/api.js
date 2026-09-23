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
import { store } from "../app/store.js";
import { logout } from "../app/features/authSlice.js";

// ============================================================
// Configuration
// ============================================================
//
// VITE_ env vars are statically inlined by Vite at build time.
// VITE_API_URL is the preferred variable. We also fall back to
// VITE_API_BASE_URL / VITE_BASE_URL so older .env files still
// work. Default points at the local backend.
// ============================================================

let rawBaseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BASE_URL ||
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
//
// Attaches the Bearer token to every outgoing request. The
// token is read fresh on each request so logout/refresh is
// reflected immediately without recreating the instance.
// ============================================================

api.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem(TOKEN_STORAGE_KEY);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            // localStorage may be unavailable (e.g. privacy mode).
            // Proceed without a token; the backend will reject if
            // auth is required.
            console.warn("Unable to read auth token from storage:", error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// Response interceptor (optional convenience)
// ============================================================
//
// Surfaces a normalized error shape so callers can rely on
// error.response.data, but does NOT swallow 401 handling here
// so individual services/components can decide what to do
// (e.g. redirect to login). Keep it minimal.
// ============================================================

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Global 401 handling: clear auth and redirect to login
        if (error.response && error.response.status === 401) {
            try {
                store.dispatch(logout());
            } catch {
                // ignore dispatch errors
            }
            // Redirect to login for UX
            if (typeof window !== "undefined") {
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
