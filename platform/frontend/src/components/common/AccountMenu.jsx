/**
 * Shared signed-in account menu for profile, billing, and logout navigation.
 * Identity and logout are Platform-owned; consuming products provide no duplicate account state.
 */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { logout } from "@curatocv/platform-frontend/features/authSlice";

const AccountMenu = () => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const rootRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const displayName = user?.name?.trim() || "Account";
    const initials = displayName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setIsOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleLogout = () => {
        dispatch(logout());
        setIsOpen(false);
        navigate("/login", { replace: true });
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls="curatocv-account-menu"
                className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-slate-700 transition hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 sm:gap-2.5 sm:px-3"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white" aria-hidden="true">
                    {initials || <UserRound size={15} />}
                </span>
                <span className="hidden max-w-28 truncate text-left text-xs font-semibold sm:block">{displayName}</span>
                <ChevronDown aria-hidden="true" size={14} className="text-slate-500" />
            </button>

            {isOpen && (
                <div
                    id="curatocv-account-menu"
                    role="menu"
                    aria-label="Account options"
                    className="absolute right-0 z-50 mt-2 w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                >
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                        {user?.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
                    </div>
                    <Link
                        role="menuitem"
                        to="/app/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex min-h-10 items-center gap-2 px-4 text-sm text-slate-700 hover:bg-brand-50"
                    >
                        <UserRound aria-hidden="true" size={16} /> Profile &amp; settings
                    </Link>
                    <Link
                        role="menuitem"
                        to="/app/billing"
                        onClick={() => setIsOpen(false)}
                        className="flex min-h-10 items-center gap-2 px-4 text-sm text-slate-700 hover:bg-brand-50"
                    >
                        <Settings aria-hidden="true" size={16} /> Billing
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex min-h-10 w-full items-center gap-2 px-4 text-left text-sm text-red-700 hover:bg-red-50"
                    >
                        <LogOut aria-hidden="true" size={16} /> Log out
                    </button>
                </div>
            )}
        </div>
    );
};

export default AccountMenu;
