import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Lightbulb,
  Check,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const tipsByType = {
  experience: [
    "Start bullets with strong action verbs (e.g., Developed, Orchestrated, Spearheaded).",
    "Quantify your impact with metrics and percentages where possible (e.g., 'Reduced latency by 40%').",
    "Tailor bullet points to the responsibilities of the role you're applying for.",
  ],
  education: [
    "Include relevant coursework, honors, or leadership activities if applicable.",
    "Mention GPA if it is above 3.5 or explicitly requested by employers.",
    "List degrees in reverse chronological order.",
  ],
  projects: [
    "Describe the problem, the tech stack used, and the measurable outcome.",
    "Include a live demo link or GitHub repository URL if available.",
    "Highlight full-stack or architecture decisions you personally made.",
  ],
  certificates: [
    "List the official name of the credential and issuing organization.",
    "Include expiration date or credential verification ID/link if applicable.",
  ],
  skills: [
    "Group skills by category (e.g., Languages, Frameworks, Cloud/DevOps).",
    "Prioritize skills mentioned prominently in job descriptions.",
  ],
  custom: [
    "Keep descriptions clear, concise, and focused on accomplishments.",
    "Use bullet points for improved readability.",
  ],
};

const EntryEditor = ({
  entry = {},
  sectionType = "experience",
  onSave,
  onCancel,
  onDelete,
  onToggleVisibility,
  onAiEnhance,
}) => {
  const [data, setData] = useState(() => {
    const rawData = entry?.data || {};
    let initialSkills = [];
    if (Array.isArray(rawData.skills)) {
      initialSkills = rawData.skills.filter(Boolean);
    } else if (typeof rawData.description === "string" && rawData.description.trim()) {
      initialSkills = rawData.description.split(",").map((s) => s.trim()).filter(Boolean);
    }

    return {
      title: rawData.title || rawData.position || rawData.name || rawData.degree || "",
      subtitle: rawData.subtitle || rawData.company || rawData.institution || rawData.type || "",
      startDate: rawData.startDate || rawData.start_date || "",
      endDate: rawData.endDate || rawData.end_date || rawData.graduationDate || "",
      isCurrent: rawData.isCurrent || rawData.is_current || false,
      location: rawData.location || rawData.field || "",
      link: rawData.link || rawData.url || "",
      description: rawData.description || "",
      category: rawData.category || rawData.name || rawData.title || "",
      skills: initialSkills,
      ...rawData,
    };
  });

  const [skillInput, setSkillInput] = useState("");
  const [visible, setVisible] = useState(entry.visible !== false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const tips = tipsByType[sectionType] || tipsByType.custom;

  const handleChange = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSkill = (textToAdd) => {
    const text = typeof textToAdd === "string" ? textToAdd : skillInput;
    if (!text || !text.trim()) return;
    const newItems = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (newItems.length === 0) return;

    setData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), ...newItems.filter((item) => !prev.skills?.includes(item))],
    }));
    setSkillInput("");
  };

  const handleRemoveSkill = (indexToRemove) => {
    setData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleApplyFormatting = (tag) => {
    const textarea = document.getElementById("entry-description-editor");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = data.description.substring(start, end);
    let replacement = selectedText;

    if (tag === "bold") replacement = `**${selectedText || "text"}**`;
    else if (tag === "italic") replacement = `*${selectedText || "text"}*`;
    else if (tag === "underline") replacement = `<u>${selectedText || "text"}</u>`;
    else if (tag === "list") replacement = `\n• ${selectedText || "Bullet point"}`;
    else if (tag === "link") replacement = `[${selectedText || "link text"}](https://)`;

    const newDescription =
      data.description.substring(0, start) + replacement + data.description.substring(end);
    handleChange("description", newDescription);
  };

  const handleAiAction = async () => {
    if (!onAiEnhance) return;
    setIsEnhancing(true);
    try {
      const enhanced = await onAiEnhance(data.description, {
        title: data.title,
        subtitle: data.subtitle,
        type: sectionType,
      });
      if (enhanced) {
        handleChange("description", enhanced);
        toast.success("Description enhanced!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to enhance description with AI");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = () => {
    if (sectionType === "skills") {
      const categoryName = (data.category || data.title || "Skills").trim();
      const skillsList = Array.isArray(data.skills) ? data.skills.filter(Boolean) : [];
      onSave({
        ...entry,
        visible,
        data: {
          category: categoryName,
          skills: skillsList,
          name: categoryName,
          description: skillsList.join(", "),
        },
      });
      return;
    }

    // Normalise field names for legacy compatibility
    const normalizedData = {
      ...data,
      company: data.subtitle || data.company,
      position: data.title || data.position,
      start_date: data.startDate,
      end_date: data.endDate,
      is_current: data.isCurrent,
      institution: data.subtitle || data.institution,
      degree: data.title || data.degree,
      name: data.title || data.name,
      url: data.link || data.url,
    };

    onSave({
      ...entry,
      visible,
      data: normalizedData,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:p-5 space-y-4 transition-all w-full max-w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">Edit Entry</span>
          <span className="text-xs text-slate-400 capitalize">({sectionType})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tips Toggle */}
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              showTips
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Lightbulb className="size-3.5 text-amber-500" />
            Tips
          </button>

          {/* Visibility Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !visible;
              setVisible(next);
              if (onToggleVisibility) onToggleVisibility(next);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              visible
                ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
            title={visible ? "Hide from resume" : "Show on resume"}
          >
            {visible ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}
          </button>

          {/* Delete Icon */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
          <p className="font-semibold text-red-800">Delete this entry?</p>
          <p className="text-red-600">This action will remove the item from your resume.</p>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2.5 py-1 text-xs font-medium bg-white text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                if (onDelete) onDelete();
              }}
              className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Contextual Tips Box */}
      {showTips && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1">
            <Lightbulb className="size-3.5 text-amber-600" />
            <span>Tips for {sectionType} entries:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-800">
            {tips.map((tip, i) => (
              <li key={i} className="leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Input Fields */}
      {sectionType === "skills" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={data.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="e.g. Languages, Frontend, Cloud & DevOps, Databases"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skills in this category
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 min-h-[50px] bg-slate-50 border border-slate-200 rounded-lg mb-2">
              {(data.skills || []).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No skills added yet. Add one below!</span>
              ) : (
                (data.skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded-full border border-blue-200"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-blue-500 hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. React, Node.js or comma-separated)"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
              >
                Add
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tip: Separate multiple skills with commas and press Enter or click Add.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
        {/* Title + Link */}
        <div className="grid md:grid-cols-12 gap-3">
          <div className="md:col-span-8">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title / Position / Degree
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link / URL (Optional)
            </label>
            <input
              type="text"
              value={data.link}
              onChange={(e) => handleChange("link", e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Subtitle / Company / Institution */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subtitle / Company / Institution
          </label>
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            placeholder="e.g. Acme Corp / Stanford University"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dates + Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input
              type="month"
              value={data.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
            <input
              type="month"
              value={data.endDate}
              disabled={data.isCurrent}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={data.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Currently Active Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="entry-is-current"
            checked={data.isCurrent}
            onChange={(e) => {
              const isChecked = e.target.checked;
              handleChange("isCurrent", isChecked);
              if (isChecked) handleChange("endDate", "");
            }}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="entry-is-current" className="text-xs text-slate-700 select-none">
            {sectionType === "education" ? "I currently study here" : sectionType === "skills" ? "Still active" : "I currently work here"}
          </label>
        </div>

        {/* Description & Rich-Text Controls */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Description</label>

            {onAiEnhance && (
              <button
                type="button"
                onClick={handleAiAction}
                disabled={isEnhancing || !data.description}
                className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-md border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {isEnhancing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-purple-600" />
                )}
                Enhance with AI
              </button>
            )}
          </div>

          {/* Mini Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-t-lg">
            <button
              type="button"
              onClick={() => handleApplyFormatting("bold")}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              title="Bold"
            >
              <Bold className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleApplyFormatting("italic")}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              title="Italic"
            >
              <Italic className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleApplyFormatting("underline")}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              title="Underline"
            >
              <Underline className="size-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => handleApplyFormatting("list")}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              title="Bullet List"
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleApplyFormatting("link")}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              title="Insert Link"
            >
              <Link2 className="size-3.5" />
            </button>
          </div>

          <textarea
            id="entry-description-editor"
            rows={4}
            value={data.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Add key responsibilities, achievements, and impact..."
            className="w-full p-3 text-sm border border-t-0 border-slate-300 rounded-b-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
          />
        </div>
      </div>
      )}

      {/* Done / Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Check className="size-3.5" />
          Done
        </button>
      </div>
    </div>
  );
};

export default EntryEditor;
