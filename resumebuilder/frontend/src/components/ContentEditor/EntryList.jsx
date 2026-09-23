import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import {
    Eye,
    EyeOff,
    Plus,
    Trash2,
} from "lucide-react";
import SortableEntry from "../Forms/SortableEntry";
import { createResumeEntry, normalizeEntryOrder } from "../../utils/resume";

/**
 * Generic, reusable entry-list editor.
 *
 * Responsibilities:
 *   - Render a list of entry envelopes (with metadata)
 *   - Add / delete / reorder / visibility-toggle entries
 *   - Delegate data editing via onEditEntry / onAddEntry callbacks
 *     (the parent opens a full-screen editor for the actual editing)
 *
 * Non-responsibilities (left to the parent):
 *   - Knowing the section type or its data shape
 *   - Knowing how the parent persists data
 *   - Rendering the actual entry editing UI
 *
 * Entry contract (caller's responsibility):
 *   {
 *     _id, order, visible, customization, data
 *   }
 */
const EntryList = ({
    entries = [],
    onChange,
    onAdd,
    onDelete,
    onReorder,
    onToggleVisibility,
    onEditEntry,   // (entryId) => void — opens full-screen editor for an existing entry
    onAddEntry,    // () => void — opens full-screen editor for a new entry
    addLabel = "Add",
    emptyState = null,
    reorderable = true,
    defaultData = {},
    sectionLabel = "Entry",
}) => {
    const handleAdd = () => {
        if (onAddEntry) {
            onAddEntry();
            return;
        }
        const newEntry = createResumeEntry(defaultData, entries.length);
        if (onAdd) {
            onAdd(newEntry);
        } else {
            onChange(normalizeEntryOrder([...entries, newEntry]));
        }
    };

    const handleEdit = (entryId) => {
        if (onEditEntry) {
            onEditEntry(entryId);
        }
    };

    const handleDelete = (entryId) => {
        const updated = normalizeEntryOrder(
            entries.filter((entry) => String(entry._id) !== String(entryId)),
        );
        if (onDelete) {
            onDelete(entryId, updated);
        } else {
            onChange(updated);
        }
    };

    const handleToggleVisibility = (entryId) => {
        const updated = entries.map((entry) =>
            String(entry._id) === String(entryId)
                ? { ...entry, visible: !entry.visible }
                : entry,
        );
        if (onToggleVisibility) {
            onToggleVisibility(entryId, updated);
        } else {
            onChange(updated);
        }
    };

    const handleDragEnd = (event) => {
        if (!reorderable) return;
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
        if (onReorder) {
            onReorder(reordered);
        } else {
            onChange(reordered);
        }
    };

    const listBody = entries.map((entry) => (
        <SortableEntry key={entry._id} id={entry._id}>
            <div
                className={`overflow-hidden rounded-xl border bg-white transition-opacity ${
                    entry.visible === false
                        ? "opacity-60 border-slate-200"
                        : "border-gray-200 hover:border-slate-300"
                }`}
            >
                <div
                    onClick={() => handleEdit(entry._id)}
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                >
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                        {getEntryLabel(entry, sectionLabel)}
                    </span>
                    <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => handleToggleVisibility(entry._id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title={
                                entry.visible === false
                                    ? "Show entry"
                                    : "Hide entry"
                            }
                            aria-label={
                                entry.visible === false
                                    ? "Show entry"
                                    : "Hide entry"
                            }
                        >
                            {entry.visible === false ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(entry._id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete entry"
                            aria-label="Delete entry"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </SortableEntry>
    ));

    return (
        <div className="space-y-3">
            {entries.length === 0 && emptyState ? (
                emptyState
            ) : (
                <>
                    {reorderable ? (
                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={entries.map((entry) => entry._id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">{listBody}</div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="space-y-2">{listBody}</div>
                    )}
                </>
            )}

            <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
            >
                <Plus className="size-4" /> {addLabel}
            </button>
        </div>
    );
};

const getEntryLabel = (entry, sectionLabel) => {
    const data = entry.data || {};
    return (
        data.category ||
        data.name ||
        data.title ||
        data.company ||
        data.institution ||
        data.language ||
        sectionLabel
    );
};

export default EntryList;
