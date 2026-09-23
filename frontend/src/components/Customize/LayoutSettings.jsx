import React from "react";
import { RotateCcw } from "lucide-react";
import {
  VALID_PAGE_WIDTHS,
  VALID_PAGE_ALIGNMENTS,
  VALID_COLUMN_RATIOS,
  VALID_COLUMNS,
} from "../../utils/layoutSpacing";
import SectionOrderingList from "./SectionOrderingList";

const RadioGroup = ({ label, value, options, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[11px] text-slate-500">{label}</label>
    <div className="flex bg-slate-100 p-0.5 rounded-lg">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-[11px] py-1.5 rounded-md transition ${
            value === opt.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const Select = ({ label, value, options, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[11px] text-slate-500">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const LayoutSettings = ({ resumeData, onChange }) => {
  const design = resumeData?.design || {};
  const layout = design.layout || {};

  const updateLayout = (patch) => {
    onChange({
      ...resumeData,
      design: { ...resumeData.design, layout: { ...layout, ...patch } },
    });
  };

  const updateSections = (newSections) => {
    onChange({ ...resumeData, sections: newSections });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Document Layout</h3>
        <p className="text-xs text-slate-500 mt-1">Adjust page layout and section flow.</p>
      </div>

      <div className="space-y-5">
        <RadioGroup
          label="Page Width"
          value={layout.pageWidth || "standard"}
          options={VALID_PAGE_WIDTHS.map((w) => ({
            value: w,
            label: w.charAt(0).toUpperCase() + w.slice(1),
          }))}
          onChange={(v) => updateLayout({ pageWidth: v })}
        />

        <RadioGroup
          label="Page Alignment"
          value={layout.pageAlignment || "left"}
          options={VALID_PAGE_ALIGNMENTS.map((a) => ({
            value: a,
            label: a.charAt(0).toUpperCase() + a.slice(1),
          }))}
          onChange={(v) => updateLayout({ pageAlignment: v })}
        />

        <RadioGroup
          label="Columns"
          value={layout.columns || "single"}
          options={VALID_COLUMNS.map((c) => ({
            value: c,
            label: c.charAt(0).toUpperCase() + c.slice(1),
          }))}
          onChange={(v) => updateLayout({ columns: v })}
        />

        {layout.columns === "two" && (
          <Select
            label="Column Ratio"
            value={layout.columnRatio || "50-50"}
            options={VALID_COLUMN_RATIOS.map((r) => ({
              value: r,
              label: r,
            }))}
            onChange={(v) => updateLayout({ columnRatio: v })}
          />
        )}
      </div>

      <div className="border-t border-slate-100 pt-6">
        <SectionOrderingList
          sections={resumeData.sections || []}
          onChange={updateSections}
        />
      </div>
    </div>
  );
};

export default LayoutSettings;
