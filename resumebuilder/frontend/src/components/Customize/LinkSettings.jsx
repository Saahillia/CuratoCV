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

const LinkSettings = ({ customization = {}, onChange, onReset }) => {
  const links = customization.links || {};

  const update = (patch) => {
    onChange({ ...customization, links: { ...links, ...patch } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Links Configuration</h3>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded" title="Reset Links to Default">
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">Configure hyperlink styling and open behavior</p>

      <RadioGroup
        label="Link Style"
        value={links.style || "accent"}
        options={[
          { label: "Accent", value: "accent" },
          { label: "Underline", value: "underline" },
          { label: "Plain", value: "plain" },
        ]}
        onChange={(v) => update({ style: v })}
      />

      <RadioGroup
        label="Target Behavior"
        value={links.target || "new-tab"}
        options={[
          { label: "New Tab", value: "new-tab" },
          { label: "Same Tab", value: "same-tab" },
        ]}
        onChange={(v) => update({ target: v })}
      />
    </div>
  );
};

export default LinkSettings;
