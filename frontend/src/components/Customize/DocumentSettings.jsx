import React from "react";
import { Globe, Calendar, FileText } from "lucide-react";

const DocumentSettings = ({ resumeData = {}, onChange }) => {
  const doc = resumeData.document || {};
  const language = doc.language || "en";
  const dateFormat = doc.dateFormat || "MM/YYYY";
  const pageFormat = doc.pageFormat || "A4";

  const update = (patch) => {
    onChange({
      ...resumeData,
      document: { ...doc, ...patch },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          <FileText className="size-5 text-blue-600" />
          Document Settings
        </h2>
        <p className="text-xs text-slate-500">
          Configure language, date formatting, and page dimensions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between">
          <label htmlFor="doc-language" className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Globe className="size-3.5 text-blue-500" />
            Language
          </label>
          <div className="w-1/2">
            <select
              id="doc-language"
              value={language}
              onChange={(e) => update({ language: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between">
          <label htmlFor="doc-date-format" className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Calendar className="size-3.5 text-blue-500" />
            Date Format
          </label>
          <div className="w-1/2">
            <select
              id="doc-date-format"
              value={dateFormat}
              onChange={(e) => update({ dateFormat: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="MM/YYYY">MM/YYYY (e.g., 09/2026)</option>
              <option value="MMMM YYYY">MMMM YYYY (e.g., September 2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 16/09/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 09/16/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2026-09-16)</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between">
          <label htmlFor="doc-page-format" className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileText className="size-3.5 text-blue-500" />
            Page Format
          </label>
          <div className="w-1/2">
            <select
              id="doc-page-format"
              value={pageFormat}
              onChange={(e) => update({ pageFormat: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">US Letter (8.5 × 11 in)</option>
              <option value="Legal">US Legal (8.5 × 14 in)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSettings;
