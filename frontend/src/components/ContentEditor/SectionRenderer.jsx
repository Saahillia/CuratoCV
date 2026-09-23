import React from "react";
import EntryList from "./EntryList";
import { updateEntryData } from "../../utils/resume";
import { resumeSectionRegistry } from "../../config/resumeSectionRegistry";

const SectionRenderer = ({ section = {}, onChange, onEditEntry, onAddEntry }) => {
    const registryEntry = resumeSectionRegistry[section.type];
    const entries = Array.isArray(section.entries) ? section.entries : [];

    const handleEntryDataChange = (entryId, updatedData) => {
        const nextEntries = updateEntryData(entries, entryId, updatedData);
        onChange(nextEntries);
    };

    // 1. Summary/Declaration (Single-value sections)
    if (
        section.type === "summary" ||
        section.type === "professional_summary" ||
        section.type === "declaration"
    ) {
        return (
            <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">
                    {section.title || registryEntry?.label || "Content"}
                </h3>
                <textarea
                    value={section.entries?.[0]?.data?.description || ""}
                    onChange={(e) => {
                        const currentEntry = section.entries?.[0];
                        const updatedEntry = {
                            ...(currentEntry || {
                                _id: "sec-sum-0",
                                order: 0,
                                visible: true,
                                customization: {},
                            }),
                            data: {
                                ...(currentEntry?.data || {}),
                                description: e.target.value,
                            },
                        };
                        onChange([updatedEntry]);
                    }}
                    rows={4}
                    className="w-full p-3 px-4 border border-gray-300 rounded-lg text-sm focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Write content here..."
                />
            </div>
        );
    }

    // 2. Custom Section
    if (section.type === "custom") {
        const Editor = registryEntry.component;
        return (
            <Editor
                section={section}
                onChange={onChange}
                onEditEntry={(entryId) => onEditEntry(section._id, entryId)}
                onAddEntry={() => onAddEntry(section._id)}
            />
        );
    }

    // 3. Entry-based Sections
    if (registryEntry?.entryBased) {
        if (registryEntry.component) {
            const Component = registryEntry.component;
            return (
                <Component
                    entries={entries}
                    onChange={onChange}
                    onEditEntry={(entryId) => onEditEntry(section._id, entryId)}
                    onAddEntry={() => onAddEntry(section._id)}
                />
            );
        }

        const Editor = registryEntry.editor;
        return (
            <EntryList
                entries={entries}
                onChange={onChange}
                addLabel={`Add ${registryEntry.label}`}
                sectionLabel={registryEntry.label}
                defaultData={registryEntry.defaultEntry || {}}
                onEditEntry={(entryId) => onEditEntry(section._id, entryId)}
                onAddEntry={() => onAddEntry(section._id)}
                renderEntry={(entry) =>
                    Editor ? (
                        <Editor
                            data={entry.data || {}}
                            onChange={(updatedData) =>
                                handleEntryDataChange(entry._id, updatedData)
                            }
                        />
                    ) : (
                        <div className="text-xs text-slate-400 italic">
                            Simple field editor needed for {section.type}
                        </div>
                    )
                }
            />
        );
    }

    // 4. Fallback
    return (
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
            <p className="font-medium">Unsupported section</p>
            <p>This section type ({section.type}) is not currently editable.</p>
        </div>
    );
};

export default SectionRenderer;