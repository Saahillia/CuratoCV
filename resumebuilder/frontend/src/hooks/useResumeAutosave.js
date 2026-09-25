import { useEffect, useRef, useState, useCallback } from "react";
import api from "@curatocv/api-client";

export function useResumeAutosave({ resumeId, resumeData, token, delay = 1000, onSaveSuccess, onSaveError }) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const isInitialMount = useRef(true);
  const prevDataRef = useRef(resumeData);

  const save = useCallback(async (dataToSave) => {
    if (!resumeId || resumeId === "undefined" || !token) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedResumeData = structuredClone(dataToSave);
      const pi = updatedResumeData.personalInfo || updatedResumeData.personal_info;

      // Strip File objects from JSON payload
      if (pi && (typeof pi.photo === "object" || typeof pi.image === "object")) {
        delete pi.photo;
        delete pi.image;
      }

      const formData = new FormData();
      formData.append("resumeData", JSON.stringify(updatedResumeData));

      const { data } = await api.put(`/resumes/update/${resumeId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLastSavedAt(new Date());
      if (onSaveSuccess) onSaveSuccess(data);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || "Autosave failed";
      setSaveError(errMsg);
      if (onSaveError) onSaveError(err);
    } finally {
      setIsSaving(false);
    }
  }, [resumeId, token, onSaveSuccess, onSaveError]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevDataRef.current = resumeData;
      return;
    }

    if (JSON.stringify(prevDataRef.current) === JSON.stringify(resumeData)) {
      return;
    }

    prevDataRef.current = resumeData;

    const timer = setTimeout(() => {
      save(resumeData);
    }, delay);

    return () => clearTimeout(timer);
  }, [resumeData, delay, save]);

  return { isSaving, lastSavedAt, saveError, forceSave: () => save(resumeData) };
}

export default useResumeAutosave;
