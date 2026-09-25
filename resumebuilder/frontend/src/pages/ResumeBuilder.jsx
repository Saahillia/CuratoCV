import {
    RotateCcw,
    Loader2,
    ChevronLeft,
    ZoomIn,
    ZoomOut,
    Sparkles,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import ResumePreview from "../components/ResumePreview";
import TemplateSelector from "../components/TemplateSelector";
import ColorSettings from "../components/Customize/ColorSettings";
import TypographySettings from "../components/Customize/TypographySettings";
import LayoutSettings from "../components/Customize/LayoutSettings";
import SpacingSettings from "../components/Customize/SpacingSettings";
import HeaderSettings from "../components/Customize/HeaderSettings";
import FooterSettings from "../components/Customize/FooterSettings";
import PhotoSettings from "../components/Customize/PhotoSettings";
import LinkSettings from "../components/Customize/LinkSettings";
import DocumentSettings from "../components/Customize/DocumentSettings";
import SectionCustomizationPanel from "../components/Customize/SectionCustomizationPanel";
import CustomizeLayout from "../components/Customize/CustomizeLayout";
import ContentEditor from "../components/ContentEditor/ContentEditor";
import FullScreenEntryEditor from "../components/ContentEditor/FullScreenEntryEditor";
import ResumeBuilderHeader from "../components/ResumeBuilder/ResumeBuilderHeader";
import { saveResumeToLocal, loadResumeFromLocal } from "../utils/localStorage";
import {
    toCanonicalResume,
    resetDesignCategory,
    resetAllCustomization,
} from "../utils/resume";

import api from "@curatocv/api-client";
import toast from "react-hot-toast";

const ResumeBuilder = () => {
    const { resumeId } = useParams();
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    // Initial state matching the canonical resume shape
    const initialState = {
        _id: resumeId || "",
        title: "Untitled Resume",
        public: false,
        personalInfo: {
            photo: { url: "", fileId: "" },
            fullName: "",
            profession: "",
            email: "",
            phone: "",
            location: "",
            linkedin: "",
            website: "",
            github: "",
        },
        design: {
            template: "classic",
            colors: { accent: "#17375F" },
        },
        sections: [],
    };

    const [resumeData, setResumeData] = useState(initialState);
    const [builderTab, setBuilderTab] = useState("content");
    const [removeBackground, setRemoveBackground] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [zoom, setZoom] = useState(0.85);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // --------------------------------------------------------------
    // Entry Editor Mode
    //
    // When set, the builder UI is temporarily replaced by a full-screen
    // entry editor. resumeData, autosave, and concurrency state remain
    // intact — no navigation, no reload, no reset.
    // --------------------------------------------------------------
    const [entryEditorState, setEntryEditorState] = useState(null);

    // Presentation state for mobile/tablet to toggle Editor vs Preview
    const [builderView, setBuilderView] = useState("editor");

    const openEntryEditor = useCallback((arg1, arg2 = null) => {
        let sectionId, entryId;
        if (typeof arg1 === "object" && arg1 !== null && !Array.isArray(arg1)) {
            sectionId = arg1.sectionId;
            entryId = arg1.entryId ?? null;
        } else {
            sectionId = arg1;
            entryId = arg2;
        }
        if (!sectionId) return;
        setEntryEditorState({
            sectionId,
            entryId,
            mode: entryId ? "edit" : "create",
        });
    }, []);

    const closeEntryEditor = useCallback(() => {
        setEntryEditorState(null);
    }, []);

    const saveTimerRef = useRef(null);
    const prevDataRef = useRef(null);
    const saveInFlightRef = useRef(false);
    const pendingSaveRef = useRef(null);
    const isHydratedRef = useRef(false);
    const mountedRef = useRef(true);
    const versionRef = useRef(0);
    const scheduleSaveRef = useRef(null);

    // Save resume to server
    const saveToServer = useCallback(
        async (dataToSave) => {
            if (
                !resumeId ||
                resumeId === "undefined" ||
                !token ||
                !dataToSave
            ) {
                return;
            }

            // ------------------------------------------------------
            // If another save is already running, don't start a
            // second request. Keep the newest data in pendingSaveRef.
            // ------------------------------------------------------

            if (saveInFlightRef.current) {
                pendingSaveRef.current = dataToSave;

                return;
            }

            saveInFlightRef.current = true;

            if (mountedRef.current) {
                setIsSaving(true);
                setSaveError(null);
            }

            try {
                const updatedResumeData = JSON.parse(
                    JSON.stringify(dataToSave),
                );

                const pi =
                    updatedResumeData.personalInfo ||
                    updatedResumeData.personal_info;

                // --------------------------------------------------
                // File objects must never be serialized into the
                // resume JSON payload.
                // Keep canonical { url, fileId } objects intact.
                // --------------------------------------------------

                if (pi) {
                    if (
                        typeof File !== "undefined" &&
                        pi.photo instanceof File
                    ) {
                        delete pi.photo;
                    }
                    if (
                        typeof File !== "undefined" &&
                        pi.image instanceof File
                    ) {
                        delete pi.image;
                    }
                }

                const formData = new FormData();

                formData.append(
                    "resumeData",
                    JSON.stringify(updatedResumeData),
                );

                formData.append("expectedVersion", String(versionRef.current));

                const response = await api.put(
                    `/resumes/update/${resumeId}`,
                    formData,
                );

                // Update versionRef with the new version from the server
                if (response?.data?.data?.resume?.__v !== undefined) {
                    versionRef.current = response.data.data.resume.__v;
                }

                saveResumeToLocal(resumeId, dataToSave);

                if (mountedRef.current) {
                    setLastSavedAt(new Date());

                    setSaveError(null);
                }
            } catch (error) {
                // Handle concurrency conflict
                if (error?.response?.status === 409) {
                    if (mountedRef.current) {
                        setSaveError(
                            "Concurrency conflict: Your resume was modified elsewhere. Your local changes have been preserved. Please refresh to see the latest version.",
                        );
                    }
                    return;
                }

                console.error("Save error:", error);

                const errMsg =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Save failed";

                if (mountedRef.current) {
                    setSaveError(errMsg);
                }
            } finally {
                saveInFlightRef.current = false;

                // --------------------------------------------------
                // If edits occurred while the previous save was
                // running, immediately save ONLY the newest state.
                // --------------------------------------------------

                const pendingData = pendingSaveRef.current;

                pendingSaveRef.current = null;

                if (pendingData && mountedRef.current) {
                    saveToServer(pendingData);

                    return;
                }

                if (mountedRef.current) {
                    setIsSaving(false);
                }
            }
        },
        [resumeId, token],
    );

    // Debounced save
    const scheduleSave = useCallback(
        (newData) => {
            if (!resumeId || resumeId === "undefined" || !newData) {
                return;
            }

            // ------------------------------------------------------
            // Local persistence happens immediately.
            // ------------------------------------------------------

            saveResumeToLocal(resumeId, newData);

            // ------------------------------------------------------
            // If a server save is already running, simply remember
            // the newest state. saveToServer() will process it after
            // the current request completes.
            // ------------------------------------------------------

            if (saveInFlightRef.current) {
                pendingSaveRef.current = newData;

                return;
            }

            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }

            saveTimerRef.current = setTimeout(() => {
                saveTimerRef.current = null;

                saveToServer(newData);
            }, 750);
        },
        [resumeId, saveToServer],
    );

    // Keep scheduleSaveRef current so loadExistingResume never captures a stale closure.
    scheduleSaveRef.current = scheduleSave;

    // Load resume from server or localStorage
    const loadExistingResume = useCallback(async () => {
        if (!resumeId || resumeId === "undefined") {
            setIsLoading(false);
            return;
        }

        isHydratedRef.current = false;

        const localDraft = loadResumeFromLocal(resumeId);

        // ----------------------------------------------------------
        // Show local draft immediately when available.
        //
        // IMPORTANT:
        // We deliberately do NOT mark loading as complete here.
        // The server version must still be checked before autosave
        // is allowed to begin.
        // ----------------------------------------------------------

        if (localDraft?.data) {
            setResumeData(toCanonicalResume(localDraft.data));
        }

        // ----------------------------------------------------------
        // No authenticated server request possible.
        // ----------------------------------------------------------

        if (!token) {
            isHydratedRef.current = true;
            setIsLoading(false);

            if (localDraft?.data) {
                prevDataRef.current = toCanonicalResume(localDraft.data);
            }

            return;
        }

        try {
            const { data } = await api.get(`/resumes/get/${resumeId}`);

            const serverResume = data?.data?.resume || data?.resume;

            // Update versionRef with the server version for concurrency control
            if (typeof serverResume?.__v === "number") {
                versionRef.current = serverResume.__v;
            }

            if (!serverResume) {
                throw new Error("Resume was not returned by the server.");
            }

            const canonicalServerResume = toCanonicalResume(serverResume);

            const serverData = {
                ...canonicalServerResume,

                _id: serverResume._id || resumeId,

                title: serverResume.title || "Untitled Resume",

                public: Boolean(serverResume.public),
            };

            // ------------------------------------------------------
            // Compare local and server timestamps.
            //
            // LocalStorage contains the time at which the user's
            // local draft was last changed.
            //
            // MongoDB timestamps contain the server's latest update.
            // ------------------------------------------------------

            const localSavedAt = localDraft?.savedAt
                ? Date.parse(localDraft.savedAt)
                : 0;

            const serverUpdatedAt = serverResume.updatedAt
                ? Date.parse(serverResume.updatedAt)
                : 0;

            const hasNewerLocalDraft = Boolean(
                localDraft?.data &&
                localSavedAt > 0 &&
                (serverUpdatedAt === 0 || localSavedAt > serverUpdatedAt),
            );

            if (hasNewerLocalDraft) {
                // --------------------------------------------------
                // The local draft is newer.
                //
                // Keep it in the editor. It will be queued for a
                // server save only AFTER hydration completes.
                // --------------------------------------------------

                const canonicalLocalResume = toCanonicalResume(localDraft.data);

                const finalLocalData = {
                    ...canonicalLocalResume,

                    _id: localDraft.data._id || resumeId,

                    title: localDraft.data.title || "Untitled Resume",

                    public: Boolean(localDraft.data.public),
                };

                setResumeData(finalLocalData);

                prevDataRef.current = finalLocalData;

                // Mark as hydrated before scheduling the recovery save.
                isHydratedRef.current = true;
                setIsLoading(false);

                scheduleSaveRef.current(finalLocalData);

                document.title = `${finalLocalData.title || "Untitled"} - CuratoCV`;

                return;
            }

            // ------------------------------------------------------
            // Server is authoritative because it is newer or the
            // local draft has no usable timestamp.
            // ------------------------------------------------------

            setResumeData(serverData);

            prevDataRef.current = serverData;

            saveResumeToLocal(resumeId, serverData);

            document.title = `${serverData.title || "Untitled"} - CuratoCV`;

            isHydratedRef.current = true;
            setIsLoading(false);
        } catch (error) {
            console.error("Error loading resume:", error);

            // ------------------------------------------------------
            // If the server fails but a local draft exists, allow
            // the user to continue editing locally.
            // ------------------------------------------------------

            if (localDraft?.data) {
                const canonicalLocalResume = toCanonicalResume(localDraft.data);

                const localData = {
                    ...canonicalLocalResume,

                    _id: localDraft.data._id || resumeId,

                    title: localDraft.data.title || "Untitled Resume",

                    public: Boolean(localDraft.data.public),
                };

                setResumeData(localData);

                prevDataRef.current = localData;

                isHydratedRef.current = true;
                setIsLoading(false);

                toast.error(
                    "Couldn't reach the server. Your local draft is available and will be saved when connection is restored.",
                );

                return;
            }

            isHydratedRef.current = true;
            setIsLoading(false);

            toast.error(
                error?.response?.data?.message || "Failed to load resume.",
            );
        }
    }, [resumeId, token]);

    // Mount: load existing resume when resumeId is present.
    // Without this, the edit page is stuck on the loading spinner
    // because isLoading is never set to false.
    useEffect(() => {
        loadExistingResume();
    }, [loadExistingResume]);

    // Force save
    const forceSave = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);

            saveTimerRef.current = null;
        }

        if (!resumeData) {
            return;
        }

        if (saveInFlightRef.current) {
            pendingSaveRef.current = resumeData;

            return;
        }

        saveToServer(resumeData);
    }, [saveToServer, resumeData]);

    // Auto-save on data changes
    useEffect(() => {
        if (isLoading || !isHydratedRef.current || !resumeData) {
            return;
        }

        if (prevDataRef.current === resumeData) {
            return;
        }

        prevDataRef.current = resumeData;

        scheduleSave(resumeData);
    }, [resumeData, isLoading, scheduleSave]);

    // Cleanup timer on unmount
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);

                saveTimerRef.current = null;
            }

            pendingSaveRef.current = null;
        };
    }, []);

    const handleResetCategory = (category) => {
        setResumeData((prev) => ({
            ...prev,
            design: resetDesignCategory(prev.design || {}, category),
        }));
    };

    const handleResetAllCustomization = () => {
        if (
            !window.confirm(
                "Reset all visual customization to defaults? Your template, content, and personal info will be preserved.",
            )
        )
            return;
        setResumeData((prev) => ({
            ...prev,
            design: resetAllCustomization(prev.design || {}),
        }));
    };

    const toggleResumeVisibility = async () => {
        if (isUpdatingVisibility) return;
        setIsUpdatingVisibility(true);

        const newVisibility = !resumeData.public;

        try {
            const formData = new FormData();
            formData.append(
                "resumeData",
                JSON.stringify({ public: newVisibility }),
            );

            await api.put(`/resumes/update/${resumeId}`, formData);

            setResumeData((prev) => ({ ...prev, public: newVisibility }));
            toast.success(
                newVisibility
                    ? "Resume is now Public! Anyone with the link can view it."
                    : "Resume is now Private.",
            );
        } catch (error) {
            console.error("Error updating resume visibility:", error);
            toast.error(
                error?.response?.data?.message ||
                    "Failed to update visibility.",
            );
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const handleShare = async () => {
        const publicUrl = `${window.location.origin}/resume/${resumeId}`;

        if (!resumeData.public) {
            toast.error("Please make the resume Public first before sharing.");
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: resumeData.title || "My Resume",
                    text: `View my resume: ${resumeData.title}`,
                    url: publicUrl,
                });
                return;
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Error sharing resume:", error);
                }
            }
        }

        try {
            await navigator.clipboard.writeText(publicUrl);
            toast.success("Public resume link copied to clipboard!");
        } catch (error) {
            console.error("Failed to copy link:", error);
            toast.error("Could not copy link to clipboard.");
        }
    };

    const handleDownload = async () => {
        if (!resumeId || resumeId === "undefined") {
            toast.error("Save your resume first before downloading.");
            return;
        }
        setIsGeneratingPdf(true);
        try {
            // Ensure latest changes are saved before downloading
            if (saveInFlightRef.current) {
                await new Promise((resolve) => {
                    const check = setInterval(() => {
                        if (!saveInFlightRef.current) { clearInterval(check); resolve(); }
                    }, 100);
                });
            } else if (prevDataRef.current !== resumeData) {
                await saveToServer(resumeData);
                if (saveInFlightRef.current) {
                    await new Promise((resolve) => {
                        const check = setInterval(() => {
                            if (!saveInFlightRef.current) { clearInterval(check); resolve(); }
                        }, 100);
                    });
                }
            }

            const response = await api.get(`/resumes/pdf/${resumeId}`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = response.headers["content-disposition"]?.split("filename=")?.[1]?.replace(/"/g, '') || `${resumeData.title || "resume"}_CuratoCV.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("PDF downloaded!");
        } catch (err) {
            toast.error("Unable to generate your PDF. Please try again.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const tabs = [
        { id: "content", label: "Content" },
        { id: "customize", label: "Customize" },
        { id: "overview", label: "Settings" },
        { id: "ai_tools", label: "AI Tools" },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="size-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-slate-600">Loading your resume...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans lg:h-screen lg:overflow-hidden">
            {/* ================= HEADER ================= */}
            <ResumeBuilderHeader
                resumeData={resumeData}
                builderTab={builderTab}
                setBuilderTab={setBuilderTab}
                isSaving={isSaving}
                lastSavedAt={lastSavedAt}
                saveError={saveError}
                forceSave={forceSave}
                isUpdatingVisibility={isUpdatingVisibility}
                toggleResumeVisibility={toggleResumeVisibility}
                onShare={handleShare}
                onDownload={handleDownload}
                isGeneratingPdf={isGeneratingPdf}
            />

            {/* ================= MAIN BUILDER VIEWPORT ================= */}
            <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-6 py-4 lg:overflow-hidden">
                <div className="flex lg:flex-row flex-col gap-5 h-full min-h-0 relative">
                    {/* LEFT PANE: Editor Panel */}
                    <section className={`w-full lg:w-[46%] h-full min-h-0 flex flex-col print:hidden ${builderView === "editor" ? "flex" : "hidden lg:flex"}`}>
                        <div className={`flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm flex flex-col ${
                            !entryEditorState && builderTab !== "customize" ? 'overflow-y-scroll overscroll-y-contain px-3 py-4 pr-2 pb-24 custom-scrollbar' : ''
                        }`}>
                            {entryEditorState ? (
                                <FullScreenEntryEditor
                                    resumeData={resumeData}
                                    setResumeData={setResumeData}
                                    sectionId={entryEditorState.sectionId}
                                    entryId={entryEditorState.entryId}
                                    mode={entryEditorState.mode}
                                    onDone={closeEntryEditor}
                                    isSaving={isSaving}
                                    lastSavedAt={lastSavedAt}
                                />
                            ) : (
                                <>
                                    {builderTab === "content" && (
                                        <ContentEditor
                                            resumeData={resumeData}
                                            onChange={setResumeData}
                                            removeBackground={removeBackground}
                                            setRemoveBackground={setRemoveBackground}
                                            accentColor={
                                                resumeData.design?.colors?.accent ||
                                                "#17375F"
                                            }
                                            onEditEntry={openEntryEditor}
                                            onAddEntry={openEntryEditor}
                                        />
                                    )}

                                    {builderTab === "customize" && (
                                        <CustomizeLayout
                                            resumeData={resumeData}
                                            onChange={setResumeData}
                                        />
                                    )}

                            {builderTab === "overview" && (
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-800">
                                            Resume Settings
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            General properties and metadata for
                                            your resume
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                                Resume Document Title
                                            </label>
                                            <input
                                                type="text"
                                                value={resumeData.title || ""}
                                                onChange={(e) =>
                                                    setResumeData((prev) => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500"
                                                placeholder="e.g. Senior Software Architect Resume"
                                            />
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                                            <p className="font-semibold text-slate-800">
                                                Resume Link
                                            </p>
                                            <p className="break-all font-mono text-[11px] text-slate-500">
                                                {window.location.origin}/resume/
                                                {resumeId}
                                            </p>
                                            <p className="text-[11px]">
                                                Status:{" "}
                                                <span className="font-semibold">
                                                    {resumeData.public
                                                        ? "Publicly Accessible"
                                                        : "Private (Draft)"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {builderTab === "ai_tools" && (
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="size-5 text-purple-600" />
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-800">
                                                AI Assistant
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Smart enhancements for your
                                                resume sections
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-purple-900 leading-relaxed">
                                        ✨{" "}
                                        <strong>
                                            Interactive Section Enhancements:
                                        </strong>{" "}
                                        AI tools are built right into each
                                        section card! Look for the{" "}
                                        <span className="inline-flex items-center font-semibold text-purple-700">
                                            Enhance with AI
                                        </span>{" "}
                                        buttons on your summary, experience, and
                                        project descriptions to rewrite or
                                        optimize them automatically.
                                    </div>
                                </div>
                            )}
                            </>
                        )}
                        </div>
                    </section>

                    {/* RIGHT PANE: Live Synchronized Preview */}
                    <section className={`w-full lg:flex-1 h-full min-h-0 overflow-hidden rounded-2xl bg-slate-50 shadow-sm ${builderView === "preview" ? "flex" : "hidden lg:flex"} lg:flex-col print:w-full print:rounded-none print:border-0 print:p-0 border border-slate-200`}>
                        {/* Zoom & Document Toolbar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 text-xs text-slate-600 select-none shrink-0 print:hidden">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700">A4 Document</span>
                                <span className="text-[11px] text-slate-400 font-mono">(210 × 297 mm)</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setZoom((z) => Math.max(Number((z - 0.1).toFixed(2)), 0.3))}
                                    className="p-1 hover:bg-white rounded transition text-slate-600 hover:text-slate-900"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoom(0.85)}
                                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-white rounded transition min-w-[48px] text-center"
                                    title="Reset Zoom"
                                >
                                    {Math.round(zoom * 100)}%
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoom((z) => Math.min(Number((z + 0.1).toFixed(2)), 1.5))}
                                    className="p-1 hover:bg-white rounded transition text-slate-600 hover:text-slate-900"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="size-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Scaled Preview Canvas */}
                        <div className="flex-1 min-h-0 overflow-auto bg-slate-100/80 p-5 pb-24 custom-scrollbar flex justify-center">
                            <div
                                style={{
                                    transform: `scale(${zoom})`,
                                    transformOrigin: "top center",
                                    marginBottom: `${(zoom - 1) * 297}mm`,
                                }}
                                className="transition-transform duration-75 ease-out"
                            >
                                <ResumePreview
                                    data={resumeData}
                                    template={
                                        resumeData.design?.template || "classic"
                                    }
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Tablet / Mobile Fixed Bottom Navigation Bar (Hidden on lg and above) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-2.5 flex items-center justify-around shadow-lg pb-safe print:hidden">
                    <button
                        type="button"
                        onClick={() => setBuilderView("editor")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                            builderView === "editor"
                                ? "bg-[#17375F] text-white shadow-md shadow-[#17375F]/20"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                        Editor
                    </button>
                    <button
                        type="button"
                        onClick={() => setBuilderView("preview")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                            builderView === "preview"
                                ? "bg-[#17375F] text-white shadow-md shadow-[#17375F]/20"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Live Preview
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ResumeBuilder;
