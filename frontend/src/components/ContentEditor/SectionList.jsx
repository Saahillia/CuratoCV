import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import SortableEntry from "../Forms/SortableEntry";
import SectionCard from "./SectionCard";
import SectionRenderer from "./SectionRenderer";
import { Plus } from "lucide-react";
import AddContent from "./AddContent";
import { createClientId, normalizeSectionOrder } from "../../utils/resume";

const SectionList = ({
    sections = [],
    onChange,
    onReorderSections,
    onDeleteSection,
    onEditEntry,    // (sectionId, entryId) => void
    onAddEntry,     // (sectionId) => void
    expandedSections,
}) => {
    const [addContentOpen, setAddContentOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState(() => new Set());

    useEffect(() => {
        setExpandedIds((previous) => {
            const currentIds = new Set(
                sections.map((section) => section._id || section.order),
            );
            const next = new Set(
                [...previous].filter((id) => currentIds.has(id)),
            );
            return next;
        });
    }, [sections]);

    const existingTypes = sections.map((s) => s.type);

    const toggleExpanded = (sectionId) => {
        setExpandedIds((prev) => {
            const isExpanded = prev.has(sectionId);
            const next = new Set();
            if (!isExpanded) {
                next.add(sectionId);
            }
            return next;
        });
    };

    const addSection = (type, title) => {
        const newId = createClientId("sec");
        const newSection = {
            _id: newId,
            type,
            title,
            order: sections.length,
            visible: true,
            customization: {},
            entries: [],
        };
        setExpandedIds((prev) => new Set([...prev, newId]));
        onChange(normalizeSectionOrder([...sections, newSection]));
    };

    const handleTitleChange = (sectionId, newTitle) => {
        const newSections = sections.map((section) =>
            String(section._id) === String(sectionId)
                ? { ...section, title: newTitle }
                : section,
        );
        onChange(newSections);
    };

    const handleVisibilityToggle = (sectionId) => {
        const newSections = sections.map((section) =>
            String(section._id) === String(sectionId)
                ? {
                      ...section,
                      visible: section.visible === false ? true : false,
                  }
                : section,
        );
        onChange(newSections);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sections.findIndex(
            (s) => String(s._id) === String(active.id),
        );
        const newIndex = sections.findIndex(
            (s) => String(s._id) === String(over.id),
        );
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(sections, oldIndex, newIndex);
        const withUpdatedOrder = normalizeSectionOrder(reordered);
        if (onReorderSections) onReorderSections(withUpdatedOrder);
        onChange(withUpdatedOrder);
    };

    const handleSectionChange = (sectionId, newEntries) => {
        const newSections = sections.map((section) =>
            String(section._id) === String(sectionId)
                ? { ...section, entries: newEntries }
                : section,
        );
        onChange(newSections);
    };

    const handleEditEntry = (sectionId, entryId) => {
        if (onEditEntry) {
            onEditEntry(sectionId, entryId);
        }
    };

    const handleAddEntry = (sectionId) => {
        if (onAddEntry) {
            onAddEntry(sectionId);
        }
    };

    return (
        <div>
            <div className="mb-3 px-1">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Resume content
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                        Sections
                    </h3>
                </div>
            </div>

            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sections.map((s) => s._id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {sections.map((section) => (
                            <SortableEntry key={section._id} id={section._id}>
                                <SectionCard
                                    section={section}
                                    expanded={expandedIds.has(section._id)}
                                    onToggle={() => toggleExpanded(section._id)}
                                    onDelete={() =>
                                        onDeleteSection(section._id)
                                    }
                                    onTitleChange={(newTitle) =>
                                        handleTitleChange(section._id, newTitle)
                                    }
                                    onVisibilityToggle={() =>
                                        handleVisibilityToggle(section._id)
                                    }
                                    onEditEntry={(entryId) => handleEditEntry(section._id, entryId)}
                                    onAddEntry={() => handleAddEntry(section._id)}
                                >
                                    <SectionRenderer
                                        section={section}
                                        onChange={(newEntries) =>
                                            handleSectionChange(section._id, newEntries)
                                        }
                                        onEditEntry={onEditEntry}
                                        onAddEntry={onAddEntry}
                                    />
                                </SectionCard>
                            </SortableEntry>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="mt-5 border-t border-slate-200 pt-4 pb-2">
                <button
                    type="button"
                    onClick={() => setAddContentOpen(true)}
                    className="mx-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#17375F] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-slate-300 transition-transform hover:-translate-y-0.5 hover:bg-[#24527A] hover:shadow-lg"
                    aria-label="Add content section"
                >
                    <Plus className="size-5" />
                    Add Content
                </button>
            </div>

            <AddContent
                open={addContentOpen}
                onClose={() => setAddContentOpen(false)}
                onAdd={addSection}
                existingTypes={existingTypes}
            />
        </div>
    );
};

export default SectionList;