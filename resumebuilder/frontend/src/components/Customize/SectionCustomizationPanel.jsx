import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import SectionSettings from "./SectionSettings";
import EntrySettings from "./EntrySettings";
import { updateSectionCustomization, updateEntryCustomization } from "../../utils/sectionCustomization";
import { resetSectionCustomization, resetEntryCustomization } from "../../utils/resume";

/**
 * Contextual Section & Entry Customization panel for the Customize tab.
 * Lists all sections, allows expanding each to access:
 * - SectionSettings (controls section.customization)
 * - Per-entry settings (controls entry.customization)
 */
const SectionCustomizationPanel = ({ resumeData, onChange }) => {
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [activeEntryId, setActiveEntryId] = useState(null);

  const sections = Array.isArray(resumeData?.sections) ? resumeData.sections : [];

  const handleSectionCustomizationUpdate = (updatedSection) => {
    if (!updatedSection?._id) return;
    const newSections = sections.map((s) =>
      String(s._id) === String(updatedSection._id) ? updatedSection : s
    );
    onChange({ ...resumeData, sections: newSections });
  };

  const handleEntryCustomizationUpdate = (sectionId, updatedEntry) => {
    if (!updatedEntry?._id) return;
    const newSections = sections.map((s) => {
      if (String(s._id) !== String(sectionId)) return s;
      return {
        ...s,
        entries: (s.entries || []).map((e) =>
          String(e._id) === String(updatedEntry._id) ? updatedEntry : e
        ),
      };
    });
    onChange({ ...resumeData, sections: newSections });
  };

  const handleSectionReset = (section) => {
    const resetSection = resetSectionCustomization(section);
    handleSectionCustomizationUpdate(resetSection);
  };

  const handleEntryReset = (sectionId, entry) => {
    const resetEntry = resetEntryCustomization(entry);
    handleEntryCustomizationUpdate(sectionId, resetEntry);
  };

  if (sections.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
        No sections available. Add content in the Content tab to enable section customization.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Section & Entry Customization</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Fine-tune the appearance of each section and individual entry.
        </p>
      </div>

      {sections.map((section) => {
        const isOpen = expandedSectionId === section._id;
        const entries = Array.isArray(section.entries) ? section.entries : [];
        return (
          <div
            key={section._id}
            className="border border-slate-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedSectionId(isOpen ? null : section._id)
              }
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="size-4 text-slate-500" />
                ) : (
                  <ChevronRight className="size-4 text-slate-500" />
                )}
                <span className="text-sm font-semibold text-slate-800">
                  {section.title || "Untitled Section"}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {section.type}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-slate-200 bg-slate-50/40 px-4 py-4 space-y-5">
                {/* Section settings */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <SectionSettings
                    section={section}
                    onChange={handleSectionCustomizationUpdate}
                    onReset={() => handleSectionReset(section)}
                  />
                </div>

                {/* Entries */}
                {entries.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Entries
                    </h4>
                    {entries.map((entry) => {
                      const isEntryActive = activeEntryId === entry._id;
                      const entryTitle =
                        entry.data?.position ||
                        entry.data?.name ||
                        entry.data?.degree ||
                        entry.data?.title ||
                        entry.data?.language ||
                        entry.data?.text ||
                        (typeof entry.data === "string" ? entry.data : null) ||
                        `Entry ${entries.indexOf(entry) + 1}`;

                      return (
                        <div
                          key={entry._id}
                          className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEntryId(isEntryActive ? null : entry._id)
                            }
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isEntryActive ? (
                                <ChevronDown className="size-3.5 text-slate-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="size-3.5 text-slate-500 flex-shrink-0" />
                              )}
                              <span className="text-xs text-slate-700 truncate">
                                {entryTitle}
                              </span>
                              {entry.visible === false && (
                                <span className="text-[10px] text-amber-600 font-medium uppercase">
                                  Hidden
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {entry._id?.toString().slice(-6)}
                            </span>
                          </button>

                          {isEntryActive && (
                            <div className="border-t border-slate-200 bg-slate-50/40 px-3 py-3">
                              <EntrySettings
                                entry={entry}
                                parentSection={section}
                                onChange={(updated) =>
                                  handleEntryCustomizationUpdate(
                                    section._id,
                                    updated
                                  )
                                }
                                onReset={() => handleEntryReset(section._id, entry)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SectionCustomizationPanel;
