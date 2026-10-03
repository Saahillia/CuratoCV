const RESUME_COLLECTION_UPDATED_EVENT = "curatocv:resume-collection-updated";

/** Notify open Platform surfaces that a server-confirmed resume was created or removed. */
export const notifyResumeCollectionUpdated = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(RESUME_COLLECTION_UPDATED_EVENT));
    }
};

/** Subscribe to same-tab resume collection changes. Cross-tab freshness is handled by polling. */
export const subscribeToResumeCollectionUpdates = (listener) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(RESUME_COLLECTION_UPDATED_EVENT, listener);
    return () => window.removeEventListener(RESUME_COLLECTION_UPDATED_EVENT, listener);
};
