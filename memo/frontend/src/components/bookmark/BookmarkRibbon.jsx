/**
 * BookmarkRibbon — Custom Vector Ribbon Bookmark Control.
 * Visual geometry:
 * - Vertical ribbon with rectangular upper section
 * - V-notched bottom cutout
 * - Folded/overlapping top-right corner
 * States:
 * - Normal: subtle outline/mostly transparent against the paper
 * - Hover: theme-colored border & soft teal tint (#12b5b0)
 * - Active: filled with Memo brand accent (#17375f) with crisp contrast
 */
import React from "react";

export default function BookmarkRibbon({
  active = false,
  onToggle,
  pageIndex = 1,
  className = "",
}) {
  return (
    <button
      type="button"
      role="button"
      aria-label={active ? `Remove bookmark for Page ${pageIndex}` : `Bookmark Page ${pageIndex}`}
      aria-pressed={active}
      title={active ? `Bookmarked (Page ${pageIndex}) - Click to remove` : `Bookmark Page ${pageIndex}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onToggle) onToggle();
      }}
      className={`group relative flex flex-col items-center justify-start select-none transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-t-sm ${className}`}
      style={{
        width: "32px",
        height: "56px",
      }}
    >
      <svg
        viewBox="0 0 32 56"
        className="w-full h-full drop-shadow-sm transition-all duration-200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Ribbon Body with V-shaped bottom notch: (0,0) -> (26,0) -> (32,6) -> (32,48) -> (16,38) -> (0,48) -> (0,0) */}
        <path
          d="M0 0 H25 L32 7 V54 L16 43 L0 54 Z"
          className={`transition-colors duration-200 ${
            active
              ? "fill-[#17375f] stroke-[#17375f]"
              : "fill-white/80 stroke-slate-300 group-hover:fill-[#12b5b0]/15 group-hover:stroke-[#12b5b0]"
          }`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Small folded/overlapping top-right triangle: (25,0) -> (32,7) -> (25,7) -> Z */}
        <path
          d="M25 0 L32 7 H25 Z"
          className={`transition-colors duration-200 ${
            active
              ? "fill-[#0f243e] stroke-[#0f243e]"
              : "fill-slate-200 stroke-slate-300 group-hover:fill-[#12b5b0]/40 group-hover:stroke-[#12b5b0]"
          }`}
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Inner subtle bookmark symbol / indicator */}
        <path
          d="M11 14 H21 V30 L16 26 L11 30 Z"
          className={`transition-colors duration-200 ${
            active
              ? "fill-white/90 stroke-white/90"
              : "fill-transparent stroke-slate-400/80 group-hover:stroke-[#12b5b0]"
          }`}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
