import { Plus, X, Sparkles, FileText, GraduationCap, Briefcase, FolderOpen, Sparkle, Languages, Award, BookOpen, Building2, Newspaper, UserCheck, ShieldCheck, PenTool, Layers } from "lucide-react";
import { useState } from "react";
import resumeSections from "../../constants/resumeSections";

const typeMeta = {
  summary: { label: "Summary", icon: FileText, desc: "Professional summary / bio" },
  experience: { label: "Experience", icon: Briefcase, desc: "Work history" },
  education: { label: "Education", icon: GraduationCap, desc: "Degrees & schools" },
  skills: { label: "Skills", icon: Sparkle, desc: "Technical & soft skills" },
  projects: { label: "Projects", icon: FolderOpen, desc: "Portfolio pieces" },
  certificates: { label: "Certificates", icon: Award, desc: "Certifications" },
  courses: { label: "Courses", icon: BookOpen, desc: "Online / completed courses" },
  awards: { label: "Awards", icon: Layers, desc: "Honors & recognitions" },
  languages: { label: "Languages", icon: Languages, desc: "Spoken & written" },
  interests: { label: "Interests", icon: Sparkles, desc: "Hobbies & passions" },
  organisations: { label: "Organisations", icon: Building2, desc: "Memberships" },
  publications: { label: "Publications", icon: Newspaper, desc: "Papers & articles" },
  references: { label: "References", icon: UserCheck, desc: "Professional refs" },
  declaration: { label: "Declaration", icon: ShieldCheck, desc: "Statement / affidavit" },
  custom: { label: "Custom", icon: PenTool, desc: "Your own section" },
};

const AddContent = ({ open, onClose, onAdd, existingTypes = [] }) => {
  const [selected, setSelected] = useState(null);

  if (!open) return null;

  const addable = resumeSections.addable || [];
  const isPresent = (t) => existingTypes.some((et) => et === t);

  const handleAdd = (type) => {
    const def = resumeSections.getDefinition(type);
    const canAdd = def?.supportsMultiple || !existingTypes.includes(type);
    if (!canAdd) return;
    onAdd(type, def?.defaultTitle || type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Add Content</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-slate-500" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {addable.map((type) => {
            const meta = typeMeta[type] || { label: type, icon: FileText, desc: "" };
            const Icon = meta.icon;
            const present = isPresent(type);
            const def = resumeSections.getDefinition(type);
            const canAdd = def?.supportsMultiple || !present;

            return (
              <button
                key={type}
                onClick={() => canAdd && handleAdd(type)}
                disabled={!canAdd}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                  canAdd
                    ? "border-gray-200 hover:border-blue-300 hover:shadow-md bg-white hover:-translate-y-0.5"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">{meta.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                  {present && !def?.supportsMultiple && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Already added</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-slate-400">
          Custom sections allow any title and multiple entries. Non-replaceable types (Summary, Declaration) can only appear once.
        </div>
      </div>
    </div>
  );
};

export default AddContent;
