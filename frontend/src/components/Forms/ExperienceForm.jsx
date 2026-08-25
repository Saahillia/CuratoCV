import { Briefcase, Loader2, Plus, Sparkle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import api from "../../configs/api";
import toast from "react-hot-toast";

const ExperienceForm = ({ data = [], onChange }) => {

    const {token} = useSelector((state) => state.auth);
    const [generatingIndex, setGeneratingIndex] = useState(-1);

    const addExperience = () => {
        const newExperience = {
        company: "",
        position: "",
        start_date: "",
        end_date: "",
        description: "",
        is_current: false,
        };
        onChange([...data, newExperience]);
    };

    const removeExperience = (index) => {
        const updated = data.filter((_, i) => i !== index);
        onChange(updated);
    };

    const updateExperience = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const generateDescription = async (index) => {
        setGeneratingIndex(index);
        const experience = data[index];
        const prompt = `enhance this job description ${experience.description} for the position of ${experience.position} at ${experience.company}. Make it more compelling and highlight key achievements.`;

        try {
            const {data} = await api.post("api/ai/enhance-job-desc", {userContent:prompt}, {headers: {"Authorization": `Bearer ${token}`}})
            updateExperience(index, "description", data.enhancedContent);
        } catch (error) {
            toast.error(error.message)
        }finally{
            setGeneratingIndex(-1);
        }
        
    }
return (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Professional Experience
            </h3>
            <p className="text-sm text-gray-500">Add your job experience</p>
            </div>
            <button
            onClick={addExperience}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
            <Plus className="size-4" /> Add Experience
            </button>
        </div>

        {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 " />
            <p>No experience added yet.</p>
            <p>Click "Add Experience" to get started.</p>
            </div>
        ) : (
            <div className="space-y-4">
            {data.map((experience, index) => (
                <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg space-y-3 "
                >
                <div className="flex items-start justify-between">
                    <h4>Experience #{index + 1}</h4>
                    <button
                    onClick={() => removeExperience(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    >
                    <Trash2 className="size-4" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <input
                    value={experience.company || ""}
                    onChange={(e) =>
                        updateExperience(index, "company", e.target.value)
                    }
                    type="text"
                    placeholder="Company Name"
                    className="px-3 py-2 text-sm rounded-lg"
                    />
                    <input
                    value={experience.position || ""}
                    onChange={(e) =>
                        updateExperience(index, "position", e.target.value)
                    }
                    type="text"
                    placeholder="Job Title"
                    className="px-3 py-2 text-sm rounded-lg"
                    />
                    <input
                    value={experience.start_date || ""}
                    onChange={(e) =>
                        updateExperience(index, "start_date", e.target.value)
                    }
                    type="month"
                    className="px-3 py-2 text-sm rounded-lg"
                    />

                    <input
                    value={experience.end_date || ""}
                    onChange={(e) =>
                        updateExperience(index, "end_date", e.target.value)
                    }
                    type="month"
                    disabled={experience.is_current}
                    className="px-3 py-2 text-sm rounded-lg disabled:bg-gray-100"
                    />
                </div>

                <label>
                    <input
                    type="checkbox"
                    checked={experience.is_current || false}
                    onChange={(e) => {
                        const isCurrent = e.target.checked;
                        const updated = [...data];
                        updated[index] = {
                        ...updated[index],
                        is_current: isCurrent,
                        ...(isCurrent ? { end_date: "" } : {}),
                        };
                        onChange(updated);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                    I currently work here
                    </span>
                </label>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                        Job Description
                    </label>
                    <button onClick={() => generateDescription(index)} disabled={generatingIndex === index || !experience.position || !experience.company} className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled: opacity-50">
                        {generatingIndex === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) :(
                        <Sparkle className="w-3 h-3" /> 
                        )}
                        Enhance with AI
                    </button>
                    </div>
                    <textarea
                    value={experience.description || ""}
                    onChange={(e) =>
                        updateExperience(index, "description", e.target.value)
                    }
                    rows={4}
                    placeholder="Describe your key responsibilities and Experience ..."
                    className="w-full px-3 py-2 text-sm rounded-lg resize-none"
                    />
                </div>
                </div>
            ))}
            </div>
        )}
        </div>
    );
};

export default ExperienceForm;
