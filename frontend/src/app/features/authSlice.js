import { createSlice } from "@reduxjs/toolkit";

// ============================================================
// CuratoCV Authentication Slice
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
// This file must NOT import the API client.
//
// Dependency direction:
//
//     store
//       ↓
//     authSlice
//
// The API client may import the store for global 401 handling,
// but authSlice must never import the API client.
//
// Keeping TOKEN_STORAGE_KEY here prevents the circular
// dependency:
//
//     store → authSlice → api → store
//
// ============================================================

export const TOKEN_STORAGE_KEY = "curatocv_token";

// ============================================================
// Initial State
// ============================================================

const initialState = {
    user: null,
    token: null,
    loading: true,
};

// ============================================================
// Slice
// ============================================================

const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers: {
        // --------------------------------------------------------
        // Login
        // --------------------------------------------------------

        login: (state, action) => {
            const token = action.payload?.token ?? null;
            const user = action.payload?.user ?? null;

            state.token = token;
            state.user = user;

            if (token) {
                try {
                    localStorage.setItem(
                        TOKEN_STORAGE_KEY,
                        token
                    );
                } catch {
                    // Ignore localStorage failures.
                    //
                    // The backend remains authoritative for
                    // authentication.
                }
            }
        },

        // --------------------------------------------------------
        // Logout
        // --------------------------------------------------------

        logout: (state) => {
            state.token = null;
            state.user = null;

            try {
                localStorage.removeItem(
                    TOKEN_STORAGE_KEY
                );
            } catch {
                // Ignore localStorage failures.
            }
        },

        // --------------------------------------------------------
        // Update User Profile
        // --------------------------------------------------------

        updateUser: (state, action) => {
            if (state.user && action.payload) {
                state.user = {
                    ...state.user,
                    ...action.payload,
                };
            }
        },

        // --------------------------------------------------------
        // Loading State
        // --------------------------------------------------------

        setLoading: (state, action) => {
            state.loading = Boolean(action.payload);
        },
    },
});

// ============================================================
// Actions
// ============================================================

export const {
    login,
    logout,
    updateUser,
    setLoading,
} = authSlice.actions;

// ============================================================
// Reducer
// ============================================================

export default authSlice.reducer;