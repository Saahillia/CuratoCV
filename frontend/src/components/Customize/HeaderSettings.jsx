import React from "react";
import { RotateCcw } from "lucide-react";

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

const HeaderSettings = ({ customization = {}, onChange, onReset }) => {
  const header = customization.header || {};

  const update = (patch) => {
    onChange({ ...customization, header: { ...header, ...patch } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Header Configuration</h3>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded" title="Reset Header to Default">
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">Configure resume header alignment and layout</p>

      <RadioGroup
        label="Alignment"
        value={header.alignment || "left"}
        options={[
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ]}
        onChange={(v) => update({ alignment: v })}
      />

      <RadioGroup
        label="Layout Style"
        value={header.layout || "standard"}
        options={[
          { label: "Standard", value: "standard" },
          { label: "Compact", value: "compact" },
          { label: "Split", value: "split" },
        ]}
        onChange={(v) => update({ layout: v })}
      />
    </div>
  );
};

export default HeaderSettings;
