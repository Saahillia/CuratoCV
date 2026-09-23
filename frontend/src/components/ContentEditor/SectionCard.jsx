import {
    ChevronDown,
    ChevronRight,
    Trash2,
    Edit2,
    Check,
    Eye,
    EyeOff,
    MoreVertical,
    Puzzle,
    Brain,
    BriefcaseBusiness,
    Folder,
    GraduationCap,
    Award,
    Languages,
    Heart,
    Building2,
    BookOpen,
    Users,
    FileText,
} from "lucide-react";
import { useState, useEffect } from "react";

const SectionCard = ({
    section,
    expanded = false,
    onToggle,
    onDelete,
    onTitleChange,
    onVisibilityToggle,
    children,
    dragHandleProps,
}) => {
    const [isOpen, setIsOpen] = useState(expanded);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(section?.title || "");

    useEffect(() => {
        setIsOpen(expanded);
    }, [expanded]);

    useEffect(() => {
        setTitleInput(section?.title || "");
    }, [section?.title]);

    const handleToggle = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (onToggle) onToggle(nextState);
    };

    const saveTitle = () => {
        setIsEditingTitle(false);
        if (onTitleChange && titleInput.trim()) {
            onTitleChange(titleInput.trim());
        }
    };

    const definition = {
        summary: "Professional Summary",
        experience: "Experience",
        education: "Education",
        skills: "Skills",
        projects: "Projects",
        certificates: "Certificates",
        courses: "Courses",
        awards: "Awards",
        languages: "Languages",
        interests: "Interests",
        organisations: "Organisations",
        publications: "Publications",
        references: "References",
        declaration: "Declaration",
        custom: "Custom Section",
    };

    const defaultTitle =
        definition[section?.type] || section?.type || "Section";
    const displayTitle = section?.title || defaultTitle;
    const isVisible = section?.visible !== false;
    const SectionIcon = {
        summary: Puzzle,
        professional_summary: Puzzle,
        experience: BriefcaseBusiness,
        experiences: BriefcaseBusiness,
        education: GraduationCap,
        educations: GraduationCap,
        skills: Brain,
        projects: Folder,
        certificates: Award,
        courses: BookOpen,
        awards: Award,
        languages: Languages,
        interests: Heart,
        organisations: Building2,
        publications: BookOpen,
        references: Users,
        declaration: FileText,
        custom: FileText,
    }[section?.type] || FileText;

    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${
                !isVisible ? "opacity-60 bg-slate-50/80" : ""
            }`}
        >
            <div
                onClick={handleToggle}
                className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="shrink-0 text-[#17375F]">
                        {isOpen ? (
                            <ChevronDown className="size-5" />
                        ) : (
                            <ChevronRight className="size-5" />
                        )}
                    </div>
                    <SectionIcon className="size-5 shrink-0 text-[#17375F]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                        {isEditingTitle ? (
                            <div
                                className="flex items-center gap-2 max-w-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="text"
                                    value={titleInput}
                                    onChange={(e) =>
                                        setTitleInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") saveTitle();
                                        if (e.key === "Escape")
                                            setIsEditingTitle(false);
                                    }}
                                    className="px-2 py-1 text-sm font-semibold text-slate-800 border border-blue-400 rounded outline-none w-full"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={saveTitle}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                    <Check className="size-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h3
                                    className={`text-base font-bold truncate ${
                                        isVisible
                                            ? "text-slate-800"
                                            : "text-slate-500 line-through"
                                    }`}
                                >
                                    {displayTitle}
                                </h3>
                                {(section?.type === "custom" ||
                                    onTitleChange) && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditingTitle(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Edit section title"
                                    >
                                        <Edit2 className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {onVisibilityToggle && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onVisibilityToggle();
                            }}
                            className={`p-1.5 rounded-md transition-colors ${
                                isVisible
                                    ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                    : "text-amber-500 bg-amber-50 hover:bg-amber-100"
                            }`}
                            title={
                                isVisible
                                    ? "Hide section from resume"
                                    : "Show section in resume"
                            }
                            aria-label={
                                isVisible ? "Hide section" : "Show section"
                            }
                        >
                            {isVisible ? (
                                <Eye className="size-4" />
                            ) : (
                                <EyeOff className="size-4" />
                            )}
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete section"
                            aria-label="Delete section"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/45">
                    {children}
                </div>
            )}
        </div>
    );
};

export default SectionCard;
