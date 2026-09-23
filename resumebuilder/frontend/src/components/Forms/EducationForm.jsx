/**
 * Data editor for a single Education entry.
 *
 * Contract:
 *   data     -> entry.data
 *   onChange -> receives updated entry.data
 *
 * It does NOT manage order, visibility, _id, or customization.
 */
const EducationForm = ({ data = {}, onChange }) => {
  const setField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const setIsCurrent = (isCurrent) => {
    onChange({
      ...data,
      isCurrent,
      ...(isCurrent ? { graduationDate: "" } : {}),
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input
          value={data.institution || ""}
          onChange={(e) => setField("institution", e.target.value)}
          type="text"
          placeholder="Institution Name"
          className="px-3 py-2 text-base rounded-lg"
        />
        <input
          value={data.degree || ""}
          onChange={(e) => setField("degree", e.target.value)}
          type="text"
          placeholder="Degree (e.g. Bachelor's, Master's, B.Sc, M.A, PhD)"
          className="px-3 py-2 text-base rounded-lg"
        />
        <input
          value={data.field || ""}
          onChange={(e) => setField("field", e.target.value)}
          type="text"
          placeholder="Field of Study (e.g. Computer Science)"
          className="px-3 py-2 text-base rounded-lg"
        />
        <input
          value={data.graduationDate || ""}
          onChange={(e) => setField("graduationDate", e.target.value)}
          type="month"
          disabled={data.isCurrent}
          className="px-3 py-2 text-sm rounded-lg disabled:bg-gray-100"
        />
        <input
          value={data.gpa || ""}
          onChange={(e) => setField("gpa", e.target.value)}
          type="number"
          step="0.01"
          min="0"
          max="10"
          disabled={data.isCurrent}
          className="px-3 py-2 text-sm rounded-lg disabled:bg-gray-100"
          placeholder="GPA (optional)"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.isCurrent || false}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Am currently studying here</span>
      </label>
    </div>
  );
};

export default EducationForm;
