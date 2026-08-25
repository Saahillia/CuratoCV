import {
    Briefcase,
    Mail,
    MapPin,
    Phone,
    User,
    Globe2,
    ImagePlus,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const PersonalInfoForm = ({
    data,
    onChange,
    removeBackground,
    setRemoveBackground,
}) => {
    const [previewUrl, setPreviewUrl] = useState("");

    const handleChange = (field, value) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    // Create a safe preview URL for newly selected images
    useEffect(() => {
        if (!data?.image) {
            setPreviewUrl("");
            return;
        }

        // Existing ImageKit URL
        if (typeof data.image === "string") {
            setPreviewUrl(data.image);
            return;
        }

        // Newly selected local image
        if (data.image instanceof File) {
            const objectUrl = URL.createObjectURL(data.image);

            setPreviewUrl(objectUrl);

            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        }

        setPreviewUrl("");
    }, [data?.image]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Please select a JPG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            alert("Image size must be less than 5 MB.");
            event.target.value = "";
            return;
        }

        // New image selected
        handleChange("image", file);

        // Reset background removal for every newly selected image
        setRemoveBackground(false);

        // Allow selecting the same image again
        event.target.value = "";
    };

    const fields = [
        {
            key: "full_name",
            label: "Full Name",
            icon: User,
            type: "text",
            required: true,
        },
        {
            key: "email",
            label: "Email Address",
            icon: Mail,
            type: "email",
            required: true,
        },
        {
            key: "phone",
            label: "Phone Number",
            icon: Phone,
            type: "tel",
        },
        {
            key: "location",
            label: "Location",
            icon: MapPin,
            type: "text",
        },
        {
            key: "profession",
            label: "Profession",
            icon: Briefcase,
            type: "text",
        },
        {
            key: "linkedin",
            label: "LinkedIn Profile",
            icon: ({ className }) => (
                <svg
                    className={className}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM3.54 20.45h3.56V8.99H3.54v11.46Z" />
                </svg>
            ),
            type: "url",
        },
        {
            key: "website",
            label: "Personal Website",
            icon: Globe2,
            type: "url",
        },
    ];

    return (
        <div>
            {/* Header */}
            <h3 className="text-lg font-semibold text-slate-900">
                Personal Information
            </h3>

            <p className="text-sm text-slate-500">
                Add the personal details you want to include on your resume.
            </p>

            {/* =====================================================
                PROFILE IMAGE
            ====================================================== */}
            <div className="mt-6 flex flex-wrap items-center gap-5">
                {/* Image */}
                <div className="relative group">
                    <label
                        htmlFor="profile-image"
                        className="block cursor-pointer"
                    >
                        {previewUrl ? (
                            <div className="relative">
                                <img
                                    src={previewUrl}
                                    alt="Profile"
                                    className="h-20 w-20 rounded-full object-cover ring-2 ring-[#B8CADB] transition-opacity duration-200 group-hover:opacity-70"
                                />

                                {/* Change overlay */}
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#17375F]/75 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <div className="flex flex-col items-center text-white">
                                        <ImagePlus className="size-5" />

                                        <span className="mt-1 text-[10px] font-semibold">
                                            Change
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#B8CADB] bg-[#F3F7FA] text-[#17375F] transition-all duration-200 hover:border-[#17375F] hover:bg-[#E8F0F7]">
                                <div className="flex flex-col items-center">
                                    <ImagePlus className="size-7" />

                                    <span className="mt-1 text-[9px] font-semibold">
                                        Upload
                                    </span>
                                </div>
                            </div>
                        )}
                    </label>

                    <input
                        id="profile-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                </div>

                {/* Image information */}
                <div className="min-w-[180px]">
                    <p className="text-sm font-semibold text-slate-700">
                        Profile photo
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Use a clear professional photo.
                        <br />
                        JPG, PNG or WebP · Max 5 MB
                    </p>

                    <label
                        htmlFor="profile-image"
                        className="mt-2 inline-block cursor-pointer text-xs font-semibold text-[#17375F] transition hover:text-[#24527A]"
                    >
                        {data?.image
                            ? "Change image"
                            : "Upload image"}
                    </label>
                </div>

                {/* =================================================
                    REMOVE BACKGROUND TOGGLE
                ================================================== */}
                {data?.image instanceof File && (
                    <div className="ml-0 flex flex-col gap-2 sm:ml-3">
                        <p className="text-xs font-semibold text-slate-700">
                            Remove Background
                        </p>

                        <label className="relative inline-flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={Boolean(removeBackground)}
                                onChange={(event) =>
                                    setRemoveBackground(
                                        event.target.checked
                                    )
                                }
                            />

                            {/* Toggle track */}
                            <div className="h-5 w-9 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-[#17375F]" />

                            {/* Toggle circle */}
                            <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4" />

                            <span className="text-xs text-slate-500">
                                {removeBackground
                                    ? "Enabled"
                                    : "Disabled"}
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* =====================================================
                PERSONAL INFORMATION FIELDS
            ====================================================== */}
            {fields.map((field) => {
                const Icon = field.icon;

                return (
                    <div
                        key={field.key}
                        className="mt-5 space-y-1"
                    >
                        <label
                            htmlFor={`personal-${field.key}`}
                            className="flex items-center gap-2 text-sm font-medium text-slate-600"
                        >
                            <Icon className="size-4 text-[#17375F]" />

                            {field.label}

                            {field.required && (
                                <span className="text-red-500">
                                    *
                                </span>
                            )}
                        </label>

                        <input
                            id={`personal-${field.key}`}
                            type={field.type}
                            value={data?.[field.key] || ""}
                            onChange={(event) =>
                                handleChange(
                                    field.key,
                                    event.target.value
                                )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#17375F] focus:ring-4 focus:ring-[#17375F]/10"
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                            required={field.required}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default PersonalInfoForm;