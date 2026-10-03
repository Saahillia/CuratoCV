const pulse = "animate-pulse rounded bg-slate-200";
const Line = ({ className = "" }) => <div aria-hidden="true" className={`${pulse} ${className}`} />;

const ResumeSkeleton = ({ type = "dashboard" }) => {
    const label = type === "editor" ? "Loading resume editor" : type === "preview" ? "Loading resume preview" : "Loading your resumes";
    return (
        <section role="status" aria-label={label} aria-busy="true" className="min-h-screen bg-[#F3F7FA]">
            <span className="sr-only">{label}…</span>
            {type === "editor" ? (
                <div className="flex min-h-screen flex-col bg-slate-100"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8"><Line className="h-8 w-36" /><Line className="h-9 w-32" /></header><main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-4 lg:flex-row lg:p-6"><div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:w-[46%]"><Line className="h-7 w-2/3" /><Line className="h-12 w-full" /><Line className="h-12 w-full" /><Line className="h-28 w-full" /><Line className="h-12 w-full" /><Line className="h-28 w-full" /></div><div className="flex min-h-[50vh] flex-1 items-start justify-center rounded-2xl bg-slate-200/60 p-5"><div className="min-h-[680px] w-full max-w-[480px] space-y-5 bg-white p-8 shadow-sm"><Line className="mx-auto h-8 w-1/2" /><Line className="h-4 w-full" /><Line className="h-4 w-5/6" /><Line className="mt-8 h-5 w-1/3" /><Line className="h-20 w-full" /></div></div></main></div>
            ) : type === "preview" ? (
                <div className="mx-auto max-w-6xl space-y-6 px-4 py-8"><header className="flex justify-between"><Line className="h-10 w-32" /><Line className="h-10 w-40" /></header><div className="mx-auto min-h-[75vh] max-w-[820px] space-y-6 bg-white p-8 shadow-md sm:p-12"><Line className="mx-auto h-8 w-1/2" /><Line className="h-4 w-1/3" /><Line className="mt-10 h-5 w-1/4" /><Line className="h-24 w-full" /><Line className="h-5 w-1/4" /><Line className="h-28 w-full" /></div></div>
            ) : (
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><Line className="size-14 shrink-0 rounded-2xl" /><div className="space-y-3"><Line className="h-7 w-56 max-w-full" /><Line className="h-4 w-64 max-w-full" /></div></div><Line className="h-16 w-48" /></div><div className="flex flex-wrap justify-between gap-4"><Line className="h-8 w-48" /><Line className="h-11 w-48" /></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((card) => <div key={card} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"><Line className="h-48 w-full" /><Line className="h-5 w-2/3" /><Line className="h-4 w-1/2" /></div>)}</div></div>
            )}
        </section>
    );
};

export default ResumeSkeleton;
