import {
    Eye,
    EyeOff,
    Lightbulb,
    Plus,
    Trash2,
    Check,
    Loader2,
    GripVertical,
    MoreVertical,
} from "lucide-react";
import { useState, useCallback } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import {
    createResumeEntry,
    normalizeEntryOrder,
    updateEntryData,
} from "../../utils/resume";
import EntryEditor from "../ContentEditor/EntryEditor";
import SortableEntry from "./SortableEntry";

const SkillsForm = ({
    entries = [],
    onChange,
    onEditEntry,
    onAddEntry,
    sectionType = "skills",
}) => {
    const [editingEntry, setEditingEntry] = useState(null);
    const [showTips, setShowTips] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const updateSkill = useCallback((entryId, field, value) => {
        onChange(updateEntryData(entries, entryId, { [field]: value }));
    }, [entries, onChange]);

    const handleAddEntry = useCallback(() => {
        if (onAddEntry) {
            onAddEntry();
        } else {
            const entry = createResumeEntry(
                { category: "", skills: [] },
                entries.length,
            );
            onChange(normalizeEntryOrder([...entries, entry]));
            setEditingEntry(entry._id);
        }
    }, [onAddEntry, onChange, entries]);

    const handleEditEntry = useCallback((entryId) => {
        if (onEditEntry) {
            onEditEntry(entryId);
        } else {
            setEditingEntry(entryId);
        }
    }, [onEditEntry]);

    const handleSaveEntry = useCallback((updatedEntryEnvelope) => {
        setIsSaving(true);
        let newEntries;
        if (updatedEntryEnvelope._id && !entries.some(e => String(e._id) === String(updatedEntryEnvelope._id))) {
            // New entry
            newEntries = [...(entries || []), updatedEntryEnvelope];
        } else {
            // Update existing
            newEntries = (entries || []).map((e) =>
                String(e._id) === String(updatedEntryEnvelope._id) ? updatedEntryEnvelope : e
            );
        }
        onChange(normalizeEntryOrder(newEntries));
        setEditingEntry(null);
        setShowTips(false);
        setIsSaving(false);
    }, [entries, onChange]);

    const handleDeleteEntry = useCallback((entryId) => {
        onChange(
            normalizeEntryOrder(
                entries.filter(
                    (entry) => String(entry._id) !== String(entryId),
                ),
            ),
        );
        setEditingEntry(null);
    }, [entries, onChange]);

    const handleToggleVisibility = useCallback((entryId, isVisible) => {
        onChange(
            entries.map((entry) =>
                String(entry._id) === String(entryId)
                    ? { ...entry, visible: isVisible }
                    : entry,
            ),
        );
    }, [entries, onChange]);

    const handleVisibilityToggle = useCallback((entryId) => {
        onChange(
            entries.map((entry) =>
                String(entry._id) === String(entryId)
                    ? { ...entry, visible: !entry.visible }
                    : entry,
            ),
        );
    }, [entries, onChange]);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = entries.findIndex(
            (entry) => String(entry._id) === String(active.id),
        );
        const newIndex = entries.findIndex(
            (entry) => String(entry._id) === String(over.id),
        );
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = normalizeEntryOrder(
            arrayMove(entries, oldIndex, newIndex),
        );
        onChange(reordered);
    }, [entries, onChange]);

    // When editingEntry is set via fallback (not using onEditEntry), show inline editor
    const editingEntryData = entries.find(e => String(e._id) === String(editingEntry));
    const showInlineEditor = editingEntryData && !onEditEntry;

    const entryList = entries.map((entry) => {
        const data = entry.data || {};
        const isOpen = showInlineEditor && String(editingEntry) === String(entry._id);
        const isVisible = entry.visible !== false;

        return (
            <SortableEntry key={entry._id} id={entry._id}>
                <div
                    className={
                        isVisible ? "" : "bg-slate-50 opacity-60"
                    }
                >
                    <div
                        onClick={() => handleEditEntry(entry._id)}
                        className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                    >
                        <span
                            className="min-w-0 flex-1 text-left text-sm font-semibold text-slate-800"
                        >
                            {data.category || "Untitled Skill"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleVisibilityToggle(entry._id)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title={
                                    isVisible
                                        ? "Hide skill category"
                                        : "Show skill category"
                                }
                                aria-label={
                                    isVisible
                                        ? "Hide skill category"
                                        : "Show skill category"
                                }
                            >
                                {isVisible ? (
                                    <Eye className="size-4" />
                                ) : (
                                    <EyeOff className="size-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete skill category"
                                aria-label="Delete skill category"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </div>

                    {showInlineEditor && isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
                            <EntryEditor
                                entry={editingEntryData}
                                sectionType={sectionType}
                                onSave={handleSaveEntry}
                                onCancel={() => setEditingEntry(null)}
                                onDelete={() => handleDeleteEntry(editingEntryData._id)}
                                onToggleVisibility={(isVisible) => handleToggleVisibility(editingEntryData._id, isVisible)}
                            />
                        </div>
                    )}
                </div>
            </SortableEntry>
        );
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Skill categories
                    </p>
                    <p className="text-xs text-slate-500">
                        Group related skills into clear resume sections.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleAddEntry}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-[#17375F] hover:text-[#17375F]"
                >
                    <Plus className="size-4" /> Add Entry
                </button>
            </div>

            {entries.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    No skill categories yet. Add your first entry below.
                </div>
            )}

            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={entries.map((entry) => entry._id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {entryList}
                    </div>
                </SortableContext>
            </DndContext>

            <button
                type="button"
                onClick={handleAddEntry}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#17375F] hover:text-[#17375F]"
            >
                <Plus className="size-4" /> Add Entry
            </button>
        </div>
    );
};

export default SkillsForm;
