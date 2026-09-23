import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    SlidersHorizontal,
    Sparkles,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    Eye,
    EyeOff,
    Download,
    MoreVertical,
    Check,
    Loader2,
    AlertCircle,
    Share2,
    Mail,
    Plus,
    Copy,
    Pencil,
    Trash2,
} from "lucide-react";
import resumeService from "../../services/resumeService";
import toast from "react-hot-toast";

const ResumeBuilderHeader = ({
    resumeData,
    builderTab,
    setBuilderTab,
    isSaving,
    lastSavedAt,
    saveError,
    forceSave,
    isUpdatingVisibility,
    toggleResumeVisibility,
    onShare,
    onDownload,
    isGeneratingPdf,
    onDuplicateResume,
    onDeleteResume,
    onEditTitle,
}) => {
    const navigate = useNavigate();
    const [isResumeMenuOpen, setIsResumeMenuOpen] = useState(false);
    const [activeActionMenuId, setActiveActionMenuId] = useState(null);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [resumesList, setResumesList] = useState([]);
    const [isFetchingResumes, setIsFetchingResumes] = useState(false);
    const [editingTitleId, setEditingTitleId] = useState(null);
    const [editingTitleValue, setEditingTitleValue] = useState("");

    const resumeMenuRef = useRef(null);
    const moreMenuRef = useRef(null);
    const actionMenuRef = useRef(null);

    // Fetch user resumes when resume menu is opened
    useEffect(() => {
        if (isResumeMenuOpen) {
            fetchResumes();
        }
    }, [isResumeMenuOpen]);

    const fetchResumes = async () => {
        try {
            setIsFetchingResumes(true);
            const response = await resumeService.getUserResumes();
            // Backend returns: { success: true, data: { resumes: [...], count: N } }
            // Service returns axios response.data = the full JSON above.
            let resumes = [];
            if (Array.isArray(response)) {
                resumes = response;
            } else if (response && typeof response === "object") {
                if (Array.isArray(response.data?.resumes)) {
                    resumes = response.data.resumes;
                } else if (Array.isArray(response.resumes)) {
                    resumes = response.resumes;
                } else if (Array.isArray(response.data)) {
                    resumes = response.data;
                }
            }
            console.log("[Dropdown] fetched resumes:", resumes.length, "| raw response keys:", response ? Object.keys(response) : null);
            setResumesList(Array.isArray(resumes) ? resumes : []);
        } catch (error) {
            console.error("Failed to fetch resumes for switcher:", error);
            setResumesList([]);
        } finally {
            setIsFetchingResumes(false);
        }
    };

    // Outside click & Escape handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                resumeMenuRef.current &&
                !resumeMenuRef.current.contains(event.target)
            ) {
                setIsResumeMenuOpen(false);
                setActiveActionMenuId(null);
            } else {
                // Click inside dropdown but outside any open action submenu -> close submenu
                if (
                    activeActionMenuId &&
                    actionMenuRef.current &&
                    !actionMenuRef.current.contains(event.target) &&
                    !event.target.closest('[data-action-trigger]')
                ) {
                    setActiveActionMenuId(null);
                }
            }

            if (
                moreMenuRef.current &&
                !moreMenuRef.current.contains(event.target)
            ) {
                setIsMoreMenuOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsResumeMenuOpen(false);
                setActiveActionMenuId(null);
                setIsMoreMenuOpen(false);
                setEditingTitleId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isResumeMenuOpen, activeActionMenuId, isMoreMenuOpen]);

    const handleDuplicate = async (e, resume) => {
        e.stopPropagation();
        setActiveActionMenuId(null);
        if (onDuplicateResume) {
            await onDuplicateResume(resume);
            fetchResumes();
        } else {
            try {
                await resumeService.createResume({
                    title: `${resume.title || "Untitled"} (Copy)`,
                    ...resume,
                    _id: undefined,
                });
                toast.success("Resume duplicated successfully!");
                fetchResumes();
            } catch (err) {
                toast.error("Failed to duplicate resume");
            }
        }
    };

    const handleDelete = async (e, resumeId) => {
        e.stopPropagation();
        setActiveActionMenuId(null);
        if (!window.confirm("Are you sure you want to delete this resume?")) return;

        if (onDeleteResume) {
            await onDeleteResume(resumeId);
            fetchResumes();
        } else {
            try {
                await resumeService.deleteResume(resumeId);
                toast.success("Resume deleted");
                fetchResumes();
                if (resumeId === currentResumeId) {
                    navigate("/app/resumes");
                }
            } catch (err) {
                toast.error("Failed to delete resume");
            }
        }
    };

    const handleStartEditTitle = (e, resume) => {
        e.stopPropagation();
        setActiveActionMenuId(null);
        setEditingTitleId(resume._id);
        setEditingTitleValue(resume.title || "");
    };

    const handleSaveTitle = async (e, resumeId) => {
        e.stopPropagation();
        if (!editingTitleValue.trim()) {
            setEditingTitleId(null);
            return;
        }
        if (onEditTitle) {
            await onEditTitle(resumeId, editingTitleValue);
        } else {
            try {
                await resumeService.updateResume(resumeId, {
                    resumeData: JSON.stringify({ title: editingTitleValue }),
                });
                toast.success("Title updated");
            } catch (err) {
                toast.error("Failed to update title");
            }
        }
        setEditingTitleId(null);
        fetchResumes();
    };

    const tabs = [
        { id: "content", label: "Content", icon: FileText },
        { id: "customize", label: "Customize", icon: SlidersHorizontal },
        { id: "ai_tools", label: "AI Tools", icon: Sparkles },
    ];

    const currentResumeId = resumeData?._id;

    return (
        <header className="shrink-0 sticky top-0 sm:top-3 z-40 sm:mx-6 print:hidden">
            <div className="bg-white border-b sm:border border-[#D9E7F2] sm:shadow-sm sm:rounded-2xl px-4 h-[64px] sm:h-[72px] flex items-center justify-between">

                {/* ================= LEFT SIDE: Dashboard & Tabs + Title Switcher ================= */}
                <div className="flex items-center gap-2 sm:gap-6 w-full max-w-full pr-4">
                    {/* Back to Dashboard */}
                    <Link
                        to="/app/resumes"
                        className="shrink-0 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-[14px] font-medium"
                        title="Back to Dashboard"
                    >
                        <ChevronLeft className="size-4" />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                    </Link>

                    <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

                    {/* Resume Selector Dropdown */}
                    <div className="relative shrink-0" ref={resumeMenuRef}>
                        <button
                            type="button"
                            aria-expanded={isResumeMenuOpen}
                            aria-haspopup="menu"
                            onClick={() => setIsResumeMenuOpen(!isResumeMenuOpen)}
                            className={`flex items-center justify-between gap-3 min-w-[160px] max-w-[240px] h-[44px] sm:h-[50px] px-4 rounded-[10px] border transition-all text-left font-medium ${
                                isResumeMenuOpen
                                    ? "bg-[#EAF3FB] border-[#90C2E7]"
                                    : "bg-[#F7FAFC] border-[#D9E7F2] hover:bg-[#EDF5FB] hover:border-[#90C2E7]"
                            }`}
                            title={resumeData?.title || "Untitled Resume"}
                        >
                            <span className="font-semibold text-[#102A43] text-[14px] sm:text-[15px] truncate">
                                {resumeData?.title || "Untitled Resume"}
                            </span>
                            {isResumeMenuOpen ? (
                                <ChevronUp className="size-4 text-[#102A43] shrink-0" />
                            ) : (
                                <ChevronDown className="size-4 text-[#102A43] shrink-0" />
                            )}
                        </button>

                        {/* Floating Card Menu */}
                        {isResumeMenuOpen && (
                            <div
                                role="menu"
                                className="fixed top-[80px] left-4 sm:left-[24px] w-[calc(100vw-32px)] sm:w-[380px] md:w-[420px] max-w-[420px] bg-white border border-[#D9E7F2] rounded-[18px] shadow-[0_12px_35px_rgba(16,42,67,0.12)] py-0 z-[100] overflow-hidden"
                            >
                                {/* Dropdown Header */}
                                <div className="px-5 py-4 border-b border-[#E6EEF5]">
                                    <h3 className="text-[18px] sm:text-[20px] font-bold text-[#102A43]">
                                        My Resumes
                                    </h3>
                                </div>

                                {/* Resumes List */}
                                <div className="divide-y divide-slate-100">
                                    {isFetchingResumes ? (
                                        <div className="p-6 text-center flex justify-center items-center">
                                            <Loader2 className="size-5 animate-spin text-[#17375F]" />
                                        </div>
                                    ) : resumesList.length > 0 ? (
                                        resumesList.map((r) => {
                                            const isCurrent = r._id === currentResumeId;
                                            const isEditing = editingTitleId === r._id;

                                            return (
                                                <div
                                                    key={r._id}
                                                    onClick={() => {
                                                        if (isEditing) return;
                                                        setIsResumeMenuOpen(false);
                                                        if (!isCurrent) {
                                                            navigate(`/app/resumes/${r._id}/edit`, { replace: true });
                                                        }
                                                    }}
                                                    className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors cursor-pointer group ${
                                                        isCurrent
                                                            ? "bg-[#EAF3FB]/60"
                                                            : "hover:bg-[#F7FAFC]"
                                                    }`}
                                                >
                                                    {/* Resume Title or Inline Edit Input */}
                                                    <div className="flex-1 min-w-0 pr-3">
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="text"
                                                                    value={editingTitleValue}
                                                                    onChange={(e) => setEditingTitleValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") handleSaveTitle(e, r._id);
                                                                        if (e.key === "Escape") setEditingTitleId(null);
                                                                    }}
                                                                    autoFocus
                                                                    className="w-full px-2 py-1 text-sm border border-[#90C2E7] rounded-md outline-none text-[#102A43]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleSaveTitle(e, r._id)}
                                                                    className="px-2.5 py-1 text-xs font-semibold bg-[#17375F] text-white rounded-md"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className={`block text-[14px] sm:text-[15px] truncate ${
                                                                    isCurrent
                                                                        ? "font-bold text-[#17375F]"
                                                                        : "font-medium text-[#102A43]"
                                                                }`}
                                                                title={r.title}
                                                            >
                                                                {r.title || "Untitled Resume"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Actions: Duplicate & Three-Dot Menu */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {/* Duplicate Button */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDuplicate(e, r)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#486581] bg-white border border-[#B8CBE0] rounded-[9px] hover:bg-[#F7FAFC] hover:border-[#90C2E7] hover:text-[#17375F] transition-all shadow-xs"
                                                            title="Duplicate resume"
                                                        >
                                                            <Copy className="size-3.5" />
                                                            <span className="hidden sm:inline">Duplicate</span>
                                                        </button>

                                                        {/* Three-Dot Actions Menu Trigger */}
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                data-action-trigger={r._id}
                                                                aria-label="Resume actions"
                                                                aria-expanded={activeActionMenuId === r._id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveActionMenuId(
                                                                        activeActionMenuId === r._id ? null : r._id
                                                                    );
                                                                }}
                                                                className="p-1.5 text-[#486581] bg-[#F7FAFC] hover:bg-white border border-[#D9E7F2] hover:border-[#90C2E7] rounded-[9px] hover:text-[#17375F] transition-all shadow-xs"
                                                            >
                                                                <MoreVertical className="size-3.5" />
                                                            </button>

                                                            {/* Three-Dot Action Options */}
                                                            {activeActionMenuId === r._id && (
                                                                <div
                                                                    ref={actionMenuRef}
                                                                    className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#D9E7F2] rounded-xl shadow-lg py-1 z-50"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleStartEditTitle(e, r)}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#102A43] hover:bg-[#F7FAFC] transition-colors"
                                                                    >
                                                                        <Pencil className="size-3.5 text-slate-500" />
                                                                        Edit title
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleDelete(e, r._id)}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#C53030] hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <Trash2 className="size-3.5 text-[#C53030]" />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="px-5 py-4 text-sm text-slate-500 text-center">
                                            No resumes found.
                                        </div>
                                    )}
                                </div>

                                {/* Add Resume Primary Button */}
                                <div className="p-3 border-t border-[#E6EEF5] bg-[#F7FAFC]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResumeMenuOpen(false);
                                            navigate("/app/resumes");
                                        }}
                                        className="w-full py-2.5 px-4 bg-[#17375F] hover:bg-[#003559] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Plus className="size-4" />
                                        Add Resume
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

                    {/* Editor Tabs Group */}
                    <div className="flex items-center gap-1 shrink-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = builderTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setBuilderTab(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all ${
                                        isActive
                                            ? "bg-[#EAF3FB] text-[#17375F] font-semibold"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                                >
                                    <Icon className={`size-4 ${isActive ? 'text-[#17375F]' : ''}`} />
                                    <span className="hidden md:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ================= RIGHT SIDE: Actions & Status ================= */}
                <div className="flex items-center gap-3 shrink-0 ml-auto">

                    {/* Save Status Indicator */}
                    <div className="hidden lg:flex items-center gap-2 text-xs mr-2">
                        {isSaving ? (
                            <span className="flex items-center gap-1.5 text-blue-600 font-medium whitespace-nowrap">
                                <Loader2 className="size-3.5 animate-spin" />
                                Saving...
                            </span>
                        ) : saveError ? (
                            <span className="flex items-center gap-1 text-red-500 font-medium whitespace-nowrap">
                                <AlertCircle className="size-3.5" />
                                Save Failed
                            </span>
                        ) : lastSavedAt ? (
                            <span className="flex items-center gap-1 text-slate-500 whitespace-nowrap">
                                <Check className="size-3.5 text-emerald-500 font-bold" />
                                Saved
                            </span>
                        ) : null}
                    </div>

                    <div className="h-5 w-px bg-slate-200 hidden lg:block" />

                    {/* Visibility Settings Bubble (Public / Private) */}
                    <button
                        type="button"
                        disabled={isUpdatingVisibility}
                        onClick={toggleResumeVisibility}
                        className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                            resumeData?.public
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                        {isUpdatingVisibility ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : resumeData?.public ? (
                            <>
                                <Eye className="size-3.5 text-emerald-600" />
                                Public
                            </>
                        ) : (
                            <>
                                <EyeOff className="size-3.5 text-slate-500" />
                                Private
                            </>
                        )}
                    </button>

                    {/* Download Button */}
                    <button
                        type="button"
                        onClick={onDownload}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#17375F] text-white text-[13px] sm:text-[14px] font-semibold rounded-lg hover:bg-[#003559] transition-colors shadow-sm whitespace-nowrap disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isGeneratingPdf ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        <span className="hidden sm:inline">{isGeneratingPdf ? "Generating..." : "Download"}</span>
                    </button>

                    {/* More (⋮) Menu Dropdown */}
                    <div className="relative" ref={moreMenuRef}>
                        <button
                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="More options"
                        >
                            <MoreVertical className="size-5" />
                        </button>

                        {isMoreMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#D9E7F2] rounded-xl shadow-lg py-1.5 z-50">
                                {/* Mobile-only visibility toggle fallback inside More menu */}
                                <div className="md:hidden px-1 pb-1 mb-1 border-b border-[#E6EEF5]">
                                    <button
                                        onClick={() => {
                                            toggleResumeVisibility();
                                            setIsMoreMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                                    >
                                        {resumeData?.public ? (
                                            <>
                                                <Eye className="size-4 text-emerald-600" />
                                                Make Private
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff className="size-4 text-slate-500" />
                                                Make Public
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="px-1">
                                    <button
                                        onClick={() => {
                                            onShare();
                                            setIsMoreMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                                    >
                                        <Share2 className="size-4 text-blue-600" />
                                        Get Shareable Link
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.success("Download started.");
                                            onDownload();
                                            setIsMoreMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                                    >
                                        <Mail className="size-4 text-slate-500" />
                                        Email Download
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
};

export default ResumeBuilderHeader;