import React from "react";
import { RotateCcw } from "lucide-react";
import { resolveEntryCustomization, updateEntryCustomization, ENTRY_CUSTOMIZATION_FIELDS } from "../../utils/sectionCustomization";

const EntrySettings = ({ entry, onChange, onReset, parentSection }) => {
  const current = entry?.customization || {};
  const resolved = resolveEntryCustomization(current);

  const handleUpdate = (patch) => {
    onChange({
      ...entry,
      customization: {
        ...current,
        ...patch,
      },
    });
  };

  if (!entry) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
        Select an entry in the editor to customize its settings.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Entry Settings</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Customizing entry within{" "}
            <span className="font-medium text-slate-700">{parentSection?.title || "Unknown Section"}</span>
          </p>
        </div>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded" title="Reset Entry Customization">
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      {/* Visibility */}
      <SelectGroup
        label="Visibility"
        value={current.visibility || "visible"}
        options={[
          { label: "Visible", value: "visible" },
          { label: "Hidden", value: "hidden" },
        ]}
        onChange={(v) => handleUpdate({ visibility: v })}
      />

      {/* Alignment */}
      <SelectGroup
        label="Alignment"
        value={current.alignment || "left"}
        options={[
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ]}
        onChange={(v) => handleUpdate({ alignment: v })}
      />

      {/* Emphasis */}
      <SelectGroup
        label="Emphasis"
        value={current.emphasis || "normal"}
        options={[
          { label: "Normal", value: "normal" },
          { label: "Subtle", value: "subtle" },
          { label: "Strong", value: "strong" },
        ]}
        onChange={(v) => handleUpdate({ emphasis: v })}
      />

      {/* Spacing */}
      <SelectGroup
        label="Spacing"
        value={current.spacing || "normal"}
        options={[
          { label: "Tight", value: "tight" },
          { label: "Normal", value: "normal" },
          { label: "Spacious", value: "spacious" },
        ]}
        onChange={(v) => handleUpdate({ spacing: v })}
      />

      {/* Title Style */}
      <SelectGroup
        label="Title Style"
        value={current.titleStyle || "bold"}
        options={[
          { label: "Normal", value: "normal" },
          { label: "Bold", value: "bold" },
          { label: "Uppercase", value: "uppercase" },
          { label: "Accent", value: "accent" },
        ]}
        onChange={(v) => handleUpdate({ titleStyle: v })}
      />

      {/* Subtitle Style */}
      <SelectGroup
        label="Subtitle Style"
        value={current.subtitleStyle || "normal"}
        options={[
          { label: "Normal", value: "normal" },
          { label: "Bold", value: "bold" },
          { label: "Italic", value: "italic" },
          { label: "Accent", value: "accent" },
        ]}
        onChange={(v) => handleUpdate({ subtitleStyle: v })}
      />

      {/* Date Style */}
      <SelectGroup
        label="Date Style"
        value={current.dateStyle || "subtle"}
        options={[
          { label: "Normal", value: "normal" },
          { label: "Bold", value: "bold" },
          { label: "Subtle", value: "subtle" },
          { label: "Accent", value: "accent" },
        ]}
        onChange={(v) => handleUpdate({ dateStyle: v })}
      />

      {/* Note */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-700 leading-relaxed">
        <strong>Note:</strong> Customization visibility (<code className="font-mono">visibility</code>) is presentation-level and separate from the structural visibility toggle (<code className="font-mono">visible</code>) in the entry list.
      </div>
    </div>
  );
};

const SelectGroup = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
      {label}
    </label>
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            value === opt.value
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export default EntrySettings;
