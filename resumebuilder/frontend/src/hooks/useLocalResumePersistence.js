/**
 * Developer context for resumebuilder/frontend/src/hooks/useLocalResumePersistence.js.
 * Purpose: encapsulate the reusable Resume Builder use Local Resume Persistence state/effect behavior.
 * Why here: product-specific interaction logic stays in the product; check active imports before treating a hook as a runtime path.
 */
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'curatocv_resume_draft';

export function useLocalResumePersistence(resumeId, resumeData) {
  const [loadedLocal, setLoadedLocal] = useState(false);

  // Load from localStorage when component mounts or resumeId changes
  useEffect(() => {
    // Do not read a global draft until this hook is associated with a specific resume.
    if (!resumeId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Parsing can fail for stale/corrupt browser data; storage is a best-effort recovery path.
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
    // Avoid writing incomplete editor state before both the resume identity and data are available.
    if (!resumeId || !resumeData) return;
    try {
      const payload = { id: resumeId, data: resumeData, savedAt: new Date().toISOString() };
      // Keep the ID beside the snapshot so consumers can reject a draft belonging to another resume.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore storage errors
    }
  }, [resumeId, resumeData]);

  return { loadedLocal, storageKey: STORAGE_KEY };
}

export default useLocalResumePersistence;
