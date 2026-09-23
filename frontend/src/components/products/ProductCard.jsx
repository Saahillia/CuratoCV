import React from 'react';
import { ArrowRight, CheckCircle2, FileText, NotebookPen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResumePreview, NotesPreview } from './ProductPreviews';

const ICONS = {
    FileText: FileText,
    NotebookPen: NotebookPen
};

export const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const IconComponent = ICONS[product.icon] || FileText;

    const handleCardClick = () => {
        navigate(product.route);
    };

    return (
        <div
            onClick={handleCardClick}
            className="group relative bg-white border border-[#D9E0E7] rounded-2xl p-5 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer hover:border-[#17375F]/40"
        >
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#E8F0F7] text-[#17375F] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <IconComponent size={24} />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        product.badge === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    }`}>
                        {product.badge}
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-[#172033] mb-1.5">{product.name}</h3>
                <p className="text-[#667085] text-sm mb-4 leading-relaxed">{product.description}</p>

                <div className="mb-4">
                    {product.id === 'resume-builder' ? <ResumePreview /> : <NotesPreview />}
                </div>

                <div className="space-y-2 mb-6">
                    {product.capabilities.map((cap, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-[#667085]">
                            <CheckCircle2 size={14} className="text-[#17375F] shrink-0" />
                            <span>{cap}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(product.route);
                }}
                className="w-full mt-auto flex items-center justify-center gap-2 py-3 px-4 bg-[#17375F] hover:bg-[#0F2745] text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-xs group-hover:shadow-md"
            >
                <span>Open {product.name}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};
