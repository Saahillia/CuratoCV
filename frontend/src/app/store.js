import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice.js";
import resumeReducer from "./features/resumeSlice.js";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        resumes: resumeReducer,
    },
});