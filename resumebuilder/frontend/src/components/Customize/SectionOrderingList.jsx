import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

/**
 * Sortable section item.
 */
const SortableSectionItem = ({ id, section }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white border ${
        isDragging ? "border-blue-500 shadow-md ring-1 ring-blue-500" : "border-slate-200"
      } rounded-lg p-2.5 mb-2 relative transition-colors`}
    >
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${section.title || section.type}`}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1 min-w-0 flex items-center justify-between pointer-events-none">
        <span className="text-sm font-medium text-slate-700 truncate">
          {section.title || section.type}
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase ml-2">
          {section.type}
        </span>
      </div>
    </div>
  );
};

const SectionOrderingList = ({ sections = [], onChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter visible/active sections if needed, or allow reordering all?
  // We should reorder all sections that might appear. We'll sort them by their current order first.
  const activeSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeSections.findIndex((s) => s._id === active.id);
      const newIndex = activeSections.findIndex((s) => s._id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const sortedItems = arrayMove(activeSections, oldIndex, newIndex);
        
        // Re-assign strict order sequentially based on visual drag-and-drop result
        const updatedSections = sortedItems.map((section, index) => ({
          ...section,
          order: index,
        }));
        
        // Merge mutated order values back with any potentially missing sections (if we filtered them)
        // Since we order ALL sections, we can just replace.
        onChange(updatedSections);
      }
    }
  };

  if (activeSections.length === 0) {
    return (
      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
        No sections to reorder.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Section Order</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Drag sections to reorder them on your resume.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeSections.map((s) => s._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
            {activeSections.map((section) => (
              <SortableSectionItem
                key={section._id}
                id={section._id}
                section={section}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SectionOrderingList;
