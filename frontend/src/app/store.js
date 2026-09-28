/**
 * Developer context for frontend/src/app/store.js.
 * Purpose: configure or compose the root application store behavior.
 * Why here: the root shell owns app-wide bootstrap, routing, providers, and integration—not product business logic.
 */
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@curatocv/platform-frontend/features/authSlice";

export const store = configureStore({
    // Authentication is Platform-owned; the shell registers its public reducer export for app-wide access.
    reducer: {
        auth: authReducer,
    },
});
