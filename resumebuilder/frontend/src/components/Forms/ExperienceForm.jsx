/**
 * Developer context for resumebuilder/frontend/src/components/Forms/ExperienceForm.jsx.
 * Purpose: edit one Resume Builder resume-entry type (Experience Form).
 * Why here: field-specific input behavior remains close to its domain form and is composed by the content editor.
 */
import { Loader2, Sparkle } from "lucide-react";
import { useState } from "react";
import api from "@curatocv/api-client";
import toast from "react-hot-toast";

/**
 * Data editor for a single Experience entry.
 *
 * Contract:
 *   data     -> entry.data
 *   onChange -> receives updated entry.data
 *
 * It does NOT manage order, visibility, _id, or customization.
 * Those concerns live in EntryList / SectionRenderer / ResumeBuilder.
 */
const ExperienceForm = ({ data = {}, onChange }) => {
  const [generating, setGenerating] = useState(false);

  const setField = (field, value) => {
    // Send a new object upward instead of mutating props; the parent owns the
    // resume document and decides when the updated entry should be saved.
    onChange({ ...data, [field]: value });
  };

  const setIsCurrent = (isCurrent) => {
    // A current job has no end date. Clearing it here prevents contradictory
    // values from being stored when the checkbox is turned on.
    onChange({
      ...data,
      isCurrent,
      ...(isCurrent ? { endDate: "" } : {}),
    });
  };

  const generateDescription = async () => {
    setGenerating(true);
    // Context helps the backend produce relevant wording. The backend remains
    // responsible for authentication, limits, and AI-credit enforcement.
    const prompt = `enhance this job description ${data.description || ""} for the position of ${data.position || ""} at ${data.company || ""}. Make it more compelling and highlight key achievements.`;

    try {
      const response = await api.post("/ai/enhance-job-desc", {
        userContent: prompt,
      });
      setField("description", response.data.enhancedContent);
    } catch (error) {
      // Keep the user's existing text intact and show a recoverable message.
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input
          value={data.company || ""}
          onChange={(e) => setField("company", e.target.value)}
          type="text"
          placeholder="Company Name"
          className="px-3 py-2 text-base rounded-lg"
        />
        <input
          value={data.position || ""}
          onChange={(e) => setField("position", e.target.value)}
          type="text"
          placeholder="Job Title"
          className="px-3 py-2 text-base rounded-lg"
        />
        <input
          value={data.startDate || ""}
          onChange={(e) => setField("startDate", e.target.value)}
          type="month"
          className="px-3 py-2 text-base rounded-lg"
        />
        <input
          value={data.endDate || ""}
          onChange={(e) => setField("endDate", e.target.value)}
          type="month"
          disabled={data.isCurrent}
          className="px-3 py-2 text-sm rounded-lg disabled:bg-gray-100"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.isCurrent || false}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">I currently work here</span>
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Job Description
          </label>
          <button
            type="button"
            onClick={generateDescription}
            disabled={
              generating || !data.position || !data.company
            }
            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkle className="w-3 h-3" />
            )}
            Enhance with AI
          </button>
        </div>
        <textarea
          value={data.description || ""}
          onChange={(e) => setField("description", e.target.value)}
          rows={4}
          placeholder="Describe your key responsibilities and achievements..."
          className="w-full px-3 py-2 text-sm rounded-lg resize-none"
        />
      </div>
    </div>
  );
};

export default ExperienceForm;
