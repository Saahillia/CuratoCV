/**
 * Data editor for a single Project entry.
 *
 * Contract:
 *   data     -> entry.data
 *   onChange -> receives updated entry.data
 *
 * It does NOT manage order, visibility, _id, or customization.
 */
const ProjectForm = ({ data = {}, onChange }) => {
  const setField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid gap-3">
      <input
        value={data.name || ""}
        onChange={(e) => setField("name", e.target.value)}
        type="text"
        placeholder="Project Name"
        className="px-3 py-2 text-base rounded-lg"
      />
      <input
        value={data.url || data.link || ""}
        onChange={(e) => setField("url", e.target.value)}
        type="text"
        placeholder="Project Link / URL (e.g. https://github.com/...)"
        className="px-3 py-2 text-base rounded-lg"
      />
      <input
        value={data.technologies || data.type || ""}
        onChange={(e) => setField("technologies", e.target.value)}
        type="text"
        placeholder="Technologies / Tech Stack (e.g. React, Node.js)"
        className="px-3 py-2 text-base rounded-lg"
      />
      <textarea
        rows="4"
        value={data.description || ""}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Describe your project..."
        className="w-full px-3 py-2 text-sm rounded-lg resize-none"
      />
    </div>
  );
};

export default ProjectForm;
