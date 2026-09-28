/**
 * Developer context for resumebuilder/frontend/src/components/Customize/PhotoSettings.jsx.
 * Purpose: implement a Resume Builder presentation/customization control for Photo Settings.
 * Why here: design-setting interactions belong to the resume domain; shared shell code should only mount the product.
 */
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

const PhotoSettings = ({ customization = {}, onChange, onReset, selectedTemplate = "classic" }) => {
  const photo = customization.photo || {};

  const update = (patch) => {
    onChange({ ...customization, photo: { ...photo, ...patch } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Photo Settings</h3>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded" title="Reset Photo to Default">
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">Customize profile photo appearance and layout</p>
      <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
        Profile photos are shown by the Minimal Image template. Your photo settings stay saved when you switch templates.
        {selectedTemplate !== "minimal-image" && " Select Minimal Image to see these changes in the preview."}
      </p>

      <RadioGroup
        label="Visibility"
        value={photo.visibility || "hidden"}
        options={[
          { label: "Hidden", value: "hidden" },
          { label: "Visible", value: "visible" },
        ]}
        onChange={(v) => update({ visibility: v })}
      />

      <RadioGroup
        label="Shape"
        value={photo.shape || "circle"}
        options={[
          { label: "Circle", value: "circle" },
          { label: "Rounded", value: "rounded" },
          { label: "Square", value: "square" },
        ]}
        onChange={(v) => update({ shape: v })}
      />

      <RadioGroup
        label="Position"
        value={photo.position || "right"}
        options={[
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ]}
        onChange={(v) => update({ position: v })}
      />

      <RadioGroup
        label="Size"
        value={photo.size || "medium"}
        options={[
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ]}
        onChange={(v) => update({ size: v })}
      />

      <RadioGroup
        label="Object Fit"
        value={photo.fit || "cover"}
        options={[
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
        ]}
        onChange={(v) => update({ fit: v })}
      />
    </div>
  );
};

export default PhotoSettings;
