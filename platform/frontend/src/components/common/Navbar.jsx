import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../app/features/authSlice.js";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutUser = () => {
    navigate("/");
    dispatch(logout());
    toast.success("Logging out successfully!", { duration: 3000 });
    setMobileMenuOpen(false);
  };

  return (
    <div className="shadow bg-white">
      <nav className="flex items-center justify-between max-w-7xl mx-auto px-4 py-3.5 text-slate-800 transition-all">
        <Link to="/">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="CuratoCV logo" className="h-12 w-auto sm:h-12 h-9" />
            <img src="/brand.svg"alt="CuratoCV wordmark" className="h-10 w-auto sm:h-10 h-7"/>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {/* Desktop / large tablet nav — visible at lg and above */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex size-10 items-center justify-center">
                {/* Organic fluid rotating morphing blob background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#17375F] via-[#24527A] to-[#00BFA6] animate-blob opacity-90 shadow-md" />
                {/* User initials in center */}
                <span className="relative z-10 text-sm font-bold text-white tracking-wider">
                  {user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "CV"}
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-[#17375F] tracking-wide">Hi, {user?.name || "Guest"}</span>
                <span className="text-xs text-slate-400">{new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}</span>
              </div>
            </div>
          </div>
          <Link to="/pricing" className="hover:text-[#17375F] font-medium hidden lg:inline">Pricing</Link>
          <Link to="/billing" className="hover:text-[#17375F] font-medium hidden lg:inline">Billing</Link>
          <Link to="/app/profile" className="hover:text-[#17375F] font-medium hidden lg:inline">Profile</Link>
          <button
            onClick={logoutUser}
            className="bg-white hover:bg-slate-50 border border-gray-300 px-7 py-1.5 rounded-full active:scale-95 transition-all hidden lg:inline-block"
          >
            Logout
          </button>

          {/* Hamburger — visible below lg */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center size-10 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="size-6 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile / Tablet Slide-in Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 right-0 z-[70] h-full w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col lg:hidden animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-9 items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#17375F] via-[#24527A] to-[#00BFA6] rounded-lg opacity-90" />
                  <span className="relative z-10 text-xs font-bold text-white tracking-wider">
                    {user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "CV"}
                  </span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-[#17375F]">{user?.name || "Guest"}</span>
                  <span className="text-[11px] text-slate-400">{user?.email || ""}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="size-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 flex flex-col py-2 px-3 gap-1 overflow-y-auto">
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F] transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F] transition-colors"
              >
                Billing
              </Link>
              <Link
                to="/app/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#17375F] transition-colors"
              >
                Profile
              </Link>
            </div>

            {/* Drawer Footer */}
            <div className="px-4 py-4 border-t border-slate-100">
              <button
                onClick={logoutUser}
                className="w-full bg-white hover:bg-slate-50 border border-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
