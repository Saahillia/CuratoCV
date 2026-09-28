/**
 * Developer context for resumebuilder/frontend/src/components/Customize/SpacingSettings.jsx.
 * Purpose: implement a Resume Builder presentation/customization control for Spacing Settings.
 * Why here: design-setting interactions belong to the resume domain; shared shell code should only mount the product.
 */
import React from "react";
import { RotateCcw } from "lucide-react";
import {
  VALID_DENSITIES,
  VALID_SECTION_SPACINGS,
  VALID_ENTRY_SPACINGS,
} from "../../utils/layoutSpacing";

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

const RangeSetting = ({ label, value, min, max, step = 0.5, unit = "mm", onChange }) => (
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

const SpacingSettings = ({ customization = {}, onChange, onReset }) => {
  const spacing = customization.spacing || {};

  const update = (patch) => {
    onChange({ ...customization, spacing: { ...spacing, ...patch } });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Spacing & Density</h3>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded" title="Reset Spacing to Default">
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      <RadioGroup
        label="Density (Overall)"
        value={spacing.density || "normal"}
        options={VALID_DENSITIES.map((d) => ({
          value: d,
          label: d.charAt(0).toUpperCase() + d.slice(1),
        }))}
        onChange={(v) => update({ density: v })}
      />

      <RadioGroup
        label="Section Spacing"
        value={spacing.sectionSpacing || "normal"}
        options={VALID_SECTION_SPACINGS.map((s) => ({
          value: s,
          label: s.charAt(0).toUpperCase() + s.slice(1),
        }))}
        onChange={(v) => update({ sectionSpacing: v })}
      />

      <RadioGroup
        label="Entry Spacing"
        value={spacing.entrySpacing || "normal"}
        options={VALID_ENTRY_SPACINGS.map((e) => ({
          value: e,
          label: e.charAt(0).toUpperCase() + e.slice(1),
        }))}
        onChange={(v) => update({ entrySpacing: v })}
      />

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-semibold text-slate-700">Fine tune spacing</p>
        <RangeSetting label="Line height" value={spacing.lineHeightMultiplier ?? 1.25} min={1} max={2} step={0.05} unit="×" onChange={(v) => update({ lineHeightMultiplier: v })} />
        <RangeSetting label="Space between sections" value={spacing.sectionSpacingMm ?? 3} min={0} max={12} onChange={(v) => update({ sectionSpacingMm: v })} />
        <RangeSetting label="Page margins" value={spacing.pageMarginMm ?? 10} min={5} max={20} onChange={(v) => update({ pageMarginMm: v })} />
      </div>
    </div>
  );
};

export default SpacingSettings;
