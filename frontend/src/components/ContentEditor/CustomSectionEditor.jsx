import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClientId, normalizeEntryOrder } from "../../utils/resume";
import EntryEditor from "./EntryEditor";

const CustomSectionEditor = ({ section = {}, onChange, onEditEntry, onAddEntry }) => {
    const existingEntries = section.entries || [];
    const [editingEntry, setEditingEntry] = React.useState(null);

    const handleEditEntry = React.useCallback((entryId) => {
        if (onEditEntry) {
            // Pass as positional args to match openEntryEditor's flexible signature
            onEditEntry(section._id, entryId);
        } else {
            setEditingEntry(entryId);
        }
    }, [onEditEntry, section._id]);

    const handleAddEntry = React.useCallback(() => {
        if (onAddEntry) {
            onAddEntry();
        } else {
            const newEntry = {
                _id: createClientId("entry"),
                order: existingEntries.length,
                visible: true,
                customization: {},
                data: {
                    title: "",
                    subtitle: "",
                    date: "",
                    description: "",
                },
            };
            onChange(normalizeEntryOrder([...existingEntries, newEntry]));
            setEditingEntry(newEntry._id);
        }
    }, [onAddEntry, onChange, existingEntries]);

    const handleSaveEntry = React.useCallback((updatedEntryEnvelope) => {
        let newEntries;
        if (updatedEntryEnvelope._id && !existingEntries.some(e => String(e._id) === String(updatedEntryEnvelope._id))) {
            // New entry
            newEntries = [...(existingEntries || []), updatedEntryEnvelope];
        } else {
            // Update existing
            newEntries = (existingEntries || []).map((e) =>
                String(e._id) === String(updatedEntryEnvelope._id) ? updatedEntryEnvelope : e
            );
        }
        onChange(normalizeEntryOrder(newEntries));
        setEditingEntry(null);
    }, [existingEntries, onChange]);

    const handleDeleteEntry = React.useCallback((entryId) => {
        onChange(
            normalizeEntryOrder(
                existingEntries.filter(
                    (entry) => String(entry._id) !== String(entryId),
                ),
            ),
        );
        setEditingEntry(null);
    }, [existingEntries, onChange]);

    const handleToggleVisibility = React.useCallback((entryId, isVisible) => {
        onChange(
            existingEntries.map((entry) =>
                String(entry._id) === String(entryId)
                    ? { ...entry, visible: isVisible }
                    : entry,
            ),
        );
    }, [existingEntries, onChange]);

    const showInlineEditor = editingEntry && !onEditEntry;
    const editingEntryData = existingEntries.find(e => String(e._id) === String(editingEntry));

    return (
        <div className="space-y-4">
            {existingEntries.map((entry, index) => {
                const item = entry.data || entry;
                const isOpen = showInlineEditor && String(editingEntry) === String(entry._id);
                return (
                    <div key={entry._id || index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                            <h4
                                onClick={() => handleEditEntry(entry._id)}
                                className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-blue-600"
                            >
                                Item #{index + 1}: {item.title || "Untitled"}
                            </h4>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleVisibilityToggle(entry._id)}
                                    className="p-1 text-slate-400 hover:text-slate-700"
                                    title={entry.visible === false ? "Show item" : "Hide item"}
                                >
                                    {entry.visible === false ? (
                                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteEntry(entry._id)}
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    title="Remove item"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>

                        {showInlineEditor && isOpen && (
                            <EntryEditor
                                entry={editingEntryData}
                                sectionType="custom"
                                onSave={handleSaveEntry}
                                onCancel={() => setEditingEntry(null)}
                                onDelete={() => handleDeleteEntry(editingEntryData._id)}
                                onToggleVisibility={(isVisible) => handleToggleVisibility(editingEntryData._id, isVisible)}
                            />
                        )}

                        {!showInlineEditor && (
                            <>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={item.title || ""}
                                        onChange={(e) => onChange(existingEntries.map((en, i) => i === index ? { ...en, data: { ...en.data, title: e.target.value } } : en))}
                                        placeholder="Title / Activity (e.g. Volunteer Leader)"
                                        className="px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={item.subtitle || ""}
                                        onChange={(e) => onChange(existingEntries.map((en, i) => i === index ? { ...en, data: { ...en.data, subtitle: e.target.value } } : en))}
                                        placeholder="Subtitle / Organization (e.g. Red Cross)"
                                        className="px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        value={item.date || ""}
                                        onChange={(e) => onChange(existingEntries.map((en, i) => i === index ? { ...en, data: { ...en.data, date: e.target.value } } : en))}
                                        placeholder="Date / Duration (e.g. Jan 2023 - Present)"
                                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <textarea
                                        value={item.description || ""}
                                        onChange={(e) => onChange(existingEntries.map((en, i) => i === index ? { ...en, data: { ...en.data, description: e.target.value } } : en))}
                                        rows={3}
                                        placeholder="Description or key points..."
                                        className="w-full p-3 border rounded-lg text-sm focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                );
            })}

            <button
                type="button"
                onClick={handleAddEntry}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
                <Plus className="size-4" /> Add Item
            </button>
        </div>
    );
};

export default CustomSectionEditor;