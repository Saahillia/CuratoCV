/**
 * Developer context for resumebuilder/frontend/src/hooks/useResumeAutosave.js.
 * Purpose: encapsulate the reusable Resume Builder use Resume Autosave state/effect behavior.
 * Why here: product-specific interaction logic stays in the product; check active imports before treating a hook as a runtime path.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@curatocv/api-client";

export function useResumeAutosave({ resumeId, resumeData, token, delay = 1000, onSaveSuccess, onSaveError }) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const isInitialMount = useRef(true);
  // Keep the last submitted snapshot so parent rerenders with unchanged data do not trigger saves.
  const prevDataRef = useRef(resumeData);

  const save = useCallback(async (dataToSave) => {
    // A draft cannot be sent without both its server ID and the current user's bearer token.
    if (!resumeId || resumeId === "undefined" || !token) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      // Clone before adapting the payload so autosave never edits React's state object in place.
      const updatedResumeData = structuredClone(dataToSave);
      const pi = updatedResumeData.personalInfo || updatedResumeData.personal_info;

      // Strip File objects from JSON payload
      if (pi && (typeof pi.photo === "object" || typeof pi.image === "object")) {
        delete pi.photo;
        delete pi.image;
      }

      const formData = new FormData();
      formData.append("resumeData", JSON.stringify(updatedResumeData));

      // Send the editor snapshot to the product API; FormData matches the endpoint's multipart handling.
      const { data } = await api.put(`/resumes/update/${resumeId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLastSavedAt(new Date());
      if (onSaveSuccess) onSaveSuccess(data);
    } catch (err) {
      // Preserve the failure for the UI and callback; callers may show a retry/error state.
      const errMsg = err?.response?.data?.message || err.message || "Autosave failed";
      setSaveError(errMsg);
      if (onSaveError) onSaveError(err);
    } finally {
      setIsSaving(false);
    }
  }, [resumeId, token, onSaveSuccess, onSaveError]);

  useEffect(() => {
    if (isInitialMount.current) {
      // Do not write the initially loaded server record back as though it were a user edit.
      isInitialMount.current = false;
      prevDataRef.current = resumeData;
      return;
    }

    if (JSON.stringify(prevDataRef.current) === JSON.stringify(resumeData)) {
      return;
    }

    // Debounce rapid keystrokes into one save; cleanup cancels the pending request timer on newer edits/unmount.
    prevDataRef.current = resumeData;

    const timer = setTimeout(() => {
      save(resumeData);
    }, delay);

    return () => clearTimeout(timer);
  }, [resumeData, delay, save]);

  return { isSaving, lastSavedAt, saveError, forceSave: () => save(resumeData) };
}

export default useResumeAutosave;
