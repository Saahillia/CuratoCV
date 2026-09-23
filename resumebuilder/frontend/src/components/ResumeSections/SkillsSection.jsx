import React from "react";

const SkillsSection = ({
    section = {},
    entries = [],
    colors = {},
    typography = {},
    spacing = {},
}) => {
    const rawEntries = entries.length > 0 ? entries : section.entries || [];
    const visibleEntries = rawEntries.filter((e) => e.visible !== false);

    if (visibleEntries.length === 0) return null;

    return (
        <div className="space-y-2">
            {visibleEntries.map((entry, index) => {
                const data = entry.data || {};
                const category = data.category || data.name || data.title || "";
                let skills = [];

                if (Array.isArray(data.skills)) {
                    skills = data.skills;
                } else if (typeof data.description === "string" && data.description) {
                    skills = data.description.split(",").map((s) => s.trim()).filter(Boolean);
                }

                return (
                    <div key={entry._id || index} className="text-sm">
                        {category ? (
                            <span className="font-semibold text-slate-800">
                                {category}:{" "}
                            </span>
                        ) : null}
                        <span className="text-slate-700">
                            {skills.length > 0 ? skills.join(", ") : (data.description || "")}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default SkillsSection;
