import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Custom grip icon: exactly 6 dots (2 columns × 3 rows)
 * with a visible gap between the top 3 and bottom 3.
 */
/**
 * Custom grip icon: 6 dots structured as two compact trios
 * with a clean gap between them.
 */
const SplitGripIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 10 18"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Top group: 3 dots in 2 columns (left-top, right-top, left-bottom) */}
    <circle cx="3" cy="3" r="1.2" />
    <circle cx="7" cy="3" r="1.2" />
    <circle cx="3" cy="7" r="1.2" />

    {/* Bottom group: 3 dots — compact trio, slightly below top group */}
    <circle cx="7" cy="11" r="1.2" />
    <circle cx="3" cy="11" r="1.2" />
    <circle cx="7" cy="15" r="1.2" />
  </svg>
);

const SortableEntry = ({ id, index, children }) => {
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
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-grab touch-none rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label="Drag to reorder"
      >
        <SplitGripIcon className="h-5 w-auto" />
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
};

export default SortableEntry;
