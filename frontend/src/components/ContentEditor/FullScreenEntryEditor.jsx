import React, { useState } from "react";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import EntryEditor from "./EntryEditor";
import { createResumeEntry, normalizeEntryOrder } from "../../utils/resume";
import { resumeSectionRegistry } from "../../config/resumeSectionRegistry";
import aiService from "../../services/aiService";

const FullScreenEntryEditor = ({
    resumeData,
    setResumeData,
    sectionId,
    entryId,
    mode,
    onDone,
    isSaving,
    lastSavedAt,
}) => {
    const sectionIndex = resumeData.sections.findIndex((s) => String(s._id) === String(sectionId));
    const section = resumeData.sections[sectionIndex];
    if (!section) {
        console.warn("Section not found for editing:", { sectionId, sections: resumeData.sections });
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-700 font-semibold mb-2">Section not found</p>
                <p className="text-sm text-slate-500 mb-6">The section you were editing may have been removed or updated.</p>
                <button
                    onClick={onDone}
                    className="px-4 py-2 bg-[#17375F] text-white text-sm font-semibold rounded-lg hover:bg-[#24527A] transition-colors"
                >
                    Back to Editor
                </button>
            </div>
        );
    }

    const registryEntry = resumeSectionRegistry[section.type] || resumeSectionRegistry.custom;

    // Grab the existing entry or create a fresh one for "create"
    const entry = mode === "edit"
        ? section.entries?.find((e) => String(e._id) === String(entryId))
        : createResumeEntry(registryEntry.defaultEntry || {}, section.entries?.length || 0);

    const [aiTips, setAiTips] = useState(null);
    const [tipsLoading, setTipsLoading] = useState(false);

    if (!entry) {
        // Fallback if edit entry not found
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-red-500 font-semibold mb-4">Entry not found.</p>
                <button
                    onClick={onDone}
                    className="px-4 py-2 bg-[#17375F] text-white rounded-lg hover:bg-[#24527A]"
                >
                    Back to Editor
                </button>
            </div>
        );
    }

    const handleSaveEntry = (updatedEntryEnvelope) => {
        let newEntries;
        if (mode === "create") {
            newEntries = [...(section.entries || []), updatedEntryEnvelope];
        } else {
            newEntries = (section.entries || []).map((e) =>
                String(e._id) === String(entryId) ? updatedEntryEnvelope : e
            );
        }

        newEntries = normalizeEntryOrder(newEntries);

        const newSections = [...resumeData.sections];
        newSections[sectionIndex] = { ...section, entries: newEntries };

        setResumeData({ ...resumeData, sections: newSections });
        onDone();
    };

    const handleDeleteEntry = () => {
        if (mode === "create") {
            onDone(); // nothing to delete yet
            return;
        }
        let newEntries = (section.entries || []).filter((e) => String(e._id) !== String(entryId));
        newEntries = normalizeEntryOrder(newEntries);

        const newSections = [...resumeData.sections];
        newSections[sectionIndex] = { ...section, entries: newEntries };

        setResumeData({ ...resumeData, sections: newSections });
        onDone();
    };

    const handleToggleVisibility = (isVisible) => {
        // The EntryEditor internally toggles it on the `entry` state.
        // Wait, EntryEditor does `onSave = (newData) => { ... }`.
        // Visibility toggle is handled intrinsically via `entry.visible`.
        // The `visible` state is kept in EntryEditor and propagated to `onSave`.
        // For inline toggles, we can just save it immediately.
        let newEntries;
        if (mode === "edit") {
            newEntries = (section.entries || []).map((e) =>
                String(e._id) === String(entryId) ? { ...e, visible: isVisible } : e
            );
            const newSections = [...resumeData.sections];
            newSections[sectionIndex] = { ...section, entries: newEntries };
            setResumeData({ ...resumeData, sections: newSections });
        }
    };

    const formatTime = (dateObj) => {
        if (!dateObj) return "";
        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "numeric",
        }).format(dateObj);
    };

    const handleGetTips = async (entryData) => {
        setTipsLoading(true);
        try {
            const result = await aiService.getEntryTips({
                section: registryEntry.label || section.title,
                entry: entryData || {},
            });
            setAiTips(result.tips);
        } catch (error) {
            setAiTips("AI tips are temporarily unavailable.");
        } finally {
            setTipsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden w-full font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-4 lg:px-8 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10 w-full relative">
                <button
                    type="button"
                    onClick={onDone}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#17375F] transition-colors"
                >
                    <ChevronLeft className="size-4" />
                    Back to {section.title || registryEntry.label || "Summary"}
                </button>
                <div className="flex items-center gap-4">
                    {/* Status */}
                    <div className="text-xs font-semibold">
                        {isSaving ? (
                            <span className="flex items-center gap-1.5 text-slate-500">
                                <Loader2 className="size-3.5 animate-spin" />
                                Saving...
                            </span>
                        ) : lastSavedAt ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                                <Check className="size-3.5" />
                                Saved {formatTime(lastSavedAt)}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-emerald-600">
                                <Check className="size-3.5" />
                                All changes saved
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main scrollable area */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 lg:p-6 custom-scrollbar pb-12">
                <div className="w-full max-w-[800px] mx-auto space-y-4">
                    {/* Render existing editor */}
                    <EntryEditor
                        entry={entry}
                        sectionType={section.type}
                        onSave={handleSaveEntry}
                        onCancel={onDone}
                        onDelete={handleDeleteEntry}
                        onToggleVisibility={handleToggleVisibility}
                        onAiEnhance={(description, meta) => handleGetTips(description)}
                    />

                    {/* AI Tips Panel below the form */}
                    {aiTips && (
                        <div className="bg-white rounded-xl border-2 border-blue-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="px-5 py-3 border-b border-blue-50 bg-blue-50/40 flex items-center justify-between">
                                <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-1.5">
                                    ✨ Writing Tips & Suggestions
                                </h3>
                                <button
                                    onClick={() => setAiTips(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded hover:text-slate-700 transition"
                                >
                                    <span className="sr-only">Close</span>
                                    ✕
                                </button>
                            </div>
                            <div className="p-5">
                                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                    {aiTips}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FullScreenEntryEditor;