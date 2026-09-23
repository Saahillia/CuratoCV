import React from 'react';
import { FileText, NotebookPen } from 'lucide-react';

export const ResumePreview = () => (
    <div className="w-full h-40 bg-[#F5F8FB] border border-[#D9E0E7] rounded-xl p-3 flex flex-col justify-between overflow-hidden shadow-xs group-hover:border-[#17375F]/30 transition-all">
        <div className="flex items-center justify-between border-b border-[#D9E0E7] pb-2">
            <span className="text-[10px] font-bold text-[#17375F] uppercase tracking-wider">Resume Preview</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="bg-white rounded-lg p-2.5 shadow-xs border border-[#D9E0E7]/60 space-y-1.5 transform group-hover:scale-[1.02] transition-transform duration-300">
            <div className="h-2 w-16 bg-[#17375F] rounded-sm"></div>
            <div className="h-1.5 w-24 bg-[#D9E0E7] rounded-sm"></div>
            <div className="pt-1 flex gap-1">
                <div className="h-1.5 w-8 bg-blue-500 rounded-sm"></div>
                <div className="h-1.5 w-12 bg-slate-200 rounded-sm"></div>
            </div>
            <div className="space-y-1 pt-1">
                <div className="h-1 w-full bg-slate-100 rounded-sm"></div>
                <div className="h-1 w-4/5 bg-slate-100 rounded-sm"></div>
            </div>
        </div>
        <div className="text-[9px] text-[#667085] flex justify-between">
            <span>Template: Classic</span>
            <span>ATS Optimized</span>
        </div>
    </div>
);

export const NotesPreview = () => (
    <div className="w-full h-40 bg-[#F5F8FB] border border-[#D9E0E7] rounded-xl p-3 flex flex-col justify-between overflow-hidden shadow-xs group-hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between border-b border-[#D9E0E7] pb-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Notes Workspace</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        </div>
        <div className="bg-white rounded-lg p-2 shadow-xs border border-[#D9E0E7]/60 flex gap-2 h-20 transform group-hover:scale-[1.02] transition-transform duration-300">
            <div className="w-12 border-r border-slate-100 pr-1 space-y-1">
                <div className="h-1.5 w-8 bg-indigo-100 rounded-sm"></div>
                <div className="h-1 w-6 bg-slate-100 rounded-sm"></div>
                <div className="h-1 w-7 bg-slate-100 rounded-sm"></div>
            </div>
            <div className="flex-1 space-y-1.5">
                <div className="h-2 w-20 bg-indigo-600 rounded-sm"></div>
                <div className="h-1.5 w-full bg-slate-100 rounded-sm"></div>
                <div className="h-1.5 w-3/4 bg-slate-100 rounded-sm"></div>
                <div className="flex gap-1 pt-1">
                    <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded">Editor</span>
                    <span className="text-[8px] bg-amber-50 text-amber-600 px-1 rounded">Drawing</span>
                </div>
            </div>
        </div>
        <div className="text-[9px] text-[#667085] flex justify-between">
            <span>Local-first sync</span>
            <span>Infinite tree</span>
        </div>
    </div>
);
