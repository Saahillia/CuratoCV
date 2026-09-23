import React, { useState } from 'react';
import { ProductGrid } from '../components/products/ProductGrid';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../app/features/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, LayoutGrid, HelpCircle, Settings, User, ChevronDown, Menu, X, Home, ArrowLeft, FileText, NotebookPen, ChevronRight } from 'lucide-react';
import Breadcrumbs from '../components/Common/Breadcrumbs';

import toast from 'react-hot-toast';

const Products = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [productsExpanded, setProductsExpanded] = useState(true);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem("token");
        toast.success("Logged out successfully");
        navigate('/login');
    };

    const navContent = (
        <div className="flex flex-col justify-between h-full p-6">
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3">
                        Products
                    </p>
                    <nav className="space-y-1.5">
                        <Link
                            to="/"
                            onClick={() => setMobileDrawerOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F5F8FB] text-sm font-medium"
                        >
                            <Home size={18} /> Home Page
                        </Link>
                        <div>
                            <div
                                onClick={() => setProductsExpanded(!productsExpanded)}
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#E8F0F7] text-[#17375F] text-sm font-semibold cursor-pointer hover:bg-[#D9E0E7] transition-colors select-none"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <LayoutGrid size={18} /> All Products
                                </div>
                                <div className="p-1 rounded">
                                    <ChevronDown size={16} className={`transition-transform duration-300 ease-in-out ${productsExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            <div
                                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                                    productsExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div
                                        className={`pl-6 pt-1.5 space-y-1 transform transition-all duration-300 ease-out origin-top ${
                                            productsExpanded ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95"
                                        }`}
                                    >
                                        <Link
                                            to="/products"
                                            onClick={() => setMobileDrawerOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F5F8FB] text-xs font-medium transition-colors"
                                        >
                                            <LayoutGrid size={15} /> Overview
                                        </Link>
                                        <Link
                                            to="/app"
                                            onClick={() => setMobileDrawerOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F5F8FB] text-xs font-medium transition-colors"
                                        >
                                            <FileText size={15} /> Resume Builder
                                        </Link>
                                        <Link
                                            to="/notes"
                                            onClick={() => setMobileDrawerOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F5F8FB] text-xs font-medium transition-colors"
                                        >
                                            <NotebookPen size={15} /> Notes Taking App
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[#D9E0E7]">
                <div className="space-y-1.5">
                    <a
                        href="#help"
                        onClick={(e) => {
                            e.preventDefault();
                            alert("Help & Support: support@curatocv.com");
                            setMobileDrawerOpen(false);
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F5F8FB] text-sm font-medium"
                    >
                        <HelpCircle size={18} /> Help & Support
                    </a>
                    <Link
                        to="/app/billing"
                        onClick={() => setMobileDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F5F8FB] text-sm font-medium"
                    >
                        <Settings size={18} /> Settings
                    </Link>
                </div>
                <div className="px-3 text-xs text-[#667085] font-medium">
                    CuratoCV Platform v1.0.0
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F8FB] flex flex-col text-[#172033]" onClick={() => { setShowUserMenu(false); setMobileDrawerOpen(false); }}>
            {/* Header */}
            <header className="bg-white border-b border-[#D9E0E7] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
                {/* Left Side: Logo, Brand & Back to Home */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setMobileDrawerOpen(true)}
                        className="md:hidden p-1.5 text-[#17375F] hover:bg-[#E8F0F7] rounded-lg transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <Menu size={20} />
                    </button>

                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.svg" alt="CuratoCV logo" className="h-12 w-auto object-contain" />
                        <img src="/brand.svg" alt="CuratoCV wordmark" className="h-10 w-auto object-contain" />
                    </Link>

                    <Link
                        to="/"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#17375F] bg-[#E8F0F7] hover:bg-[#D9E0E7] rounded-lg transition-colors ml-1"
                    >
                        <ArrowLeft size={14} /> Back to Home
                    </Link>
                </div>

                {/* Center: Empty to maintain space */}
                <div className="hidden md:flex items-center"></div>

                {/* Right Side: User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowUserMenu(!showUserMenu);
                        }}
                        className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-xl border border-[#D9E0E7] bg-white hover:bg-[#F5F8FB] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#17375F] text-white font-medium text-xs flex items-center justify-center shadow-inner">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-semibold text-[#172033]">{user?.name || 'User'}</span>
                            <span className="text-[10px] text-[#667085]">{user?.email || 'user@curatocv.com'}</span>
                        </div>
                        <ChevronDown size={14} className="text-[#667085]" />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D9E0E7] rounded-xl shadow-lg py-1 z-50"
                             onMouseLeave={() => setShowUserMenu(false)}>
                            <div className="px-4 py-3 border-b border-[#D9E0E7]">
                                <p className="text-xs font-semibold text-[#172033]">{user?.name || 'User'}</p>
                                <p className="text-[11px] text-[#667085] truncate">{user?.email || 'user@curatocv.com'}</p>
                            </div>
                            <Link to="/app/profile" className="flex items-center gap-2 px-4 py-2 text-xs text-[#172033] hover:bg-[#F5F8FB]">
                                <User size={14} className="text-[#667085]" /> Profile
                            </Link>
                            <Link to="/app/billing" className="flex items-center gap-2 px-4 py-2 text-xs text-[#172033] hover:bg-[#F5F8FB]">
                                <Settings size={14} className="text-[#667085]" /> Settings
                            </Link>
                            <div className="border-t border-[#D9E0E7] my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                            >
                                <LogOut size={14} /> Log out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile Sidebar Drawer */}
            {mobileDrawerOpen && (
                <div className="fixed inset-0 z-40 md:hidden flex">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setMobileDrawerOpen(false)}
                    />
                    <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-slide-in-right">
                        <div className="p-4 border-b border-[#D9E0E7] flex items-center justify-between">
                            <span className="font-bold text-base text-[#17375F]">Menu</span>
                            <button
                                onClick={() => setMobileDrawerOpen(false)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {navContent}
                        </div>
                    </div>
                </div>
            )}

            {/* Layout Body */}
            <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] mx-auto w-full">
                {/* Desktop/Tablet Responsive Sidebar (240px - 280px) */}
                <aside className="hidden md:flex md:w-60 lg:w-70 bg-white border-r border-[#D9E0E7] flex-col justify-between shrink-0">
                    {navContent}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-8 flex flex-col">
                    <Breadcrumbs />

                    <div className="max-w-4xl mb-4 sm:mb-6">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#172033] tracking-tight mb-1">
                            BUILD. CREATE. ORGANIZE.
                        </h1>
                        <p className="text-[#667085] text-sm sm:text-base leading-relaxed">
                            Tools designed for your work, ideas, and career. Choose a workspace to continue where you left off.
                        </p>
                    </div>

                    <ProductGrid />
                </main>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-[#D9E0E7] py-4 px-6 text-center text-xs text-[#667085]">
                <p>© 2026 CuratoCV Platform. Making every professional feel valued.</p>
            </footer>
        </div>
    );
};

export default Products;
