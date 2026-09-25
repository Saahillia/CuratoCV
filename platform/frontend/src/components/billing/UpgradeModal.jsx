import React from "react";
import { XIcon, CheckCircle2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UpgradeModal = ({ isOpen, onClose, title, message }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <XIcon className="size-5" />
        </button>

        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title || "Upgrade to Pro"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {message || "You've reached your plan's limit. Upgrade your plan to unlock more resumes, AI credits, and premium customization."}
        </p>

        <ul className="mt-6 space-y-3">
          <li className="flex items-center gap-3 text-sm text-slate-700">
            <CheckCircle2Icon className="size-5 text-blue-500" /> Wait, create more resumes easily
          </li>
          <li className="flex items-center gap-3 text-sm text-slate-700">
            <CheckCircle2Icon className="size-5 text-blue-500" /> Unlock premium templates
          </li>
          <li className="flex items-center gap-3 text-sm text-slate-700">
            <CheckCircle2Icon className="size-5 text-blue-500" /> Get 200+ AI rewrite credits
          </li>
        </ul>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              navigate("/pricing");
            }}
            className="w-full rounded-xl bg-[#17375F] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#112641]"
          >
            Check Plans & Pricing
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;