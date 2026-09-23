import { useEffect, useState } from 'react';

const STORAGE_KEY = 'curatocv_resume_draft';

export function useLocalResumePersistence(resumeId, resumeData) {
  const [loadedLocal, setLoadedLocal] = useState(false);

  // Load from localStorage when component mounts or resumeId changes
  useEffect(() => {
    if (!resumeId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id === resumeId && parsed.data) {
          // Only use local if server hasn't loaded yet; this is handled by parent
          // We just mark that local data exists
          setLoadedLocal(true);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [resumeId]);

  // Save to localStorage whenever resumeData changes
  useEffect(() => {
    if (!resumeId || !resumeData) return;
    try {
      const payload = { id: resumeId, data: resumeData, savedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore storage errors
    }
  }, [resumeId, resumeData]);

  return { loadedLocal, storageKey: STORAGE_KEY };
}

export default useLocalResumePersistence;
