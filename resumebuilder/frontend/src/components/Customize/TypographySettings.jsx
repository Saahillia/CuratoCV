/**
 * Developer context for resumebuilder/frontend/src/components/Customize/TypographySettings.jsx.
 * Purpose: implement a Resume Builder presentation/customization control for Typography Settings.
 * Why here: design-setting interactions belong to the resume domain; shared shell code should only mount the product.
 */
import React from "react";
import { RotateCcw } from "lucide-react";
import {
  VALID_FONT_FAMILIES,
  VALID_FONT_SIZES,
  VALID_HEADING_SCALES,
  VALID_LINE_HEIGHTS,
  FONT_FAMILY_LABELS,
} from "../../utils/typography";

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

const SizeSlider = ({ label, value, min, max, step = 0.5, unit = "pt", onChange }) => (
  <label className="block space-y-1.5">
    <span className="flex items-center justify-between text-[11px] text-slate-600">
      <span>{label}</span>
      <span className="font-medium tabular-nums text-slate-800">{value}{unit}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={label}
      className="h-2 w-full cursor-pointer accent-blue-600"
    />
    <span className="flex justify-between text-[10px] text-slate-400"><span>{min}{unit}</span><span>{max}{unit}</span></span>
  </label>
);

const TypographySettings = ({ customization = {}, onChange, onReset }) => {
  const typography = customization.typography || {};

  const update = (patch) => {
    onChange({ ...customization, typography: { ...typography, ...patch } });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Typography</h3>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded" title="Reset Typography to Default">
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      <Select
        label="Font Family"
        value={typography.fontFamily || "system"}
        options={VALID_FONT_FAMILIES.map((f) => ({
          value: f,
          label: FONT_FAMILY_LABELS[f],
        }))}
        onChange={(v) => update({ fontFamily: v })}
      />

      <RadioGroup
        label="Font Size Scale"
        value={typography.fontSizeScale || "normal"}
        options={VALID_FONT_SIZES.map((s) => ({
          value: s,
          label: s.charAt(0).toUpperCase() + s.slice(1),
        }))}
        onChange={(v) => update({ fontSizeScale: v })}
      />

      <RadioGroup
        label="Heading Scale"
        value={typography.headingScale || "normal"}
        options={VALID_HEADING_SCALES.map((s) => ({
          value: s,
          label: s.charAt(0).toUpperCase() + s.slice(1),
        }))}
        onChange={(v) => update({ headingScale: v })}
      />

      <RadioGroup
        label="Line Height"
        value={typography.lineHeight || "normal"}
        options={VALID_LINE_HEIGHTS.map((l) => ({
          value: l,
          label: l.charAt(0).toUpperCase() + l.slice(1),
        }))}
        onChange={(v) => update({ lineHeight: v })}
      />

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-semibold text-slate-700">Fine tune type sizes</p>
        <SizeSlider label="Body text" value={typography.fontSizePt ?? 10.5} min={8} max={18} onChange={(v) => update({ fontSizePt: v })} />
        <SizeSlider label="Full name" value={typography.nameSizePt ?? 22} min={14} max={36} onChange={(v) => update({ nameSizePt: v })} />
        <SizeSlider label="Section headings" value={typography.sectionHeadingSizePt ?? 13.5} min={9} max={24} onChange={(v) => update({ sectionHeadingSizePt: v })} />
        <SizeSlider label="Entry headings" value={typography.entryHeadingSizePt ?? 11.5} min={8} max={18} onChange={(v) => update({ entryHeadingSizePt: v })} />
      </div>
    </div>
  );
};

export default TypographySettings;
