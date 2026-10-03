const ALLOWED_SUGGESTION_FIELDS = new Set(["description", "text", "details", "name", "technologies"]);

/** Apply only explicit, exact-match field suggestions to an in-memory resume draft. */
export function applyResumeSuggestions(resumeData, suggestions) {
    if (!resumeData || !Array.isArray(resumeData.sections) || !Array.isArray(suggestions) || !suggestions.length) return null;
    const seen = new Set();
    for (const suggestion of suggestions) {
        if (!suggestion || typeof suggestion.sectionId !== "string" || typeof suggestion.entryId !== "string" || !ALLOWED_SUGGESTION_FIELDS.has(suggestion.field) || typeof suggestion.oldText !== "string" || typeof suggestion.newText !== "string") return null;
        const key = `${suggestion.sectionId}:${suggestion.entryId}:${suggestion.field}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const section = resumeData.sections.find((item) => item._id === suggestion.sectionId);
        const entry = section?.entries?.find((item) => item._id === suggestion.entryId);
        if (entry?.data?.[suggestion.field] !== suggestion.oldText) return null;
    }

    const changes = new Map(suggestions.map((item) => [`${item.sectionId}:${item.entryId}:${item.field}`, item]));
    return {
        ...resumeData,
        sections: resumeData.sections.map((section) => ({
            ...section,
            entries: (section.entries || []).map((entry) => {
                const updates = Object.values(entry.data || {}).length
                    ? Object.fromEntries(Object.entries(entry.data).map(([field, value]) => {
                        const change = changes.get(`${section._id}:${entry._id}:${field}`);
                        return [field, change ? change.newText : value];
                    }))
                    : entry.data;
                const affected = suggestions.some((item) => item.sectionId === section._id && item.entryId === entry._id);
                return affected ? { ...entry, data: updates } : entry;
            }),
        })),
    };
}
