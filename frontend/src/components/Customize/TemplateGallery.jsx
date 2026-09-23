import React from "react";
import { TEMPLATES } from "../../constants/templates";
import { Check, Sparkles } from "lucide-react";
import TemplatePreview from "../TemplatePreview";

/**
 * TemplateGallery
 *
 * Renders a responsive 2-column grid of professional template preview cards.
 * Implements keyboard accessibility, robust focus states, and compact preview heights.
 */
const TemplateGallery = ({ selectedTemplate, onSelectTemplate, resumeData }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Sparkles className="size-5 text-blue-600" />
                    Template Selection
                </h2>
                <p className="text-xs text-slate-500">
                    Choose a professional design layout to format your resume content instantly.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                        <div
                            key={tpl.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            aria-label={`Select ${tpl.name} template`}
                            onClick={() => onSelectTemplate(tpl.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onSelectTemplate(tpl.id);
                                }
                            }}
                            className={`group relative rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                                isSelected
                                    ? "bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                            }`}
                        >
                            {/* Compact Miniature A4 Preview Container */}
                            <div className="w-full flex justify-center mb-3 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-inner p-1.5">
                                <TemplatePreview
                                    data={resumeData}
                                    templateId={tpl.id}
                                    maxHeight={140}
                                />
                            </div>

                            {/* Card Metadata */}
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                                        {tpl.name}
                                    </h3>
                                    {isSelected ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                                            <Check className="size-3 stroke-[3]" /> Active
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            Select
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                    {tpl.description}
                                </p>
                            </div>

                            {/* Footer & Category Tag */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="capitalize font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {tpl.category}
                                </span>
                                <span className="font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Apply template →
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplateGallery;
