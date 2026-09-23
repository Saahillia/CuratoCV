import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Lock,
    CheckCircle2,
    Calendar,
    ShieldCheck,
    ShieldAlert,
    Trash2,
    Loader2,
    AlertTriangle,
    ArrowRight,
    X,
    Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import authService from "../services/authService";
import { updateUser, logout } from "../app/features/authSlice";
import Breadcrumbs from "../components/Common/Breadcrumbs";

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user: authUser } = useSelector((state) => state.auth);

    // =========================================================================
    // Profile state
    // =========================================================================

    const [profile, setProfile] = useState(null);
    const [name, setName] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const nameInputRef = useRef(null);

    // =========================================================================
    // Delete account state
    // =========================================================================

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // =========================================================================
    // Fetch canonical profile
    // =========================================================================

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setFormError("");

        try {
            const response = await authService.getCurrentUser();
            const userData = response?.data;

            if (!userData) {
                throw new Error("Unable to load your account details.");
            }

            setProfile(userData);
            setName(userData.name || "");
            setIsEditingName(false);

            // Server response is authoritative.
            dispatch(updateUser(userData));
        } catch (error) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load profile details.";

            setFormError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // =========================================================================
    // Start editing
    // =========================================================================

    const handleStartEditing = () => {
        setFormError("");
        setName(profile?.name || "");
        setIsEditingName(true);

        requestAnimationFrame(() => {
            nameInputRef.current?.focus();
        });
    };

    // =========================================================================
    // Cancel editing
    // =========================================================================

    const handleCancelEditing = () => {
        setName(profile?.name || "");
        setFormError("");
        setIsEditingName(false);
    };

    // =========================================================================
    // Update profile
    // =========================================================================

    const handleUpdateProfile = async (event) => {
        event.preventDefault();
        setFormError("");

        const trimmedName = name.trim();
        const currentName = (profile?.name || "").trim();

        if (!trimmedName) {
            setFormError("Name cannot be empty.");
            return;
        }

        if (trimmedName.length > 100) {
            setFormError("Name cannot exceed 100 characters.");
            return;
        }

        // If nothing changed, simply leave edit mode.
        // No API request is necessary.
        if (trimmedName === currentName) {
            setIsEditingName(false);
            return;
        }

        setIsSaving(true);

        try {
            const response = await authService.updateCurrentUser({
                name: trimmedName,
            });

            const updatedUser = response?.data;

            if (!updatedUser) {
                throw new Error(
                    "The server returned an invalid profile response."
                );
            }

            // Server response becomes the canonical local state.
            setProfile(updatedUser);
            setName(updatedUser.name || "");
            setIsEditingName(false);

            // Synchronize Redux.
            dispatch(updateUser(updatedUser));

            toast.success("Profile updated successfully.");
        } catch (error) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update profile.";

            setFormError(message);
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    // =========================================================================
    // Delete account
    // =========================================================================

    const handleDeleteAccount = async (event) => {
        event.preventDefault();

        if (confirmText.trim() !== "DELETE") {
            toast.error("Please type DELETE to confirm account deletion.");
            return;
        }

        setIsDeleting(true);

        try {
            const { data } = await api.delete("/users/account");

            toast.success(
                data?.message ||
                    "Your account and all associated data have been permanently deleted.",
                {
                    duration: 5000,
                }
            );

            dispatch(logout());

            setShowDeleteModal(false);
            setConfirmText("");

            navigate("/login", { replace: true });
        } catch (error) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete account. Please try again.";

            toast.error(message);
            setIsDeleting(false);
        }
    };

    // =========================================================================
    // Display values
    // =========================================================================

    const displayName =
        profile?.name?.trim() ||
        authUser?.name?.trim() ||
        "Account";

    const displayEmail =
        profile?.email?.trim() ||
        authUser?.email?.trim() ||
        "";

    const isEmailVerified = Boolean(
        profile?.emailVerified ?? authUser?.emailVerified
    );

    const userInitials =
        displayName
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase() || "CV";

    const memberSinceDate = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "N/A";

    // =========================================================================
    // Loading state
    // =========================================================================

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#F7FAFC] py-6 sm:py-8">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs />

                    <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-[#D9E7F2] bg-white shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F0F7]">
                                <Loader2 className="size-5 animate-spin text-[#17375F]" />
                            </div>

                            <p className="mt-3 text-sm font-semibold text-[#102A43]">
                                Loading profile
                            </p>

                            <p className="mt-1 text-xs text-[#627D98]">
                                Please wait while we load your account.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#F7FAFC] py-6 sm:py-8">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                {/* =================================================================
                    Breadcrumbs
                ================================================================= */}

                <Breadcrumbs />

                {/* =================================================================
                    Page heading
                ================================================================= */}

                <header className="mb-6 mt-5">
                    <h1 className="text-2xl font-bold tracking-tight text-[#102A43] sm:text-3xl">
                        Profile
                    </h1>

                    <p className="mt-1 text-sm text-[#486581] sm:text-base">
                        Manage your personal information and account details.
                    </p>
                </header>

                {/* =================================================================
                    Profile identity
                ================================================================= */}

                <section className="mb-6 rounded-2xl border border-[#D9E7F2] bg-white shadow-sm">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        {/* Identity */}

                        <div className="flex min-w-0 items-center gap-4">
                            {/* Avatar */}

                            <div
                                className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#17375F] via-[#24527A] to-[#0353A4] shadow-md shadow-[#17375F]/15 sm:size-[72px]"
                                aria-hidden="true"
                            >
                                <span className="text-xl font-bold tracking-wide text-white sm:text-2xl">
                                    {userInitials}
                                </span>
                            </div>

                            {/* Identity information */}

                            <div className="min-w-0">
                                <h2 className="truncate text-xl font-bold leading-tight tracking-tight text-[#102A43] sm:text-2xl">
                                    {displayName}
                                </h2>

                                {displayEmail && (
                                    <div className="mt-2 flex min-w-0 items-center gap-2">
                                        <Mail
                                            className="size-4 shrink-0 text-[#486581]"
                                            aria-hidden="true"
                                        />

                                        <span
                                            className="truncate text-sm text-[#486581] sm:text-base"
                                            title={displayEmail}
                                        >
                                            {displayEmail}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-2">
                                    {isEmailVerified ? (
                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#16803A]">
                                            <CheckCircle2 className="size-4" />
                                            Email verified
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate("/verify-email")
                                            }
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B7791F] transition hover:text-[#8F5E16]"
                                        >
                                            <ShieldAlert className="size-4" />
                                            Email not verified
                                            <ArrowRight className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Member since */}

                        {profile?.createdAt && (
                            <div className="flex shrink-0 items-center gap-3 rounded-xl bg-[#F7FAFC] px-4 py-3 sm:min-w-[190px]">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0F7]">
                                    <Calendar
                                        className="size-5 text-[#17375F]"
                                        aria-hidden="true"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#627D98]">
                                        Member since
                                    </p>

                                    <p className="mt-1 whitespace-nowrap text-sm font-bold text-[#102A43]">
                                        {memberSinceDate}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* =================================================================
                    Email verification notice
                ================================================================= */}

                {!isEmailVerified && (
                    <section className="mb-6 rounded-2xl border border-[#F3C969] bg-[#FFFBEF]">
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5 sm:py-4">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1CC]">
                                    <AlertTriangle className="size-5 text-[#B7791F]" />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-[#7A4D0A] sm:text-base">
                                        Verify your email address
                                    </h2>

                                    <p className="mt-0.5 text-xs text-[#8F5E16] sm:text-sm">
                                        Verify your email to keep your account
                                        secure.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/verify-email")}
                                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#B7791F] px-4 text-xs font-bold text-white transition hover:bg-[#8F5E16] focus:outline-none focus:ring-4 focus:ring-[#B7791F]/15 sm:text-sm"
                            >
                                Verify Email
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </section>
                )}

                {/* =================================================================
                    Personal Information
                ================================================================= */}

                <section className="mb-6 overflow-hidden rounded-2xl border border-[#D9E7F2] bg-white shadow-sm">
                    {/* Header */}

                    <div className="border-b border-[#D9E7F2] px-5 py-5 sm:px-7">
                        <h2 className="text-xl font-bold tracking-tight text-[#102A43]">
                            Personal Information
                        </h2>

                        <p className="mt-1 text-sm text-[#486581]">
                            Update the name associated with your account.
                        </p>
                    </div>

                    {/* Form */}

                    <form
                        onSubmit={handleUpdateProfile}
                        className="p-5 sm:p-7"
                    >
                        {/* Label + Edit */}

                        <div className="mb-2 flex items-center justify-between gap-4">
                            <label
                                htmlFor="profile-name"
                                className="flex items-center gap-2 text-sm font-semibold text-[#102A43]"
                            >
                                <User className="size-4 text-[#486581]" />
                                Full Name
                            </label>

                            {!isEditingName && (
                                <button
                                    type="button"
                                    onClick={handleStartEditing}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0353A4] transition hover:bg-[#E8F0F7] hover:text-[#003559] focus:outline-none focus:ring-2 focus:ring-[#0353A4]/15 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Pencil className="size-3.5" />
                                    Edit
                                </button>
                            )}
                        </div>

                        {/* =================================================================
                            Name field

                            No outer focus border.
                            No absolute-positioned icon.
                            ================================================================= */}

                        <div className="flex min-h-12 w-full items-center rounded-xl bg-[#F7FAFC]">
                            {/* Icon */}

                            <div
                                className="flex w-12 shrink-0 items-center justify-center text-[#486581]"
                                aria-hidden="true"
                            >
                                <User className="size-5" />
                            </div>

                            {/* Input */}

                            <input
                                id="profile-name"
                                name="name"
                                type="text"
                                ref={nameInputRef}
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);

                                    if (formError) {
                                        setFormError("");
                                    }
                                }}
                                placeholder="Enter your full name"
                                maxLength={100}
                                autoComplete="name"
                                disabled={!isEditingName || isSaving}
                                readOnly={!isEditingName}
                                required={isEditingName}
                                className={`min-w-0 flex-1 border-0 bg-transparent px-1 pr-4 outline-none ${
                                    isEditingName
                                        ? "cursor-text text-sm font-semibold text-[#102A43] placeholder:text-[#90A4B8]"
                                        : "cursor-default text-sm font-semibold text-[#102A43]"
                                }`}
                            />
                        </div>

                        {/* Helper text */}

                        <div className="mt-2 flex items-center justify-between gap-4">
                            <p className="text-xs text-[#627D98]">
                                {isEditingName
                                    ? "Update the name displayed on your account."
                                    : "This name is displayed across your profile."}
                            </p>

                            {isEditingName && (
                                <span className="shrink-0 text-xs font-medium text-[#627D98]">
                                    {name.length}/100
                                </span>
                            )}
                        </div>

                        {/* Error */}

                        {formError && (
                            <div
                                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-[#C53030]"
                                role="alert"
                            >
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                                <span>{formError}</span>
                            </div>
                        )}

                        {/* =================================================================
                            Editing actions

                            Save is ALWAYS visibly blue while editing.
                            Only the loading state disables it.
                        ================================================================= */}

                        {isEditingName && (
                            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                {/* Security message */}

                                <div className="flex items-center gap-2 text-xs text-[#627D98]">
                                    <Lock className="size-4 shrink-0 text-[#486581]" />

                                    <span>
                                        Your changes are saved securely.
                                    </span>
                                </div>

                                {/* Actions */}

                                <div className="flex items-center gap-2">
                                    {/* Cancel */}

                                    <button
                                        type="button"
                                        onClick={handleCancelEditing}
                                        disabled={isSaving}
                                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D9E7F2] bg-white px-5 text-sm font-semibold text-[#486581] transition hover:bg-[#F7FAFC] hover:text-[#102A43] focus:outline-none focus:ring-4 focus:ring-[#17375F]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    {/* Save Changes */}

                                    <button
                                        type="button"
                                        onClick={handleCancelEditing}
                                        disabled={isSaving}
                                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D9E7F2] bg-white px-5 text-sm font-semibold text-[#486581] transition hover:bg-[#F7FAFC] hover:text-[#102A43] focus:outline-none focus:ring-4 focus:ring-[#17375F]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </section>

                {/* =================================================================
                    Account Details
                ================================================================= */}

                <section className="mb-6 rounded-2xl border border-[#D9E7F2] bg-white shadow-sm">
                    <div className="border-b border-[#D9E7F2] px-5 py-5 sm:px-7">
                        <h2 className="text-xl font-bold tracking-tight text-[#102A43]">
                            Account Details
                        </h2>

                        <p className="mt-1 text-sm text-[#486581]">
                            Your account email and verification status.
                        </p>
                    </div>

                    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                        {/* Email */}

                        <div className="rounded-xl border border-[#D9E7F2] bg-[#F7FAFC] p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F0FA]">
                                    <Mail className="size-5 text-[#0353A4]" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#627D98]">
                                        Email Address
                                    </p>

                                    <p
                                        className="mt-1 truncate text-sm font-bold text-[#102A43]"
                                        title={displayEmail}
                                    >
                                        {displayEmail || "Not available"}
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-[#627D98]">
                                        Used for login and important
                                        notifications.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Verification */}

                        <div className="rounded-xl border border-[#D9E7F2] bg-[#F7FAFC] p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div
                                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                                        isEmailVerified
                                            ? "bg-emerald-50"
                                            : "bg-[#FFF1CC]"
                                    }`}
                                >
                                    {isEmailVerified ? (
                                        <ShieldCheck className="size-5 text-[#16803A]" />
                                    ) : (
                                        <ShieldAlert className="size-5 text-[#B7791F]" />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#627D98]">
                                        Verification Status
                                    </p>

                                    <p
                                        className={`mt-1 text-sm font-bold ${
                                            isEmailVerified
                                                ? "text-[#16803A]"
                                                : "text-[#B7791F]"
                                        }`}
                                    >
                                        {isEmailVerified
                                            ? "Verified"
                                            : "Not verified"}
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-[#627D98]">
                                        {isEmailVerified
                                            ? "Your email address is verified."
                                            : "Verify your email to keep your account secure."}
                                    </p>

                                    {!isEmailVerified && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate("/verify-email")
                                            }
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#B7791F] hover:text-[#8F5E16]"
                                        >
                                            Verify now
                                            <ArrowRight className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =================================================================
                    Danger Zone
                ================================================================= */}

                <section className="mb-6 rounded-2xl border border-red-200 bg-[#FFF8F8]">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100">
                                <Trash2 className="size-5 text-red-600" />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-red-700">
                                    Danger Zone
                                </h2>

                                <p className="mt-1 max-w-2xl text-sm leading-5 text-[#486581]">
                                    Permanently delete your account and all
                                    associated data. This action cannot be
                                    undone.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setConfirmText("");
                                setShowDeleteModal(true);
                            }}
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500 bg-white px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                        >
                            <Trash2 className="size-4" />
                            Delete Account
                        </button>
                    </div>
                </section>

                {/* =================================================================
                    Delete Account Modal
                ================================================================= */}

                {showDeleteModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
                        role="presentation"
                        onMouseDown={() => {
                            if (!isDeleting) {
                                setShowDeleteModal(false);
                                setConfirmText("");
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="delete-account-title"
                            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            {/* Close */}

                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setConfirmText("");
                                }}
                                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close delete account dialog"
                            >
                                <X className="size-5" />
                            </button>

                            {/* Heading */}

                            <div className="flex items-start gap-3 pr-8">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                                    <AlertTriangle className="size-5 text-red-600" />
                                </div>

                                <div>
                                    <h2
                                        id="delete-account-title"
                                        className="text-lg font-bold text-[#102A43]"
                                    >
                                        Delete Account
                                    </h2>

                                    <p className="mt-1 text-xs text-[#627D98]">
                                        This action is permanent.
                                    </p>
                                </div>
                            </div>

                            {/* Warning */}

                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                                <p className="text-sm font-semibold text-red-800">
                                    Deleting your account is permanent and
                                    cannot be undone.
                                </p>

                                <ul className="mt-3 space-y-2 pl-4 text-xs leading-5 text-red-900">
                                    <li className="list-disc">
                                        <strong>Permanent Data Loss:</strong>{" "}
                                        Your user data, resumes, and profile
                                        details will be permanently deleted.
                                    </li>

                                    <li className="list-disc">
                                        <strong>Subscriptions:</strong> Active
                                        access associated with this account
                                        will be terminated.
                                    </li>

                                    <li className="list-disc">
                                        <strong>No Recovery:</strong> The
                                        account and its data cannot be restored
                                        after deletion.
                                    </li>
                                </ul>
                            </div>

                            {/* Confirmation */}

                            <form
                                onSubmit={handleDeleteAccount}
                                className="mt-5"
                            >
                                <label
                                    htmlFor="delete-confirmation"
                                    className="mb-2 block text-sm font-semibold text-[#102A43]"
                                >
                                    Type{" "}
                                    <span className="font-bold text-red-600">
                                        DELETE
                                    </span>{" "}
                                    to confirm
                                </label>

                                <input
                                    id="delete-confirmation"
                                    name="deleteConfirmation"
                                    type="text"
                                    value={confirmText}
                                    onChange={(event) =>
                                        setConfirmText(event.target.value)
                                    }
                                    placeholder="DELETE"
                                    disabled={isDeleting}
                                    autoComplete="off"
                                    autoFocus
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />

                                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    {/* Cancel */}

                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setConfirmText("");
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    {/* Delete */}

                                    <button
                                        type="submit"
                                        disabled={
                                            isDeleting ||
                                            confirmText.trim() !== "DELETE"
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="size-4" />
                                                Permanently Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Profile;