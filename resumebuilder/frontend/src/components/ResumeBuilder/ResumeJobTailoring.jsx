import { useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, Sparkles } from "lucide-react";
import aiService from "../../services/aiService";

const ScoreCard = ({ title, score, caption }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-baseline justify-between gap-3"><h3 className="text-sm font-semibold text-slate-800">{title}</h3><span className="text-2xl font-bold text-slate-900">{score ?? "—"}<span className="text-sm font-medium text-slate-500">/100</span></span></div>
        <p className="mt-1 text-xs leading-5 text-slate-600">{caption}</p>
    </div>
);

export default function ResumeJobTailoring({ resumeData, resumeId, resumeVersion, isSaving, onApplyChanges }) {
    const [jobDescription, setJobDescription] = useState("");
    const [targetRole, setTargetRole] = useState(resumeData?.personalInfo?.profession || "");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [result, setResult] = useState(null);
    const [selected, setSelected] = useState({});
    const [editedText, setEditedText] = useState({});
    const [projected, setProjected] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const suggestions = result?.suggestions || [];
    const selectedSuggestions = useMemo(() => suggestions.filter((item) => selected[item.id] !== false).map((item) => ({ ...item, newText: editedText[item.id] ?? item.newText })), [suggestions, selected, editedText]);

    const analyze = async (event) => {
        event.preventDefault();
        setBusy(true); setError(""); setResult(null); setProjected(null);
        try {
            const data = await aiService.analyzeResumeForJob({ resumeId, jobDescription, targetRole, experienceLevel, expectedVersion: resumeVersion });
            setResult(data);
            setSelected(Object.fromEntries((data.suggestions || []).map((item) => [item.id, true])));
            setEditedText({});
        } catch (err) {
            setError(err?.response?.data?.message || "Analysis failed. Check your connection and try again.");
        } finally { setBusy(false); }
    };

    const scoreDraft = async () => {
        setBusy(true); setError("");
        try {
            const data = await aiService.scoreResumeDraft({
                resumeId, expectedVersion: result.resumeVersion, analysisToken: result.analysisToken,
                acceptedSuggestions: selectedSuggestions.map(({ sectionId, entryId, field, oldText, newText }) => ({ sectionId, entryId, field, oldText, newText })),
            });
            setProjected(data);
        } catch (err) { setError(err?.response?.data?.message || "Could not score this draft. Please analyze again."); }
        finally { setBusy(false); }
    };

    const applySelected = () => {
        if (!selectedSuggestions.length) return;
        if (!onApplyChanges(selectedSuggestions)) {
            setError("Your resume draft has changed since this analysis. Run the analysis again before applying suggestions.");
            return;
        }
        setResult(null); setProjected(null); setError("Selected changes are in your editor draft. Review them in the resume preview; the existing autosave will save your approved edits.");
    };

    return (
        <div className="space-y-5 p-1 sm:p-2" aria-busy={busy}>
            <header className="flex items-start gap-3"><div className="rounded-lg bg-violet-100 p-2 text-violet-700"><Sparkles size={20} aria-hidden="true" /></div><div><h2 className="text-lg font-bold text-slate-900">Tailor this resume to a job</h2><p className="mt-1 text-sm text-slate-600">Use your saved resume as the source. Review every suggestion before it changes your draft.</p></div></header>
            <form onSubmit={analyze} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <label className="block text-sm font-semibold text-slate-800" htmlFor="tailor-jd">Job description <span className="text-red-700">(required)</span></label>
                <textarea id="tailor-jd" required maxLength={12000} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={8} className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600" placeholder="Paste the job description here (up to 12,000 characters)." />
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">Target role <span className="font-normal text-slate-500">(optional)</span><input maxLength={120} value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3" placeholder="e.g. Backend Engineer" /></label>
                    <label className="block text-sm font-medium text-slate-700">Experience level <span className="font-normal text-slate-500">(optional)</span><input maxLength={80} value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3" placeholder="e.g. Mid-level" /></label>
                </div>
                <button type="submit" disabled={busy || !resumeId || !jobDescription.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />} Analyze resume</button>
                <p className="text-xs leading-5 text-slate-500">JD Match estimates how your resume evidence aligns with this job. It is not an ATS, interview, or job guarantee.</p>
            </form>

            {error && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{error}</p>}
            {result && <>
                <div className="grid gap-3 sm:grid-cols-2">
                    <ScoreCard title="JD Match" score={projected?.jdMatch?.score ?? result.jdMatch?.score} caption="Evidence alignment with this specific job description; not hiring probability." />
                    <ScoreCard title="ATS Readiness" score={projected?.atsReadiness?.score ?? result.atsReadiness?.score} caption="Observable structure checks only; this does not simulate an employer's ATS." />
                </div>
                {result.jdMatch?.breakdown?.length > 0 && <section className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-semibold text-slate-900">JD Match breakdown <span className="text-xs font-normal text-slate-500">({result.jdMatch.rubricVersion})</span></h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.jdMatch.breakdown.map((item) => <div key={item.category} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="capitalize text-slate-700">{item.category} <span className="text-xs text-slate-500">· effective weight {item.effectiveWeight}%</span></span><strong className="text-slate-900">{item.score}/100</strong></div>)}</div><p className="mt-2 text-xs leading-5 text-slate-500">Categories not present in a JD are excluded, then the remaining weights are normalized to 100%. Required items carry full weight; preferred items carry half weight. Duplicate labels count once. The model does not return a score.</p></section>}
                {projected && <p role="status" className="rounded-lg bg-violet-50 p-3 text-sm font-medium text-violet-950">Current → selected draft: JD Match {result.jdMatch.score} → {projected.jdMatch.score}; ATS Readiness {result.atsReadiness.score} → {projected.atsReadiness.score}.</p>}
                {result.jdMatch?.criticalGaps?.length > 0 && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4"><h3 className="flex items-center gap-2 font-semibold text-amber-950"><AlertTriangle size={18} /> Required gaps to review</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">{result.jdMatch.criticalGaps.map((gap, index) => { const item = result.requirements.find((requirement) => requirement.label === gap); const explanation = item?.evidence ? item.match === "related" ? `Related evidence (${item.evidence}) was found, but it does not establish this requirement.` : `Resume text was found (${item.evidence}), but its relationship to this requirement could not be verified.` : "No verified resume evidence was found."; return <li key={`${gap}-${index}`}><strong>{gap}</strong> — {explanation}</li>; })}</ul><p className="mt-2 text-xs text-amber-900">If you genuinely have this experience, add your real example in the editor. The AI will not invent evidence.</p></div>}
                {result.jdMatch?.keywordRepetition?.length > 0 && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Repeated keywords detected: {result.jdMatch.keywordRepetition.join(", ")}. Repetition does not increase your JD Match score; keep each skill tied to genuine experience.</p>}
                <section className="space-y-3"><div><h3 className="font-bold text-slate-900">Requirements and evidence</h3><p className="text-xs text-slate-600">Each item is traced to supplied resume text or shown as a gap.</p></div>
                    {result.requirements.map((item, index) => <article key={item.id || index} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.priority === "required" ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-700"}`}>{item.priority}</span><span className="font-semibold text-slate-900">{item.label}</span><span className="ml-auto text-xs text-slate-600">{item.match}</span></div>{item.evidence ? <p className="mt-2 text-sm text-slate-700"><strong>Evidence:</strong> {item.evidence}</p> : <p className="mt-2 text-sm text-amber-900">No verified evidence found in this resume.</p>}</article>)}
                </section>
                <section className="space-y-3"><div><h3 className="font-bold text-slate-900">Section suggestions</h3><p className="text-xs text-slate-600">Review facts carefully. Suggestions with verified source evidence only are included.</p></div>
                    {!suggestions.length && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">No safe text changes were found. Review the requirement gaps above.</p>}
                    {suggestions.map((item) => <article key={item.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" className="size-5 accent-violet-700" checked={selected[item.id] !== false} onChange={(event) => { setSelected((old) => ({ ...old, [item.id]: event.target.checked })); setProjected(null); }} /> Include this suggestion</label>
                        <div className="grid gap-3 lg:grid-cols-2"><div className="rounded-lg border border-red-200 bg-red-50 p-3"><h4 className="text-xs font-bold uppercase tracking-wide text-red-900">Existing</h4><p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.oldText}</p></div><div className="rounded-lg border border-green-200 bg-green-50 p-3"><label className="text-xs font-bold uppercase tracking-wide text-green-900" htmlFor={`suggestion-${item.id}`}>Suggested · editable</label><textarea id={`suggestion-${item.id}`} maxLength={1800} value={editedText[item.id] ?? item.newText} onChange={(event) => { setEditedText((old) => ({ ...old, [item.id]: event.target.value })); setProjected(null); }} rows={4} className="mt-2 min-h-24 w-full resize-y bg-transparent text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-700" /></div></div>
                        <p className="text-sm text-slate-700"><strong>Why:</strong> {item.why}</p><p className="text-sm text-slate-700"><strong>Benefit:</strong> {item.benefit}</p><p className="text-xs text-slate-600"><strong>Requirement:</strong> {item.requirement}</p>
                    </article>)}
                </section>
                {result.atsReadiness?.findings?.length > 0 && <section className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-semibold text-slate-900">Resume health notes</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{result.atsReadiness.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul></section>}
                {result.atsReadiness?.templateRecommendation && <section className="rounded-xl border border-violet-200 bg-violet-50 p-4"><h3 className="font-semibold text-violet-950">Template compatibility</h3><p className="mt-1 text-sm text-violet-950">{result.atsReadiness.templateRecommendation.changeRecommended ? `Consider ${result.atsReadiness.templateRecommendation.template}` : "Your current template has the simpler layout profile in this template set."}: {result.atsReadiness.templateRecommendation.reason}</p><p className="mt-2 text-xs text-violet-900">This is based on CuratoCV renderer layout structure. It is not a guarantee of how an employer's parser will read an exported PDF.</p></section>}
                <div className="sticky bottom-2 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg sm:flex-row sm:justify-end"><button type="button" disabled={busy || !result.analysisToken} onClick={scoreDraft} className="min-h-11 rounded-lg border border-violet-700 px-4 text-sm font-semibold text-violet-800 disabled:opacity-50">{busy ? "Scoring…" : "Recalculate selected draft"}</button><button type="button" disabled={busy || isSaving || !selectedSuggestions.length || !projected} onClick={applySelected} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"><Check size={17} /> Apply reviewed changes</button></div>
                <p className="text-xs leading-5 text-slate-500">Applying puts your approved edits into the existing resume editor draft. Review the live preview; its version-aware autosave persists changes.</p>
            </>}
        </div>
    );
}
