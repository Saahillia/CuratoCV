import React from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, ArrowLeft, Sparkles } from 'lucide-react';

const NotesLauncher = () => {
    return (
        <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
            <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
                <Link to="/products" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
                    <ArrowLeft size={16} />
                    <span>Back to Products</span>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200/50 rounded-full flex items-center gap-1">
                        <Sparkles size={12} />
                        NEW WORKSPACE
                    </span>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 shadow-inner">
                    <NotebookPen size={32} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Notes Workspace</h1>
                <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
                    Your flexible workspace for drafting ideas, meeting notes, drawing diagrams, and keeping everything organized in offline-ready folders.
                </p>

                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-lg w-full mb-8">
                    <h3 className="font-semibold text-slate-900 mb-2">Workspace Coming Soon</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        We are putting the final touches on real-time collaboration and markdown synchronization for Notes.
                    </p>
                    <Link
                        to="/products"
                        className="inline-flex items-center justify-center w-full py-3 px-6 bg-slate-900 hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors duration-200"
                    >
                        Return to Products Launcher
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default NotesLauncher;
