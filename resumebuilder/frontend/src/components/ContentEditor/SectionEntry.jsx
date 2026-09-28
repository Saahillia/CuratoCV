/**
 * Developer context for resumebuilder/frontend/src/components/ContentEditor/SectionEntry.jsx.
 * Purpose: implement the Resume Builder content-editing UI for Section Entry.
 * Why here: editing controls stay inside Resume Builder and communicate through the editor's resume-data callbacks rather than owning application routing.
 */
import React, { useState } from "react";
import { Eye, EyeOff, Trash2, GripVertical, ChevronRight, Edit3, MoreVertical } from "lucide-react";
import EntryEditor from "./EntryEditor";

const SectionEntry = ({
  entry = {},
  sectionType = "experience",
  onUpdate,
  onDelete,
  onAiEnhance,
  dragHandleProps,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Older entries may store fields directly while newer ones wrap them in `data`; support both shapes when rendering.
  const entryData = entry.data || entry;
  const isVisible = entry.visible !== false;

  // Resume data has historical naming variants, so choose the first available field for a readable summary.
  const title =
    entryData.title ||
    entryData.position ||
    entryData.name ||
    entryData.degree ||
    entryData.language ||
    "Untitled Entry";

  const subtitle =
    entryData.subtitle ||
    entryData.company ||
    entryData.institution ||
    entryData.proficiency ||
    entryData.type ||
    "";

  const dates = entryData.startDate || entryData.start_date || entryData.date || entryData.year || "";
  const endDate = entryData.isCurrent || entryData.is_current ? "Present" : entryData.endDate || entryData.end_date || "";
  const dateRange = dates ? (endDate ? `${dates} – ${endDate}` : dates) : "";
  const location = entryData.location || entryData.field || "";

  const handleToggleVisibility = (e) => {
    // Stop the card click from opening the editor, then update this entry without mutating its existing object.
    e.stopPropagation();
    onUpdate({
      ...entry,
      visible: !isVisible,
    });
  };

  const handleDeleteConfirm = () => {
    // Only the explicit confirmation action reaches the parent's delete callback.
    setShowDeleteConfirm(false);
    onDelete();
  };

  if (isEditing) {
    // The editor owns field-level edits; this card forwards its result and closes only after save/cancel.
    return (
      <EntryEditor
        entry={entry}
        sectionType={sectionType}
        onSave={(updatedEntry) => {
          onUpdate(updatedEntry);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
        onDelete={onDelete}
        onToggleVisibility={(visible) => {
          onUpdate({ ...entry, visible });
        }}
        onAiEnhance={onAiEnhance}
      />
    );
  }

  return (
    <div
      className={`group bg-white rounded-xl border transition-all duration-150 relative mb-2.5 select-none ${
        isVisible
          ? "border-slate-200 hover:border-slate-300 hover:shadow-sm"
          : "border-slate-200/70 bg-slate-50/50 opacity-60"
      }`}
    >
      <div
        onClick={() => setIsEditing(true)}
        className="flex items-center justify-between p-3.5 cursor-pointer"
      >
        {/* Left: Drag handle + Title & Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <div
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              className="cursor-grab text-slate-300 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="size-4" />
            </div>
            <div
              className="text-slate-300 p-1"
            >
              <MoreVertical className="size-4" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold truncate ${isVisible ? "text-slate-800" : "text-slate-500 line-through"}`}>
                {title}
              </span>
              {!isVisible && (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded">
                  Hidden
                </span>
              )}
            </div>

            {(subtitle || dateRange || location) && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {[subtitle, dateRange, location].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Visibility toggle button */}
          <button
            type="button"
            onClick={handleToggleVisibility}
            className={`p-1.5 rounded-lg border transition-colors ${
              isVisible
                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent hover:border-slate-200"
                : "text-amber-600 bg-amber-50 border-amber-200"
            }`}
            title={isVisible ? "Visible in resume (Click to hide)" : "Hidden from resume (Click to show)"}
          >
            {isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          </button>

          {/* Edit Entry button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
            title="Edit entry"
          >
            <Edit3 className="size-3.5" />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-3 bg-red-50 border-t border-red-100 rounded-b-xl flex items-center justify-between text-xs animate-in fade-in"
        >
          <span className="text-red-800 font-medium">Remove this entry from resume?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2.5 py-1 font-medium bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-2.5 py-1 font-medium bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionEntry;
