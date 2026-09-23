import React, { useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    ImagePlus,
    Loader2,
    Sparkles,
    Pencil,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";
import { useSelector } from "react-redux";
import api from "../../services/api";
import toast from "react-hot-toast";

const PersonalInfoEditor = ({
    resumeData,
    setResumeData,
    removeBackground,
    setRemoveBackground,
    accentColor,
}) => {
    const { token } = useSelector((state) => state.auth);
    const [isUploading, setIsUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const personalInfo =
        resumeData?.personalInfo || resumeData?.personal_info || {};
    const photoUrl =
        typeof personalInfo?.photo === "string"
            ? personalInfo.photo
            : personalInfo?.photo?.url;

    const handleChange = (field, value) => {
        setResumeData((prev) => {
            const prevPI = prev.personalInfo || prev.personal_info || {};
            return {
                ...prev,
                personalInfo: {
                    ...prevPI,
                    [field]: value,
                },
            };
        });
    };

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please select a JPG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("Image size must be less than 5 MB.");
            event.target.value = "";
            return;
        }

        const currentResumeId = resumeData?._id || resumeData?.id || "";
        if (!currentResumeId || currentResumeId === "undefined") {
            toast.error("Resume ID is missing. Please refresh the page.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append(
                "removeBackground",
                removeBackground ? "true" : "false",
            );

            // Sanitize resumeData for JSON stringification (remove File instances)
            const sanitizedResumeData = JSON.parse(JSON.stringify(resumeData));
            if (
                sanitizedResumeData.personalInfo &&
                sanitizedResumeData.personalInfo.photo instanceof File
            ) {
                sanitizedResumeData.personalInfo.photo = "";
            }

            formData.append("resumeData", JSON.stringify(sanitizedResumeData));

            const { data } = await api.put(
                `/resumes/update/${currentResumeId}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            const updated = data?.data?.resume || data?.resume;
            if (updated?.personalInfo?.photo) {
                setResumeData((prev) => ({
                    ...prev,
                    personalInfo: {
                        ...(prev.personalInfo || {}),
                        photo: updated.personalInfo.photo,
                    },
                }));
                toast.success("Profile photo uploaded successfully!");
            }
        } catch (error) {
            console.error("Image upload error:", error);
            toast.error(
                error?.response?.data?.error?.message ||
                    "Failed to upload photo.",
            );
        } finally {
            setIsUploading(false);
            event.target.value = "";
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
            <div className="flex items-center justify-between gap-4 px-4 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Profile
                        </p>
                        <h3 className="text-base font-bold text-slate-900">
                            Personal Information
                        </h3>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen((previous) => !previous)}
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors ${
                        isOpen
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "bg-[#17375F] hover:bg-[#24527A]"
                    }`}
                    title={isOpen ? "Close profile editor" : "Edit profile"}
                    aria-label={
                        isOpen ? "Close profile editor" : "Edit profile"
                    }
                >
                    {isOpen ? (
                        <ChevronDown className="size-4" />
                    ) : (
                        <Pencil className="size-4" />
                    )}
                </button>
            </div>

            {!isOpen && (
                <div className="flex items-center gap-4 px-4 py-4">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt="Profile"
                            className="size-16 shrink-0 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                    ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                            <ImagePlus className="size-6" />
                        </div>
                    )}
                    <div className="min-w-0 space-y-1.5">
                        <p className="truncate text-base font-bold text-slate-900">
                            {personalInfo?.fullName ||
                                personalInfo?.full_name ||
                                "Your Name"}
                        </p>
                        {personalInfo?.email && (
                            <p className="flex items-center gap-2 truncate text-xs text-slate-500">
                                <Mail className="size-3.5 shrink-0" />{" "}
                                {personalInfo.email}
                            </p>
                        )}
                        {personalInfo?.phone && (
                            <p className="flex items-center gap-2 text-xs text-slate-500">
                                <Phone className="size-3.5 shrink-0" />{" "}
                                {personalInfo.phone}
                            </p>
                        )}
                        {personalInfo?.location && (
                            <p className="flex items-center gap-2 truncate text-xs text-slate-500">
                                <MapPin className="size-3.5 shrink-0" />{" "}
                                {personalInfo.location}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="p-4 space-y-5">
                    {/* ================= PROFILE PHOTO ================= */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-gray-100">
                        <div className="relative group">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt="Profile"
                                    className="h-28 w-28 rounded-full object-cover ring-4 ring-blue-50 border border-slate-200 shadow-sm"
                                    style={{ backgroundColor: accentColor }}
                                />
                            ) : (
                                <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                                    <ImagePlus className="size-8 stroke-1" />
                                </div>
                            )}

                            {isUploading && (
                                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-full flex items-center justify-center">
                                    <Loader2 className="size-6 text-blue-600 animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() =>
                                        document
                                            .getElementById(
                                                "profile-image-input",
                                            )
                                            ?.click()
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                                >
                                    <ImagePlus className="size-4" />
                                    {photoUrl ? "Change Photo" : "Upload Photo"}
                                </button>

                                {photoUrl && (
                                    <button
                                        type="button"
                                        disabled={isUploading}
                                        onClick={() =>
                                            handleChange("photo", {
                                                url: "",
                                                fileId: "",
                                            })
                                        }
                                        className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-slate-400">
                                Recommended: Square JPG, PNG, or WebP. Max 5MB.
                            </p>

                            {/* Remove Background Feature (Toggle Switch) */}
                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={Boolean(removeBackground)}
                                    onClick={() =>
                                        setRemoveBackground(!removeBackground)
                                    }
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                        removeBackground
                                            ? "bg-purple-600"
                                            : "bg-slate-200"
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            removeBackground
                                                ? "translate-x-4"
                                                : "translate-x-0"
                                        }`}
                                    />
                                </button>
                                <span
                                    onClick={() =>
                                        setRemoveBackground(!removeBackground)
                                    }
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none"
                                >
                                    <Sparkles className="size-3.5 text-purple-500" />
                                    Auto-remove background on upload
                                </span>
                            </div>

                            <input
                                id="profile-image-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    {/* ================= FORM FIELDS ================= */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={
                                    personalInfo?.fullName ||
                                    personalInfo?.full_name ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleChange("fullName", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="e.g. Jane Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                Job Title / Profession
                            </label>
                            <input
                                type="text"
                                value={personalInfo?.profession || ""}
                                onChange={(e) =>
                                    handleChange("profession", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="e.g. Senior Fullstack Engineer"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={personalInfo?.email || ""}
                                onChange={(e) =>
                                    handleChange("email", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="jane@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={personalInfo?.phone || ""}
                                onChange={(e) =>
                                    handleChange("phone", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                Location
                            </label>
                            <input
                                type="text"
                                value={personalInfo?.location || ""}
                                onChange={(e) =>
                                    handleChange("location", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="San Francisco, CA"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                LinkedIn Profile
                            </label>
                            <input
                                type="url"
                                value={personalInfo?.linkedin || ""}
                                onChange={(e) =>
                                    handleChange("linkedin", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="https://linkedin.com/in/janedoe"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                Website / Portfolio
                            </label>
                            <input
                                type="url"
                                value={personalInfo?.website || ""}
                                onChange={(e) =>
                                    handleChange("website", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="https://janedoe.dev"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                GitHub Profile
                            </label>
                            <input
                                type="url"
                                value={personalInfo?.github || ""}
                                onChange={(e) =>
                                    handleChange("github", e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="https://github.com/janedoe"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalInfoEditor;
