import { useCallback, useEffect, useState } from "react";
import {
    PlusIcon,
    UploadCloudIcon,
    FilePenLineIcon,
    Trash2Icon,
    PencilIcon,
    XIcon,
    UploadCloud,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../services/api";
import aiService from "../services/aiService";
import subscriptionService from "../services/subscriptionService";
import resumeService from "../services/resumeService";
import ResumeCardPreview from "../components/ResumeCardPreview";
import UpgradeModal from "../components/Billing/UpgradeModal";
import Breadcrumbs from "../components/Common/Breadcrumbs";
import toast from "react-hot-toast";
import pdfToText from "react-pdftotext";

const Dashboard = () => {
    const { token, user } = useSelector((state) => state.auth);

    const [allResumes, setAllResumes] = useState([]);

    const [showCreateResume, setShowCreateResume] = useState(false);
    const [showUploadResume, setShowUploadResume] = useState(false);

    const [title, setTitle] = useState("");
    const [resume, setResume] = useState(null);

    const [editResumeId, setEditResumeId] = useState("");
    const [isloading, setIsLoading] = useState(false);
    const [entitlements, setEntitlements] = useState(null);

    // Upgrade Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");

    const navigate = useNavigate();

    const loadAllResumes = useCallback(async () => {
        if (!token) return;

        try {
            const { data } = await api.get("/users/resumes");

            // Backend userController returns { success, data: { resumes: [...] } }
            const resumes = data?.data?.resumes ?? data?.resumes;
            setAllResumes(Array.isArray(resumes) ? resumes : []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message, {
                duration: 3000,
            });
        }
    }, [token]);

    const loadEntitlements = useCallback(async () => {
        if (!token) return;
        try {
            const data = await subscriptionService.getEntitlements();
            setEntitlements(data?.data || null);
        } catch (error) {
            console.warn("Could not load entitlements", error);
        }
    }, [token]);

    useEffect(() => {
        loadAllResumes();
        loadEntitlements();
    }, [loadAllResumes, loadEntitlements]);

    // Check limit before creating
    const handleInitiateCreate = () => {
        if (
            entitlements &&
            entitlements.resumeLimit !== -1 &&
            allResumes.length >= entitlements.resumeLimit
        ) {
            setUpgradeMessage(
                "You've reached your resume limit. Upgrade your plan to create more resumes.",
            );
            setShowUpgradeModal(true);
            return;
        }
        setShowCreateResume(true);
    };

    // Check limit before uploading
    const handleInitiateUpload = () => {
        if (
            entitlements &&
            entitlements.resumeLimit !== -1 &&
            allResumes.length >= entitlements.resumeLimit
        ) {
            setUpgradeMessage(
                "You've reached your resume limit. Upgrade your plan to upload more resumes.",
            );
            setShowUpgradeModal(true);
            return;
        }
        setShowUploadResume(true);
    };

    const handleInitiateDuplicate = async (resumeId) => {
        if (
            entitlements &&
            entitlements.resumeLimit !== -1 &&
            allResumes.length >= entitlements.resumeLimit
        ) {
            setUpgradeMessage(
                "You've reached your resume limit. Upgrade your plan to duplicate this resume.",
            );
            setShowUpgradeModal(true);
            return;
        }

        try {
            // Backend does not have a native /duplicate endpoint yet in resumeRoutes, so ideally fetch and create
            const { data: foundResume } = await api.get(
                `/resumes/get/${resumeId}`,
            );
            const resData = foundResume?.data?.resume ?? foundResume?.resume;
            if (!resData)
                throw new Error("Could not fetch resume details to duplicate.");

            const newPayload = { ...resData };
            delete newPayload._id;
            delete newPayload.__v;
            delete newPayload.createdAt;
            delete newPayload.updatedAt;
            newPayload.title = `${newPayload.title || "Untitled"} (Copy)`;

            const { data: createdRes } = await api.post(
                `/resumes/create`,
                newPayload,
            );
            const finalResume = createdRes?.data?.resume ?? createdRes?.resume;
            if (finalResume) {
                setAllResumes((prev) => [...prev, finalResume]);
                toast.success("Resume duplicated successfully!");
            }
        } catch (error) {
            if (error?.response?.status === 403) {
                setUpgradeMessage(
                    "You've reached your resume limit. Please upgrade to a premium plan.",
                );
                setShowUpgradeModal(true);
            } else {
                toast.error(
                    error?.response?.data?.message ||
                        "Failed to duplicate resume.",
                );
            }
        }
    };

    // Create resume
    const createResume = async (event) => {
        try {
            event.preventDefault();
            setIsLoading(true);

            const { data } = await api.post("/resumes/create", {
                title: title.trim(),
            });

            const createdResume = data?.data?.resume ?? data?.resume;

            const createdResumeId = createdResume?._id || data?.resumeId;

            if (!createdResumeId) {
                toast.error(
                    "Resume was created, but no resume id was returned.",
                );
                setIsLoading(false);
                return;
            }

            if (createdResume) {
                setAllResumes((prev) => [...prev, createdResume]);
            }

            setTitle("");
            setShowCreateResume(false);

            navigate(`/app/resumes/${createdResumeId}/edit`);
        } catch (error) {
            if (error?.response?.status === 403) {
                toast.error(
                    "Resume limit reached. Please upgrade to a premium plan to create more resumes.",
                    { duration: 5000 },
                );
                navigate("/pricing");
            } else {
                toast.error(
                    error?.response?.data?.error?.message ||
                        error?.response?.data?.message ||
                        error.message,
                    {
                        duration: 3000,
                    },
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Upload resume
    const uploadResume = async (event) => {
        event.preventDefault();

        if (!resume) {
            toast.error("Please select a resume file first.");
            return;
        }

        // Only PDF files are supported for text extraction
        if (
            resume.type !== "application/pdf" &&
            !resume.name.toLowerCase().endsWith(".pdf")
        ) {
            toast.error(
                "Please upload a valid PDF file. DOC/DOCX files are not supported.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const resumeText = await pdfToText(resume);

            if (!resumeText || !resumeText.trim()) {
                toast.error(
                    "Could not extract text from this PDF. The file may be scanned or image-based. Please try a text-based PDF.",
                );
                setIsLoading(false);
                return;
            }

            // Client-side UX guard: surface early warning for very small
            // extractions. The backend remains the authoritative boundary.
            const cleanedText = resumeText.trim();
            if (cleanedText.length < 50) {
                toast.error(
                    "The PDF does not contain enough readable text. Please upload a text-based PDF or DOC/DOCX text export.",
                );
                setIsLoading(false);
                return;
            }

            const data = await aiService.uploadResume({
                title: title.trim(),
                resumeText: cleanedText,
            });

            const uploadedResume =
                data?.data?.resume ?? data?.resume ?? data?.data;

            const uploadedResumeId =
                uploadedResume?._id || data?.resumeId || data?.data?.resumeId;

            if (uploadedResumeId) {
                setTitle("");
                setResume(null);
                setShowUploadResume(false);
                setAllResumes((prev) => {
                    const exists = prev.find((r) => r._id === uploadedResumeId);
                    if (exists) return prev;
                    return [
                        ...prev,
                        uploadedResume || {
                            _id: uploadedResumeId,
                            title: title || "Uploaded Resume",
                        },
                    ];
                });
                navigate(`/app/resumes/${uploadedResumeId}/edit`);
            }
        } catch (error) {
            if (error?.response?.status === 403) {
                setShowUploadResume(false);
                setUpgradeMessage(
                    error?.response?.data?.message ||
                        "Resume limit reached. Please upgrade to a premium plan.",
                );
                setShowUpgradeModal(true);
            } else {
                toast.error(
                    error?.response?.data?.message ||
                        error.message ||
                        "Unable to process the uploaded resume.",
                    {
                        duration: 4000,
                    },
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Update title
    const editTitle = async (event) => {
        try {
            event.preventDefault();
            const { data } = await api.put(`/resumes/update/${editResumeId}`, {
                resumeData: { title },
            });

            // Backend resumeController returns { success: true, data: { resume, message } }
            const updatedResume = data?.data?.resume ?? data?.resume;
            const updatedTitle = updatedResume?.title || title;
            setAllResumes(
                allResumes.map((resume) =>
                    resume._id === editResumeId
                        ? { ...resume, title: updatedTitle }
                        : resume,
                ),
            );
            setTitle("");
            setEditResumeId("");
            toast.success(
                data?.data?.message ||
                    data?.message ||
                    "Resume title updated successfully.",
                { duration: 3000 },
            );
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message, {
                duration: 3000,
            });
        }
    };

    // Delete resume
    const deleteResume = async (resumeId) => {
        try {
            const confirmed = window.confirm(
                "Are you sure you want to delete this resume?",
            );

            if (!confirmed) return;

            const { data } = await api.delete(`/resumes/delete/${resumeId}`);

            setAllResumes((prev) =>
                prev.filter((resume) => resume._id !== resumeId),
            );

            toast.success(
                data?.data?.message ||
                    data?.message ||
                    "Resume deleted successfully.",
                {
                    duration: 3000,
                },
            );
        } catch (error) {
            if (error?.response?.status === 403) {
                toast.error(
                    "Resume limit reached. Please upgrade to a premium plan to create more resumes.",
                    { duration: 5000 },
                );
                navigate("/pricing");
            } else {
                toast.error(error?.response?.data?.message || error.message, {
                    duration: 3000,
                });
            }
        }
    };

    // Close create modal
    const closeCreateModal = () => {
        setShowCreateResume(false);
        setTitle("");
    };

    // Close upload modal
    const closeUploadModal = () => {
        setShowUploadResume(false);
        setTitle("");
        setResume(null);
    };

    // Close edit modal
    const closeEditModal = () => {
        setEditResumeId("");
        setTitle("");
    };

    const resumeColors = [
        {
            accent: "#17375F",
            background: "#E8F0F7",
        },
        {
            accent: "#24527A",
            background: "#F3F7FA",
        },
        {
            accent: "#2D638F",
            background: "#EEF5FA",
        },
        {
            accent: "#356F98",
            background: "#F1F6FA",
        },
        {
            accent: "#4A6F8F",
            background: "#F4F7F9",
        },
    ];

    return (
        <main className="min-h-screen bg-[#F3F7FA]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <Breadcrumbs />

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#17375F] to-[#24527A] text-xl font-bold text-white shadow-lg shadow-[#17375F]/20">
                                    {user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "CV"}
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                        {new Date().getHours() < 12 ? "Good morning," : new Date().getHours() < 17 ? "Good afternoon," : "Good evening,"} {user?.name || "Guest"}!
                                    </h1>
                                    <p className="text-slate-500">You have {allResumes.length} resume{allResumes.length !== 1 ? 's' : ''} saved in your account.</p>
                                </div>
                            </div>

                            {entitlements && (
                                <div className="flex items-center gap-6 rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-3 shadow-inner">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan</span>
                                        <span className="font-semibold text-[#17375F]">{entitlements.planName || entitlements.planId}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Usage</span>
                                        <span className="font-semibold text-slate-900">
                                            {allResumes.length} / {entitlements.resumeLimit === -1 ? "∞" : entitlements.resumeLimit}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                {/* Create / Upload */}
                <div className="flex flex-wrap gap-4">
                    {/* Create Resume */}
                    <button
                        type="button"
                        onClick={handleInitiateCreate}
                        className="group flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#B8CADB] bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#17375F] hover:shadow-lg hover:shadow-[#17375F]/10 sm:max-w-48"
                    >
                        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-b from-[#24527A] to-[#466080] shadow-md shadow-[#17375F]/20 transition-transform duration-300 group-hover:scale-105">
                            <PlusIcon className="size-6 text-white" />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#132f51]">
                                Create Resume
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Start from scratch
                            </p>
                        </div>
                    </button>

                    {/* Upload Resume */}
                    <button
                        type="button"
                        onClick={handleInitiateUpload}
                        className="group flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#B8CADB] bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#17375F] hover:shadow-lg hover:shadow-[#17375F]/10 sm:max-w-48"
                    >
                        <div className="flex size-12 items-center justify-center rounded-xl bg-[#E8F0F7] transition-transform duration-300 group-hover:scale-105">
                            <UploadCloudIcon className="size-6 text-[#17375F]" />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#17375F]">
                                Upload Resume
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Import an existing resume
                            </p>
                        </div>
                    </button>
                </div>

                {/* Divider */}
                <div className="my-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-[#D7E2EC]" />

                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Your resumes
                    </span>

                    <div className="h-px flex-1 bg-[#D7E2EC]" />
                </div>

                {/* Resume Cards */}
                {allResumes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {allResumes.map((resumeItem) => (
                            <ResumeCardPreview
                                key={resumeItem._id}
                                resume={resumeItem}
                                onEditTitle={(res) => {
                                    setEditResumeId(res._id);
                                    setTitle(res.title);
                                }}
                                onDelete={deleteResume}
                                onDuplicate={handleInitiateDuplicate}
                                onShare={(res) => {
                                    if (!res.public) {
                                        toast.error(
                                            "Please edit the resume and set it to Public before sharing.",
                                        );
                                        return;
                                    }
                                    const shareUrl = `${window.location.origin}/resume/${res._id}`;
                                    navigator.clipboard.writeText(shareUrl);
                                    toast.success(
                                        "Resume share link copied to clipboard!",
                                    );
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="rounded-2xl border border-dashed border-[#B8CADB] bg-white px-6 py-14 text-center">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#E8F0F7]">
                            <FilePenLineIcon className="size-6 text-[#17375F]" />
                        </div>

                        <h2 className="mt-5 text-base font-semibold text-slate-900">
                            No resumes yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                            Create your first resume and let CuratoCV help you
                            turn your experience into a professional
                            application.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowCreateResume(true)}
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#17375F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24527A]"
                        >
                            <PlusIcon className="size-4" />
                            Create your first resume
                        </button>
                    </div>
                )}

                {/* ================= CREATE RESUME MODAL ================= */}

                {showCreateResume && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
                        onClick={closeCreateModal}
                    >
                        <form
                            onSubmit={createResume}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            {/* Close */}
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#E8F0F7] hover:text-[#112641]"
                                aria-label="Close"
                            >
                                <XIcon className="size-5" />
                            </button>

                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                Create a Resume
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Give your resume a name to get started.
                            </p>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Resume title
                                </label>

                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Software Engineer Resume"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#132943] focus:ring-4 focus:ring-[#17375F]/10"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isloading}
                                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#17375F] text-sm font-semibold text-white transition hover:bg-[#24527A] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {!isloading && <PlusIcon className="size-4" />}
                                {isloading ? "Creating..." : "Create Resume"}
                            </button>
                        </form>
                    </div>
                )}

                {/* ================= UPLOAD RESUME MODAL ================= */}

                {showUploadResume && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
                        onClick={closeUploadModal}
                    >
                        <form
                            onSubmit={uploadResume}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            {/* Close */}
                            <button
                                type="button"
                                onClick={closeUploadModal}
                                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#E8F0F7] hover:text-[#17375F]"
                                aria-label="Close"
                            >
                                <XIcon className="size-5" />
                            </button>

                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                Upload Resume
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Import an existing resume into CuratoCV.
                            </p>

                            {/* Title */}
                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Resume title
                                </label>

                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. My Resume"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#17375F] focus:ring-4 focus:ring-[#17375F]/10"
                                    required
                                />
                            </div>

                            {/* File Upload */}
                            <div className="mt-4">
                                <label
                                    htmlFor="resume-input"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Resume file
                                </label>

                                <label
                                    htmlFor="resume-input"
                                    className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#B8CADB] bg-[#F3F7FA] px-4 py-8 text-center text-slate-400 transition hover:border-[#17375F] hover:bg-[#E8F0F7] hover:text-[#17375F]"
                                >
                                    {resume ? (
                                        <>
                                            <FilePenLineIcon className="size-8 text-[#17375F]" />

                                            <p className="max-w-full truncate text-sm font-medium text-[#17375F]">
                                                {resume.name}
                                            </p>

                                            <p className="text-xs text-slate-400">
                                                Click to choose another file
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="size-10 stroke-1" />

                                            <p className="text-sm font-medium">
                                                Choose a resume
                                            </p>

                                            <p className="text-xs">
                                                PDF files only
                                            </p>
                                        </>
                                    )}
                                </label>

                                <input
                                    type="file"
                                    id="resume-input"
                                    accept=".pdf"
                                    hidden
                                    onChange={(e) =>
                                        setResume(e.target.files?.[0] || null)
                                    }
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#17375F] text-sm font-semibold text-white transition hover:bg-[#24527A] disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!resume || isloading}
                            >
                                <UploadCloud className="size-4" />

                                {isloading
                                    ? "Uploading Resume..."
                                    : "Upload Resume"}
                            </button>
                        </form>
                    </div>
                )}

                {/* ================= EDIT TITLE MODAL ================= */}

                {editResumeId && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
                        onClick={closeEditModal}
                    >
                        <form
                            onSubmit={editTitle}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            {/* Close */}
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#E8F0F7] hover:text-[#17375F]"
                                aria-label="Close"
                            >
                                <XIcon className="size-5" />
                            </button>

                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                Edit Resume Title
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Update the name of your resume.
                            </p>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Resume title
                                </label>

                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter resume title"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#17375F] focus:ring-4 focus:ring-[#17375F]/10"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#17375F] text-sm font-semibold text-white transition hover:bg-[#24527A]"
                            >
                                <PencilIcon className="size-4" />
                                Update Title
                            </button>
                        </form>
                    </div>
                )}

                {/* ================= UPGRADE MODAL ================= */}
                {showUpgradeModal && (
                    <UpgradeModal
                        isOpen={showUpgradeModal}
                        onClose={() => setShowUpgradeModal(false)}
                        title="Limit Reached"
                        message={upgradeMessage}
                    />
                )}
            </div>
        </main>
    );
};

export default Dashboard;
