import {
    ArrowLeftIcon,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Download,
    EyeIcon,
    EyeOffIcon,
    FileText,
    FolderIcon,
    GraduationCap,
    Share2Icon,
    Sparkles,
    User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import PersonalInfoForm from "../components/Forms/PersonalInfoForm";
import ResumePreview from "../components/ResumePreview";
import TemplateSelector from "../components/TemplateSelector";
import ColorPicker from "../components/ColorPicker";
import ProfessionalSummaryForm from "../components/Forms/ProfessionalSummaryForm";
import ExperienceForm from "../components/Forms/ExperienceForm";
import EducationForm from "../components/Forms/EducationForm";
import ProjectForm from "../components/Forms/ProjectForm";
import SkillsForm from "../components/Forms/SkillsForm";

import api from "../configs/api";
import toast from "react-hot-toast";

const ResumeBuilder = () => {
    const { resumeId } = useParams();
    const { token } = useSelector((state) => state.auth);

    const [resumeData, setResumeData] = useState({
        _id: "",
        title: "",
        personal_info: {},
        experience: [],
        education: [],
        projects: [],
        skills: [],
        template: "classic",
        accent_color: "#3B82F6",
        public: false,
    });

    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [removeBackground, setRemoveBackground] =
        useState(false);

    const sections = [
        {
            id: "personal",
            name: "Personal Info",
            icon: User,
        },
        {
            id: "summary",
            name: "Summary",
            icon: FileText,
        },
        {
            id: "experience",
            name: "Experience",
            icon: Briefcase,
        },
        {
            id: "education",
            name: "Education",
            icon: GraduationCap,
        },
        {
            id: "project",
            name: "project",
            icon: FolderIcon,
        },
        {
            id: "skills",
            name: "Skills",
            icon: Sparkles,
        },
    ];

    const activeSection = sections[activeSectionIndex];

    // =========================================================
    // Load Existing Resume
    // =========================================================

    const loadExistingResume = async () => {
        try {
            const { data } = await api.get(
                `/api/resumes/get/${resumeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (data.resume) {
                const serverResume = data.resume;

                setResumeData({
                    ...serverResume,

                    experience:
                        serverResume.experience || [],

                    education:
                        serverResume.education || [],

                    projects:
                        serverResume.projects ||
                        serverResume.project ||
                        [],

                    skills:
                        serverResume.skills || [],

                    personal_info:
                        serverResume.personal_info || {},

                    template:
                        serverResume.template ||
                        "classic",

                    accent_color:
                        serverResume.accent_color ||
                        "#3B82F6",

                    public:
                        serverResume.public || false,
                });

                document.title =
                    serverResume.title || "CuratoCV";
            }
        } catch (error) {
            console.error(
                "Error loading resume:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                    "Failed to load resume."
            );
        }
    };

    useEffect(() => {
        if (resumeId && token) {
            loadExistingResume();
        }
    }, [resumeId, token]);

    // =========================================================
    // Change Resume Visibility
    // =========================================================

    const changeResumeVisibility = async () => {
        try {
            const formData = new FormData();

            formData.append(
                "resumeData",
                JSON.stringify({
                    public: !resumeData.public,
                })
            );

            const { data } = await api.put(
                `/api/resumes/update/${resumeId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!data?.resume) {
                throw new Error(
                    "Resume was not returned by the server."
                );
            }

            setResumeData((prev) => ({
                ...prev,
                ...data.resume,
                personal_info: {
                    ...prev.personal_info,
                    ...(data.resume.personal_info ||
                        {}),
                },
            }));

            toast.success(
                data.message ||
                    "Resume visibility updated successfully."
            );
        } catch (error) {
            console.error(
                "Error updating resume visibility:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to update resume visibility."
            );
        }
    };

    // =========================================================
    // Save Resume
    // =========================================================

    const saveResume = async () => {
        /*
         * Create a clean copy of resumeData.
         *
         * Important:
         * The selected File must NOT be placed inside
         * resumeData JSON. It must be sent separately
         * through FormData.
         */
        const updatedResumeData =
            structuredClone(resumeData);

        const selectedImage =
            resumeData?.personal_info?.image;

        /*
         * Remove the File object from resumeData before
         * JSON.stringify().
         */
        if (
            updatedResumeData.personal_info &&
            typeof updatedResumeData.personal_info
                .image === "object"
        ) {
            delete updatedResumeData.personal_info.image;
        }

        const formData = new FormData();

        // Resume JSON
        formData.append(
            "resumeData",
            JSON.stringify(updatedResumeData)
        );

        // Always send the current state
        formData.append(
            "removeBackground",
            removeBackground
                ? "true"
                : "false"
        );

        /*
         * Send the new image separately.
         */
        if (selectedImage instanceof File) {
            formData.append(
                "image",
                selectedImage
            );
        }

        const { data } = await api.put(
            `/api/resumes/update/${resumeId}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!data?.resume) {
            throw new Error(
                "Resume was not returned by the server."
            );
        }

        const serverResume = data.resume;

        /*
         * IMPORTANT:
         *
         * The server is the source of truth.
         *
         * Replace the local image/File with the
         * ImageKit URL returned by the server.
         */
        setResumeData((prev) => ({
            ...prev,
            ...serverResume,

            personal_info: {
                ...prev.personal_info,
                ...(serverResume.personal_info ||
                    {}),
            },
        }));

        /*
         * The File has now been uploaded.
         * The resume should use the server URL.
         */
        setRemoveBackground(false);

        /*
         * Return message for toast.promise().
         */
        return (
            data.message ||
            "Resume saved successfully!"
        );
    };

    // =========================================================
    // Share Resume
    // =========================================================

    const handleShare = async () => {
        const frontendUrl =
            window.location.href.split(
                "/app"
            )[0];

        const params = new URLSearchParams({
            template:
                resumeData.template ||
                "classic",

            accent_color:
                resumeData.accent_color ||
                "#3B82F6",
        });

        const resumeUrl =
            `${frontendUrl}/view/${resumeId}?${params.toString()}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "My Resume",
                    url: resumeUrl,
                });
            } catch (error) {
                if (
                    error.name !==
                    "AbortError"
                ) {
                    console.error(
                        "Error sharing resume:",
                        error
                    );
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(
                    resumeUrl
                );

                toast.success(
                    "Resume link copied to clipboard!"
                );
            } catch (error) {
                console.error(
                    "Failed to copy resume link:",
                    error
                );

                toast.error(
                    "Unable to copy the resume link."
                );
            }
        }
    };

    // =========================================================
    // Download Resume
    // =========================================================

    const downloadResume = () => {
        window.print();
    };

    // =========================================================
    // Render
    // =========================================================

    return (
        <div>
            {/* =================================================
                Back Navigation
            ================================================== */}

            <div className="max-w-7xl mx-auto px-4 py-6">
                <Link
                    to="/app"
                    className="inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all"
                >
                    <ArrowLeftIcon className="size-4" />

                    Back to Dashboard
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-8">
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* =================================================
                        LEFT PANEL
                    ================================================== */}

                    <div className="relative lg:col-span-5 rounded-lg overflow-hidden">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 pt-1">

                            {/* Progress Bar */}

                            <hr className="absolute top-0 left-0 right-0 border-2 border-gray-200" />

                            <hr
                                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 border-none transition-all duration-2000"
                                style={{
                                    width: `${
                                        (activeSectionIndex *
                                            100) /
                                        (sections.length -
                                            1)
                                    }%`,
                                }}
                            />

                            {/* =================================================
                                Section Navigation
                            ================================================== */}

                            <div className="flex justify-between items-center mb-6 border-b border-gray-300 py-1">

                                {/* Template + Color */}

                                <div className="flex items-center gap-2">
                                    <TemplateSelector
                                        selectedTemplate={
                                            resumeData.template
                                        }
                                        onChange={(
                                            template
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    template,
                                                })
                                            )
                                        }
                                    />

                                    <ColorPicker
                                        selectedColor={
                                            resumeData.accent_color
                                        }
                                        onChange={(
                                            color
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    accent_color:
                                                        color,
                                                })
                                            )
                                        }
                                    />
                                </div>

                                {/* Previous / Next */}

                                <div className="flex items-center">

                                    {activeSectionIndex !==
                                        0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveSectionIndex(
                                                    (
                                                        prevIndex
                                                    ) =>
                                                        Math.max(
                                                            prevIndex -
                                                                1,
                                                            0
                                                        )
                                                )
                                            }
                                            className="flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                                        >
                                            <ChevronLeft className="size-4" />

                                            Previous
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveSectionIndex(
                                                (
                                                    prevIndex
                                                ) =>
                                                    Math.min(
                                                        prevIndex +
                                                            1,
                                                        sections.length -
                                                            1
                                                    )
                                            )
                                        }
                                        className={`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-900 transition-all ${
                                            activeSectionIndex ===
                                            sections.length -
                                                1
                                                ? "opacity-50"
                                                : ""
                                        }`}
                                        disabled={
                                            activeSectionIndex ===
                                            sections.length -
                                                1
                                        }
                                    >
                                        Next

                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>

                            {/* =================================================
                                FORM CONTENT
                            ================================================== */}

                            <div className="space-y-6">

                                {/* Personal */}

                                {activeSection.id ===
                                    "personal" && (
                                    <PersonalInfoForm
                                        data={
                                            resumeData.personal_info
                                        }
                                        onChange={(
                                            data
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    personal_info:
                                                        data,
                                                })
                                            )
                                        }
                                        removeBackground={
                                            removeBackground
                                        }
                                        setRemoveBackground={
                                            setRemoveBackground
                                        }
                                    />
                                )}

                                {/* Summary */}

                                {activeSection.id ===
                                    "summary" && (
                                    <ProfessionalSummaryForm
                                        data={
                                            resumeData.professional_summary
                                        }
                                        onChange={(
                                            data
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    professional_summary:
                                                        data,
                                                })
                                            )
                                        }
                                        setResumeData={
                                            setResumeData
                                        }
                                    />
                                )}

                                {/* Experience */}

                                {activeSection.id ===
                                    "experience" && (
                                    <ExperienceForm
                                        data={
                                            resumeData.experience ||
                                            []
                                        }
                                        onChange={(
                                            data
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    experience:
                                                        data,
                                                })
                                            )
                                        }
                                        setResumeData={
                                            setResumeData
                                        }
                                    />
                                )}

                                {/* Education */}

                                {activeSection.id ===
                                    "education" && (
                                    <EducationForm
                                        data={
                                            resumeData.education ||
                                            []
                                        }
                                        onChange={(
                                            data
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    education:
                                                        data,
                                                })
                                            )
                                        }
                                        setResumeData={
                                            setResumeData
                                        }
                                    />
                                )}

                                {/* Projects */}

                                {activeSection.id ===
                                    "project" && (
                                    <ProjectForm
                                        data={
                                            resumeData.projects ||
                                            []
                                        }
                                        onChange={(
                                            data
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    projects:
                                                        data,
                                                })
                                            )
                                        }
                                        setResumeData={
                                            setResumeData
                                        }
                                    />
                                )}

                                {/* Skills */}

                                {activeSection.id ===
                                    "skills" && (
                                    <SkillsForm
                                        data={
                                            resumeData.skills ||
                                            []
                                        }
                                        onChange={(
                                            data
                                        ) =>
                                            setResumeData(
                                                (prev) => ({
                                                    ...prev,
                                                    skills: data,
                                                })
                                            )
                                        }
                                        setResumeData={
                                            setResumeData
                                        }
                                    />
                                )}
                            </div>

                            {/* =================================================
                                SAVE
                            ================================================== */}

                            <button
                                type="button"
                                onClick={() =>
                                    toast.promise(
                                        saveResume(),
                                        {
                                            loading:
                                                "Saving changes...",

                                            success: (
                                                message
                                            ) =>
                                                message ||
                                                "Resume saved successfully!",

                                            error: (
                                                error
                                            ) =>
                                                error
                                                    ?.response
                                                    ?.data
                                                    ?.message ||
                                                error?.message ||
                                                "Failed to save resume.",
                                        }
                                    )
                                }
                                className="bg-gradient-to-br from-blue-100 to-blue-200 ring-blue-300 text-blue-600 ring hover:ring-blue-400 transition-all rounded-md px-6 py-2 mt-6 text-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* =================================================
                        RIGHT PANEL
                    ================================================== */}

                    <div className="lg:col-span-7 max-lg:mt-6">

                        <div className="relative w-full">
                            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-end gap-2">

                                {/* Share */}

                                {resumeData.public && (
                                    <button
                                        type="button"
                                        onClick={
                                            handleShare
                                        }
                                        className="flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-lg ring-blue-300 hover:ring transition-colors"
                                    >
                                        <Share2Icon className="size-4" />

                                        Share
                                    </button>
                                )}

                                {/* Visibility */}

                                <button
                                    type="button"
                                    onClick={
                                        changeResumeVisibility
                                    }
                                    className="flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 ring-purple-300 rounded-lg hover:ring transition-colors"
                                >
                                    {resumeData.public ? (
                                        <EyeIcon className="size-4" />
                                    ) : (
                                        <EyeOffIcon className="size-4" />
                                    )}

                                    {resumeData.public
                                        ? "Public"
                                        : "Private"}
                                </button>

                                {/* Download */}

                                <button
                                    type="button"
                                    onClick={
                                        downloadResume
                                    }
                                    className="flex items-center gap-2 px-6 py-2 text-xs bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-lg ring-green-300 hover:ring transition-colors"
                                >
                                    <Download className="size-4" />

                                    Download
                                </button>
                            </div>
                        </div>

                        {/* =================================================
                            RESUME PREVIEW

                            The key fix:
                            Force ResumePreview to remount whenever
                            the server returns a different image URL.
                        ================================================== */}

                        <ResumePreview
                            key={
                                resumeData?.personal_info
                                    ?.image ||
                                "resume-preview"
                            }
                            data={resumeData}
                            template={
                                resumeData.template
                            }
                            accentColor={
                                resumeData.accent_color
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;