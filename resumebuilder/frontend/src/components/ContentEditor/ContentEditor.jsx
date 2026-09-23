import React from "react";
import PersonalInfoEditor from "./PersonalInfoEditor";
import SectionList from "./SectionList";

const ContentEditor = ({
    resumeData,
    onChange,
    removeBackground,
    setRemoveBackground,
    expandedSections,
    accentColor,
    onEditEntry,
    onAddEntry,
}) => {
    const handleSectionsChange = (newSections) => {
        onChange({
            ...resumeData,
            sections: newSections,
        });
    };

    const handleDeleteSection = (sectionId) => {
        const updated = (resumeData.sections || [])
            .filter((s) => String(s._id) !== String(sectionId))
            .map((s, idx) => ({ ...s, order: idx }));
        onChange({
            ...resumeData,
            sections: updated,
        });
    };

    const handleReorderSections = (reordered) => {
        onChange({
            ...resumeData,
            sections: reordered,
        });
    };

    return (
        <div className="space-y-4">
            {/* 1. Personal Information (Always visible at the top) */}
            <PersonalInfoEditor
                resumeData={resumeData}
                setResumeData={onChange}
                removeBackground={removeBackground}
                setRemoveBackground={setRemoveBackground}
                accentColor={accentColor}
            />

            {/* 2. Drag-and-drop Expandable Content Sections */}
            <SectionList
                sections={resumeData.sections || []}
                onChange={handleSectionsChange}
                onDeleteSection={handleDeleteSection}
                onReorderSections={handleReorderSections}
                expandedSections={expandedSections}
                onEditEntry={onEditEntry}
                onAddEntry={onAddEntry}
            />
        </div>
    );
};

export default ContentEditor;