import React from "react";
import { RotateCcw } from "lucide-react";
import ColorPicker from "../ColorPicker";

const DEFAULT_COLORS = {
  heading: "#17375F",
  accent: "#0353A4",
  text: "#102A43",
  muted: "#627D98",
  border: "#90C2E7",
  background: "#FFFFFF",
};

const ColorSettings = ({ customization = {}, onChange, onReset }) => {
  const colors = customization.colors || {};

  const updateColor = (field, value) => {
    const updatedColors = {
      ...DEFAULT_COLORS,
      ...colors,
      [field]: value,
    };
    onChange({
      ...customization,
      colors: updatedColors,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Color Palette</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure document color roles for headings, text, accents, and borders.
          </p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded"
            title="Reset Colors to Default"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Heading Color</label>
          <ColorPicker
            selectedColor={colors.heading || DEFAULT_COLORS.heading}
            onChange={(color) => updateColor("heading", color)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Primary Accent</label>
          <ColorPicker
            selectedColor={colors.accent || DEFAULT_COLORS.accent}
            onChange={(color) => updateColor("accent", color)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Body Text</label>
          <ColorPicker
            selectedColor={colors.text || DEFAULT_COLORS.text}
            onChange={(color) => updateColor("text", color)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Muted Text</label>
          <ColorPicker
            selectedColor={colors.muted || DEFAULT_COLORS.muted}
            onChange={(color) => updateColor("muted", color)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Border / Divider</label>
          <ColorPicker
            selectedColor={colors.border || DEFAULT_COLORS.border}
            onChange={(color) => updateColor("border", color)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Background</label>
          <ColorPicker
            selectedColor={colors.background || DEFAULT_COLORS.background}
            onChange={(color) => updateColor("background", color)}
          />
        </div>
      </div>
    </div>
  );
};

export default ColorSettings;
