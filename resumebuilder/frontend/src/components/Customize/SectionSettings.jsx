import React from "react";
import { RotateCcw } from "lucide-react";
import { resolveSectionCustomization, updateSectionCustomization, updateSectionSpecific, SECTION_CUSTOMIZATION_FIELDS } from "../../utils/sectionCustomization";
import { resumeSections } from "../../constants/resumeSections";

const SectionSettings = ({ section, onChange, onReset }) => {
  const current = section?.customization || {};
  const resolved = resolveSectionCustomization(current);
  const definition = resumeSections.getDefinition(section?.type);
  const sectionType = section?.type || "custom";

  // Only expose settings that make sense for the section
  const handleUpdate = (patch) => {
    onChange({
      ...section,
      customization: {
        ...current,
        ...patch,
      },
    });
  };

  const handleSpecificUpdate = (key, value) => {
    const currentSpecific = current.sectionSpecific || {};
    handleUpdate({
      sectionSpecific: {
        ...currentSpecific,
        [key]: value,
      },
    });
  };

  // Section-specific customization schemas (simplified exposure)
  const renderSectionSpecific = () => {
    if (!definition || !definition.supportsCustomization) return null;

    // Experience
    if (sectionType === "experience") {
      return (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Experience Layout</h4>
          <div className="grid grid-cols-2 gap-2">
            <SelectGroup
              label="Layout"
              value={current.sectionSpecific?.layout || "standard"}
              options={[
                { label: "Standard", value: "standard" },
                { label: "Compact", value: "compact" },
                { label: "Timeline", value: "timeline" },
              ]}
              onChange={(v) => handleSpecificUpdate("layout", v)}
            />
            <SelectGroup
              label="Date Pos"
              value={current.sectionSpecific?.datePosition || "right"}
              options={[
                { label: "Right", value: "right" },
                { label: "Left", value: "left" },
                { label: "Below Title", value: "below-title" },
                { label: "Inline", value: "inline" },
              ]}
              onChange={(v) => handleSpecificUpdate("datePosition", v)}
            />
          </div>
          <SelectGroup
            label="Description Style"
            value={current.sectionSpecific?.descriptionStyle || "paragraph"}
            options={[
              { label: "Paragraph", value: "paragraph" },
              { label: "Bullets", value: "bullets" },
            ]}
            onChange={(v) => handleSpecificUpdate("descriptionStyle", v)}
          />
        </div>
      );
    }

    // Education
    if (sectionType === "education") {
      return (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Education Layout</h4>
          <div className="grid grid-cols-2 gap-2">
            <SelectGroup
              label="Layout"
              value={current.sectionSpecific?.layout || "standard"}
              options={[
                { label: "Standard", value: "standard" },
                { label: "Compact", value: "compact" },
                { label: "Timeline", value: "timeline" },
              ]}
              onChange={(v) => handleSpecificUpdate("layout", v)}
            />
            <SelectGroup
              label="Institution Style"
              value={current.sectionSpecific?.institutionStyle || "normal"}
              options={[
                { label: "Normal", value: "normal" },
                { label: "Bold", value: "bold" },
                { label: "Accent", value: "accent" },
              ]}
              onChange={(v) => handleSpecificUpdate("institutionStyle", v)}
            />
          </div>
        </div>
      );
    }

    // Skills
    if (sectionType === "skills") {
      return (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skills Layout</h4>
          <SelectGroup
            label="Layout"
            value={current.sectionSpecific?.layout || "rows"}
            options={[
              { label: "Rows", value: "rows" },
              { label: "Grid", value: "grid" },
              { label: "Compact", value: "compact" },
              { label: "Bubble", value: "bubble" },
              { label: "Level", value: "level" },
            ]}
            onChange={(v) => handleSpecificUpdate("layout", v)}
          />
          <SelectGroup
            label="Row Spacing"
            value={current.sectionSpecific?.rowSpacing || "normal"}
            options={[
              { label: "Tight", value: "tight" },
              { label: "Normal", value: "normal" },
              { label: "Spacious", value: "spacious" },
            ]}
            onChange={(v) => handleSpecificUpdate("rowSpacing", v)}
          />
        </div>
      );
    }

    // Projects
    if (sectionType === "projects") {
      return (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Projects Layout</h4>
          <SelectGroup
            label="Layout"
            value={current.sectionSpecific?.layout || "standard"}
            options={[
              { label: "Standard", value: "standard" },
              { label: "Compact", value: "compact" },
              { label: "Grid", value: "grid" },
            ]}
            onChange={(v) => handleSpecificUpdate("layout", v)}
          />
        </div>
      );
    }

    // Summary
    if (sectionType === "summary") {
      return (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary Style</h4>
          <SelectGroup
            label="Text Style"
            value={current.sectionSpecific?.textStyle || "normal"}
            options={[
              { label: "Normal", value: "normal" },
              { label: "Compact", value: "compact" },
              { label: "Large", value: "large" },
            ]}
            onChange={(v) => handleSpecificUpdate("textStyle", v)}
          />
        </div>
      );
    }

    // List sections (certificates, courses, awards, languages, interests, organisations, publications, references, declaration, custom)
    if (["certificates","courses","awards","languages","interests","organisations","publications","references","declaration","custom"].includes(sectionType)) {
      return (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Layout Options</h4>
          <SelectGroup
            label="Layout"
            value={current.sectionSpecific?.layout || "list"}
            options={
              sectionType === "custom"
                ? [
                    { label: "Standard", value: "standard" },
                    { label: "List", value: "list" },
                    { label: "Grid", value: "grid" },
                    { label: "Compact", value: "compact" },
                  ]
                : [
                    { label: "List", value: "list" },
                    { label: "Grid", value: "grid" },
                    { label: "Compact", value: "compact" },
                  ]
            }
            onChange={(v) => handleSpecificUpdate("layout", v)}
          />
        </div>
      );
    }

    return null;
  };

  if (!section) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
        Select a section in the editor to customize its settings.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Section Settings</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {definition?.defaultTitle || section.title || "Section"} —{" "}
            <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{sectionType}</span>
          </p>
        </div>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded" title="Reset Section Customization">
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      {/* Common customization */}
      <SelectGroup
        label="Visibility"
        value={current.visibility || "visible"}
        options={[
          { label: "Visible", value: "visible" },
          { label: "Hidden", value: "hidden" },
        ]}
        onChange={(v) => handleUpdate({ visibility: v })}
      />

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

      <SelectGroup
        label="Heading Style"
        value={current.headingStyle || "standard"}
        options={[
          { label: "Standard", value: "standard" },
          { label: "Bold", value: "bold" },
          { label: "Uppercase", value: "uppercase" },
          { label: "Accent", value: "accent" },
          { label: "Minimal", value: "minimal" },
        ]}
        onChange={(v) => handleUpdate({ headingStyle: v })}
      />

      <SelectGroup
        label="Heading Size"
        value={current.headingSize || "normal"}
        options={[
          { label: "Small", value: "small" },
          { label: "Normal", value: "normal" },
          { label: "Large", value: "large" },
        ]}
        onChange={(v) => handleUpdate({ headingSize: v })}
      />

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

      <SelectGroup
        label="Divider"
        value={current.divider || "none"}
        options={[
          { label: "None", value: "none" },
          { label: "Line", value: "line" },
          { label: "Accent", value: "accent" },
        ]}
        onChange={(v) => handleUpdate({ divider: v })}
      />

      {/* Section-specific customization */}
      {renderSectionSpecific()}

      {/* Note */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-700 leading-relaxed">
        <strong>Note:</strong> Customization visibility is presentation-level and separate from the editor visibility toggle. Structural visibility (<code className="font-mono">section.visible</code>) controls whether the section appears; customization visibility controls presentation styling.
      </div>
    </div>
  );
};

// Helper: Select group component used inside SectionSettings
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

export default SectionSettings;
