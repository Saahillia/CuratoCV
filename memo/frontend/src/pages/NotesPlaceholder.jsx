import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, NotebookPen, Sparkles } from "lucide-react";

const NotesPlaceholder = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F5F8FB] text-[#172033] flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-[#D9E0E7] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.svg" alt="CuratoCV logo" className="h-12 w-auto object-contain" />
                        <img src="/brand.svg" alt="CuratoCV wordmark" className="h-10 w-auto object-contain" />
                    </Link>
                    <span className="text-[#D9E0E7]">/</span>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full">
                        Notes Workspace
                    </span>
                </div>

                <button
                    onClick={() => navigate("/products")}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#17375F] bg-[#E8F0F7] hover:bg-[#D9E0E7] rounded-lg transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Products
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-[#D9E0E7] rounded-2xl p-8 shadow-sm text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
                        <NotebookPen size={28} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-4">
                        <Sparkles size={13} className="text-amber-600" />
                        Next Platform Expansion
                    </div>

                    <h1 className="text-2xl font-bold text-[#172033] mb-2 tracking-tight">
                        Notes Workspace
                    </h1>

                    <p className="text-[#667085] text-sm leading-relaxed mb-6">
                        The Notes Workspace module is the next project on the roadmap. It will feature rich-text editing, infinite tree organization, drawing canvas, and local-first offline synchronization.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate("/products")}
                            className="w-full py-2.5 px-4 bg-[#17375F] hover:bg-[#0F2745] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                        >
                            Return to All Products
                        </button>
                        <button
                            onClick={() => navigate("/app")}
                            className="w-full py-2.5 px-4 bg-white border border-[#D9E0E7] hover:bg-[#F5F8FB] text-[#172033] text-xs font-semibold rounded-xl transition-colors"
                        >
                            Open Resume Builder
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-[#D9E0E7] py-4 px-6 text-center text-xs text-[#667085]">
                <p>© 2026 CuratoCV Platform. Making every professional feel valued.</p>
            </footer>
        </div>
    );
};

export default NotesPlaceholder;
