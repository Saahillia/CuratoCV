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
    </div>
  );
};

export default TypographySettings;
