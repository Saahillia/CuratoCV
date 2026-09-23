import React, { useState, useRef, useEffect } from "react";
import {
  MoreVerticalIcon,
  PencilIcon,
  EyeIcon,
  CopyIcon,
  Share2Icon,
  DownloadIcon,
  Trash2Icon,
  FileTextIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ResumePreview from "./ResumePreview";

const ResumeCardPreview = ({
  resume,
  onEditTitle,
  onDelete,
  onDuplicate,
  onShare,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive canonical shape so ResumePreview can render real content
  const template = resume.design?.template || resume.template || "classic";
  const accentColor = resume.design?.colors?.accent || resume.accentColor || "#17375F";

  // Normalize into the shape ResumePreview.normalizePreviewData() expects
  const previewData = {
    ...resume,
    personalInfo: resume.personalInfo || resume.personal_info || {},
    sections: Array.isArray(resume.sections) ? resume.sections : [],
  };

  const resumeId = resume._id || resume.id;

  const updatedDate = resume.updatedAt
    ? new Date(resume.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Recently";

  // Count non-empty sections for badge
  const nonEmptySections = (resume.sections || []).filter(
    (s) => s.visible !== false && (s.entries || []).length > 0
  ).length;

  return (
    <div className={`group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#17375F]/30 hover:shadow-xl ${menuOpen ? "z-30" : "z-10"}`}>
      {/* Miniature Live Resume Preview */}
      <div
        onClick={() => navigate(`/app/resumes/${resumeId}/edit`)}
        className="relative h-56 w-full cursor-pointer overflow-hidden rounded-t-2xl border-b border-slate-100 bg-slate-50"
      >
        <div className="absolute left-1/2 top-2 w-[600px] -translate-x-1/2 origin-top scale-[0.31] pointer-events-none select-none rounded shadow-md bg-white overflow-hidden">
          <ResumePreview
            data={previewData}
            template={template}
            accentColor={accentColor}
          />
        </div>

        {/* Hover overlay with edit hint */}
        <div className="absolute inset-0 bg-[#17375F]/0 transition-colors duration-200 group-hover:bg-[#17375F]/5 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-[#17375F] text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm backdrop-blur">
            Edit Resume
          </span>
        </div>
      </div>

      {/* Card footer: title + 3-dot menu */}
      <div className="flex items-center justify-between p-3.5 bg-white rounded-b-2xl">
        <div className="min-w-0 flex-1 pr-2">
          <h3
            onClick={() => navigate(`/app/resumes/${resumeId}/edit`)}
            className="truncate text-sm font-semibold text-slate-800 hover:text-[#17375F] cursor-pointer"
            title={resume.title}
          >
            {resume.title || "Untitled Resume"}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span>Edited {updatedDate}</span>
            <span>·</span>
            <span>{template.charAt(0).toUpperCase() + template.slice(1)}</span>
            {nonEmptySections > 0 && (
              <>
                <span>·</span>
                <span className="text-blue-600 font-medium">{nonEmptySections} section{nonEmptySections !== 1 ? "s" : ""}</span>
              </>
            )}
          </p>
        </div>

        {/* 3-Dot Menu Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Resume options"
          >
            <MoreVerticalIcon className="size-4" />
          </button>

          {/* Dropdown — opens upward */}
          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 z-50 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  navigate(`/app/resumes/${resumeId}/edit`);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F]"
              >
                <PencilIcon className="size-3.5 text-slate-400" />
                Edit
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  navigate(`/app/resumes/${resumeId}/preview`);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F]"
              >
                <EyeIcon className="size-3.5 text-slate-400" />
                Preview
              </button>

              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDuplicate(resumeId);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F]"
                >
                  <CopyIcon className="size-3.5 text-slate-400" />
                  Duplicate
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEditTitle(resume);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F]"
              >
                <FileTextIcon className="size-3.5 text-slate-400" />
                Rename
              </button>

              {onShare && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onShare(resume);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F]"
                >
                  <Share2Icon className="size-3.5 text-slate-400" />
                  Share
                </button>
              )}

              <div className="my-1 h-px bg-slate-100" />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(resumeId);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2Icon className="size-3.5 text-red-500" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeCardPreview;