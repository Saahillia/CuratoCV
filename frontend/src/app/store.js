import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@curatocv/platform-frontend/features/authSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
});
