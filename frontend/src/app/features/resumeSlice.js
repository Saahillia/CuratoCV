// ============================================================
// CuratoCV Resume Slice
// ============================================================
//
// Redux slice for managing resume state (list, current, dirty state).
// ============================================================

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    resumes: [],           // User's resumes list
    currentResume: null,   // Currently editing resume
    loading: false,        // List loading
    saving: false,         // Save in progress
    error: null,           // Last error
    lastSaved: null,       // Timestamp of last successful save
    isDirty: false,        // Unsaved changes flag
};

const resumeSlice = createSlice({
    name: "resumes",
    initialState,
    reducers: {
        setResumes: (state, action) => {
            state.resumes = action.payload || [];
            state.loading = false;
        },
        addResume: (state, action) => {
            state.resumes.unshift(action.payload);
        },
        removeResume: (state, action) => {
            state.resumes = state.resumes.filter(r => r.id !== action.payload);
        },
        setCurrentResume: (state, action) => {
            state.currentResume = action.payload;
            state.isDirty = false;
        },
        updateCurrentResume: (state, action) => {
            if (state.currentResume) {
                state.currentResume = { ...state.currentResume, ...action.payload };
                state.isDirty = true;
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setSaving: (state, action) => {
            state.saving = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setDirty: (state, action) => {
            state.isDirty = action.payload;
        },
        setLastSaved: (state, action) => {
            state.lastSaved = action.payload;
        },
        clearCurrentResume: (state) => {
            state.currentResume = null;
            state.isDirty = false;
        },
    },
});

export const {
    setResumes,
    addResume,
    removeResume,
    setCurrentResume,
    updateCurrentResume,
    setLoading,
    setSaving,
    setError,
    clearError,
    setDirty,
    setLastSaved,
    clearCurrentResume,
} = resumeSlice.actions;

export default resumeSlice.reducer;