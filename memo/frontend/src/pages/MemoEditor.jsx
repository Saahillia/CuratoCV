/**
 * Owns Memo's full page editor view with responsive layout, right sidebar tool switcher,
 * live page tracking, auto-scroll, and document text editing.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    ArrowUp,
    Bold,
    Check,
    Code,
    Copy,
    FileText,
    Folder,
    Heading1,
    Heading2,
    Italic,
    List,
    NotebookPen,
    Palette,
    Eraser,
    PenTool,
    RotateCcw,
    Save,
    Pencil,
    Trash2,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@curatocv/api-client";
import AccountMenu from "@curatocv/platform-frontend/components/common/AccountMenu";
import BrandLockup from "@curatocv/platform-frontend/components/common/BrandLockup";
import Button from "@curatocv/platform-frontend/components/common/Button";

const getErrorMessage = (error) =>
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

const MemoEditor = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const documentId = searchParams.get("id");

    const [document, setDocument] = useState(null);
    const [title, setTitle] = useState("Untitled Document");
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("Saved");
    const [error, setError] = useState("");

    // Right sidebar expanded tool tab: 'explorer' | 'editor' | 'drawing'
    const [activeTool, setActiveTool] = useState("editor");

    // Scroll & pagination tracking
    const editorScrollRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isPagesDropdownOpen, setIsPagesDropdownOpen] = useState(false);

    // Canvas/Drawing state
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState("#1e293b");
    const [penSize, setPenSize] = useState(3);
    const [eraserSize, setEraserSize] = useState(16);
    const [drawMode, setDrawMode] = useState("pen"); // 'pen' | 'eraser'

    // Click-outside to close pages dropdown
    useEffect(() => {
        if (!isPagesDropdownOpen) return;
        const onDocClick = (e) => {
            const el = e.target.closest("[data-pages-dropdown]");
            if (!el) setIsPagesDropdownOpen(false);
        };
        document.addEventListener("click", onDocClick, { passive: true });
        return () => document.removeEventListener("click", onDocClick);
    }, [isPagesDropdownOpen]);

    // Load note content
    useEffect(() => {
        if (!documentId) {
            setIsLoading(false);
            return;
        }

        const fetchNote = async () => {
            setIsLoading(true);
            setError("");
            try {
                const res = await api.get(`/notes/${documentId}`);
                const data = res.data?.data?.note;
                if (data) {
                    setDocument(data);
                    setTitle(data.title || "Untitled Document");
                    setContent(data.content || "");
                }
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setIsLoading(false);
            }
        };

        fetchNote();
    }, [documentId]);

    // Save handler
    const handleSave = async () => {
        if (!documentId) return;
        setIsSaving(true);
        setSaveStatus("Saving…");
        try {
            await api.put(`/notes/${documentId}`, { title, content });
            setSaveStatus("Saved");
        } catch (err) {
            setSaveStatus("Error saving");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate word and character count
    const stats = useMemo(() => {
        const text = content.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = content.length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        return { words, chars, readTime };
    }, [content]);

    // Scroll listener for page calculation and Back-to-Top
    const handleScroll = (e) => {
        const target = e.target;
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;

        setShowBackToTop(scrollTop > 150);

        // Estimate pages based on viewport height or text length (min 1 page)
        const computedTotalPages = Math.max(1, Math.ceil(scrollHeight / (clientHeight || 800)));
        const computedCurrentPage = Math.min(
            computedTotalPages,
            Math.max(1, Math.floor(scrollTop / (clientHeight || 800)) + 1)
        );

        setTotalPages(computedTotalPages);
        setCurrentPage(computedCurrentPage);
    };

    const scrollToTop = () => {
        if (editorScrollRef.current) {
            editorScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Text insertion formatting helpers
    const insertFormatting = (prefix, suffix = "") => {
        setContent((prev) => prev + `\n${prefix} ` + suffix);
        setSaveStatus("Unsaved changes");
    };

    // Page management helpers
    const handleAddPage = () => {
        setContent((prev) => prev + (prev.endsWith("\n") ? "" : "\n") + "\n--- Page Break ---\n\n");
        setSaveStatus("Unsaved changes");
    };

    const handleRemovePage = () => {
        setContent((prev) => {
            const breakMarker = "\n--- Page Break ---\n";
            const lastIndex = prev.lastIndexOf(breakMarker);
            if (lastIndex !== -1) {
                return prev.substring(0, lastIndex);
            }
            return prev;
        });
        setSaveStatus("Unsaved changes");
    };

    // Drawing Canvas handlers
    useEffect(() => {
        if (activeTool === "drawing" && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx && canvas.width === 300) {
                canvas.width = canvas.parentElement?.clientWidth || 280;
                canvas.height = 260;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [activeTool]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        ctx.strokeStyle = drawMode === "eraser" ? "#ffffff" : penColor;
        ctx.lineWidth = drawMode === "eraser" ? eraserSize : penSize;
        ctx.lineCap = "round";
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            {/* Standard Memo Top Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-6">
                {/* Left: Back to Memo + Brand */}
                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate("/products/memo")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800 border border-brand-200/80 px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition"
                    >
                        <ArrowLeft size={15} /> <span className="hidden sm:inline">Back to Memo</span>
                    </Button>
                    <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                    <BrandLockup />
                </div>

                {/* Center: Document Title (Borderless display with inline edit pencil) */}
                <div className="flex items-center justify-center flex-1 max-w-sm sm:max-w-md mx-2 min-w-0">
                    {isEditingTitle ? (
                        <div className="flex items-center gap-1.5 w-full">
                            <FileText size={16} className="text-brand-600 shrink-0" />
                            <input
                                autoFocus
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setSaveStatus("Unsaved changes");
                                }}
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === "Escape") setIsEditingTitle(false);
                                }}
                                className="w-full border-b border-brand-500 bg-transparent px-1 py-0.5 text-sm sm:text-base font-bold text-slate-900 outline-none focus:border-brand-600"
                            />
                            <button
                                type="button"
                                onClick={() => setIsEditingTitle(false)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 transition"
                                title="Save title"
                            >
                                <Check size={16} />
                            </button>
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-2 group cursor-pointer"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            <FileText size={16} className="text-brand-600 shrink-0 group-hover:scale-105 transition" />
                            <span className="text-sm sm:text-base font-bold text-slate-800 truncate">
                                {title || "Untitled Document"}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditingTitle(true);
                                }}
                                title="Edit title"
                                className="p-1 text-slate-400 group-hover:text-brand-600 transition"
                                aria-label="Edit title"
                            >
                                <Pencil size={15} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Save Status & Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="hidden md:inline-block text-xs text-slate-500 font-medium">
                        {saveStatus}
                    </span>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-lg gap-1.5"
                    >
                        <Save size={14} /> <span className="hidden sm:inline">Save</span>
                    </Button>
                    <AccountMenu />
                </div>
            </header>

            {/* Sub-Header Toolbar: Page Actions, Text Tools, Painting & Canvas Tools */}
            <div className="sticky top-[53px] z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 shadow-2xs sm:px-6">
                {/* Group 1: Page Controls */}
                <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                    <span className="text-xs font-semibold text-slate-500 hidden xl:inline">Page:</span>
                    <select
                        value={currentPage}
                        onChange={(e) => {
                            const pageNum = Number(e.target.value);
                            setCurrentPage(pageNum);
                            if (editorScrollRef.current) {
                                const h = editorScrollRef.current.clientHeight || 800;
                                editorScrollRef.current.scrollTo({ top: (pageNum - 1) * h, behavior: "smooth" });
                            }
                        }}
                        className="rounded-md border border-slate-200 bg-slate-50 px-1 py-1 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-brand-500"
                    >
                        {Array.from({ length: totalPages }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                Page {i + 1} of {totalPages}
                            </option>
                        ))}
                    </select>
                    <div className="relative inline-block" data-pages-dropdown>
                        <button
                            type="button"
                            onClick={() => setIsPagesDropdownOpen((s) => !s)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                        >
                            Pages <span className="text-slate-400">▼</span>
                        </button>
                        {isPagesDropdownOpen && (
                            <div className="absolute left-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAddPage();
                                        setIsPagesDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition"
                                >
                                    + Add Page (Same Size)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleRemovePage();
                                        setIsPagesDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                                >
                                    - Remove Page (Same Size)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Group 2: Quick Text Formatting */}
                <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
                    <button
                        type="button"
                        onClick={() => insertFormatting("**Bold**")}
                        title="Bold"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                        <Bold size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting("*Italic*")}
                        title="Italic"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                        <Italic size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting("# Heading 1")}
                        title="Heading 1"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                        <Heading1 size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting("## Heading 2")}
                        title="Heading 2"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                        <Heading2 size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting("- Bullet list")}
                        title="Bullet List"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                        <List size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting("```", "```")}
                        title="Code Block"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                        <Code size={15} />
                    </button>
                </div>

                {/* Group 3: Drawing / Paint Controls */}
                <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                setDrawMode("pen");
                                setActiveTool("drawing");
                            }}
                            title="Pen Tool"
                            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition ${
                                drawMode === "pen" && activeTool === "drawing"
                                    ? "bg-brand-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <PenTool size={13} /> Pen
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDrawMode("eraser");
                                setActiveTool("drawing");
                            }}
                            title="Eraser Tool"
                            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition ${
                                drawMode === "eraser" && activeTool === "drawing"
                                    ? "bg-brand-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Eraser size={13} /> Eraser
                        </button>
                    </div>

                    {/* Brush Size Selector */}
                    <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Size:</span>
                        {drawMode === "pen" ? (
                            <select
                                value={penSize}
                                onChange={(e) => setPenSize(Number(e.target.value))}
                                className="rounded-md border border-slate-200 bg-white px-1 py-1 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-brand-500"
                            >
                                <option value={2}>2px (Thin)</option>
                                <option value={4}>4px (Medium)</option>
                                <option value={8}>8px (Thick)</option>
                                <option value={14}>14px (Heavy)</option>
                            </select>
                        ) : (
                            <select
                                value={eraserSize}
                                onChange={(e) => setEraserSize(Number(e.target.value))}
                                className="rounded-md border border-slate-200 bg-white px-1 py-1 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-brand-500"
                            >
                                <option value={8}>8px (Small)</option>
                                <option value={16}>16px (Medium)</option>
                                <option value={24}>24px (Large)</option>
                                <option value={36}>36px (Huge)</option>
                            </select>
                        )}
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1">
                        {["#1e293b", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"].map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => {
                                    setPenColor(color);
                                    setDrawMode("pen");
                                }}
                                style={{ backgroundColor: color }}
                                className={`h-4 w-4 rounded-full border transition ${
                                    penColor === color && drawMode === "pen"
                                        ? "ring-2 ring-brand-500 ring-offset-1 scale-110"
                                        : "border-transparent opacity-80 hover:opacity-100"
                                }`}
                            />
                        ))}
                        <input
                            type="color"
                            value={penColor}
                            onChange={(e) => {
                                setPenColor(e.target.value);
                                setDrawMode("pen");
                            }}
                            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                            title="Custom Color"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={clearCanvas}
                        title="Clear Canvas"
                        className="rounded p-1 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>

                {/* Group 4: Stats Summary Badge */}
                <div className="flex items-center gap-3 text-[11px] sm:text-xs font-semibold text-slate-500 shrink-0 ml-auto">
                    <span className="flex items-center gap-1"><FileText size={13} /> {stats.words} words</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:flex items-center">{stats.chars} chars</span>
                </div>
            </div>

            {/* Main Editor & Right Sidebar Grid */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left/Center Editor Canvas */}
                <main className="flex-1 flex flex-col min-w-0 relative">
                    {/* Scrollable Text Area Surface */}
                    <div
                        ref={editorScrollRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 flex justify-center"
                    >
                        <div className="w-full max-w-5xl bg-white min-h-[85vh] rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 flex flex-col">
                            <textarea
                                value={content}
                                onChange={(e) => {
                                    setContent(e.target.value);
                                    setSaveStatus("Unsaved changes");
                                }}
                                placeholder="Start typing your memo or notes here..."
                                className="w-full flex-1 resize-none bg-transparent text-base leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Floating Back to Top & Live Page Counter */}
                    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
                        {showBackToTop && (
                            <button
                                type="button"
                                onClick={scrollToTop}
                                className="flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-brand-800"
                            >
                                <ArrowUp size={14} /> Back to top
                            </button>
                        )}
                        <span className="rounded-full bg-slate-900/90 px-3.5 py-1 text-xs font-medium text-white shadow backdrop-blur">
                            Page {currentPage} of {totalPages}
                        </span>
                    </div>
                </main>

                {/* Right Sidebar with Collapsible/Expandable Tools */}
                <aside aria-label="Memo Right Tools Sidebar" className="w-72 shrink-0 border-l border-slate-200 bg-white flex flex-col">
                    {/* Tool Switcher Rail (Icons of non-expanded tools, expanded tool takes remaining space) */}
                    <div className="flex items-center justify-around border-b border-slate-200 bg-slate-100 p-1.5">
                        <button
                            type="button"
                            onClick={() => setActiveTool("explorer")}
                            title="File Explorer"
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeTool === "explorer"
                                    ? "bg-white text-brand-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <Folder size={16} />
                            {activeTool === "explorer" && <span>Explorer</span>}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool("editor")}
                            title="Text Editor Tools"
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeTool === "editor"
                                    ? "bg-white text-brand-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <FileText size={16} />
                            {activeTool === "editor" && <span>Editor</span>}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTool("drawing")}
                            title="Drawing Canvas"
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeTool === "drawing"
                                    ? "bg-white text-brand-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <NotebookPen size={16} />
                            {activeTool === "drawing" && <span>Drawing</span>}
                        </button>
                    </div>

                    {/* Expanded Tool Section Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTool === "explorer" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                        <Folder size={16} className="text-brand-600" /> File Explorer
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Quick navigation back to workspace documents and folders.
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate("/products/memo")}
                                    className="w-full text-xs"
                                >
                                    Open Workspace Folder Tree
                                </Button>
                            </div>
                        )}

                        {activeTool === "editor" && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                        <FileText size={16} className="text-brand-600" /> Document Formatting
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => insertFormatting("**Bold**")}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <Bold size={14} /> Bold
                                        </button>
                                        <button
                                            onClick={() => insertFormatting("*Italic*")}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <Italic size={14} /> Italic
                                        </button>
                                        <button
                                            onClick={() => insertFormatting("# Heading 1")}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <Heading1 size={14} /> Heading 1
                                        </button>
                                        <button
                                            onClick={() => insertFormatting("## Heading 2")}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <Heading2 size={14} /> Heading 2
                                        </button>
                                        <button
                                            onClick={() => insertFormatting("- Bullet point")}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <List size={14} /> Bullet
                                        </button>
                                        <button
                                            onClick={() => insertFormatting("```", "```")}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <Code size={14} /> Code Block
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Statistics
                                    </h4>
                                    <div className="space-y-1.5 text-xs text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Words:</span>
                                            <span className="font-semibold text-slate-800">{stats.words}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Characters:</span>
                                            <span className="font-semibold text-slate-800">{stats.chars}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Reading Time:</span>
                                            <span className="font-semibold text-slate-800">~{stats.readTime} min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTool === "drawing" && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    <NotebookPen size={16} className="text-brand-600" /> Pen & Canvas
                                </h3>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setDrawMode("pen")}
                                        className={`rounded px-2.5 py-1 text-xs font-semibold ${
                                            drawMode === "pen" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                                        }`}
                                    >
                                        <PenTool size={12} className="inline mr-1" /> Pen
                                    </button>
                                    <button
                                        onClick={() => setDrawMode("eraser")}
                                        className={`rounded px-2.5 py-1 text-xs font-semibold ${
                                            drawMode === "eraser" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                                        }`}
                                    >
                                        <Eraser size={12} className="inline mr-1" /> Eraser
                                    </button>
                                    <button
                                        onClick={clearCanvas}
                                        className="ml-auto text-xs text-slate-500 hover:text-red-600"
                                    >
                                        Clear
                                    </button>
                                </div>

                                {/* Dedicated option below pen and eraser for size / thickness */}
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                        <span>{drawMode === "pen" ? "Pen Thickness" : "Eraser Size"}</span>
                                        <span className="text-brand-600 font-bold">
                                            {drawMode === "pen" ? `${penSize}px` : `${eraserSize}px`}
                                        </span>
                                    </div>
                                    {drawMode === "pen" ? (
                                        <div className="space-y-2">
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={penSize}
                                                onChange={(e) => setPenSize(Number(e.target.value))}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                            />
                                            <div className="flex justify-between gap-1">
                                                {[2, 4, 8, 14].map((sz) => (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => setPenSize(sz)}
                                                        className={`flex-1 rounded py-1 text-[11px] font-medium border transition ${
                                                            penSize === sz
                                                                ? "bg-white border-brand-500 text-brand-700 shadow-2xs font-bold"
                                                                : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-white"
                                                        }`}
                                                    >
                                                        {sz}px
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="range"
                                                min="4"
                                                max="40"
                                                value={eraserSize}
                                                onChange={(e) => setEraserSize(Number(e.target.value))}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                            />
                                            <div className="flex justify-between gap-1">
                                                {[8, 16, 24, 36].map((sz) => (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => setEraserSize(sz)}
                                                        className={`flex-1 rounded py-1 text-[11px] font-medium border transition ${
                                                            eraserSize === sz
                                                                ? "bg-white border-brand-500 text-brand-700 shadow-2xs font-bold"
                                                                : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-white"
                                                        }`}
                                                    >
                                                        {sz}px
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-inner">
                                    <canvas
                                        ref={canvasRef}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        style={{
                                            cursor:
                                                activeTool === "drawing" && drawMode === "pen"
                                                    ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>') 2 22, auto`
                                                    : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize + 2}" height="${eraserSize + 2}" viewBox="0 0 ${eraserSize + 2} ${eraserSize + 2}"><circle cx="${(eraserSize + 2) / 2}" cy="${(eraserSize + 2) / 2}" r="${eraserSize / 2}" fill="white" stroke="black" /></svg>') ${(eraserSize + 2) / 2} ${(eraserSize + 2) / 2}, auto`,
                                        }}
                                        className="w-full h-52 touch-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MemoEditor;
