const pulse = "animate-pulse rounded bg-slate-200";
const Line = ({ className = "" }) => <div aria-hidden="true" className={`${pulse} ${className}`} />;

const MemoSkeleton = ({ type = "workspace" }) => {
    const label = type === "editor" ? "Loading Memo editor" : "Loading Memo workspace";
    return (
        <section role="status" aria-label={label} aria-busy="true" className="min-h-svh bg-[#F5F8FB]">
            <span className="sr-only">{label}…</span>
            {type === "editor" ? (
                <div className="min-h-svh"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4"><Line className="h-9 w-36" /><Line className="h-9 w-40" /></header><main className="mx-auto grid max-w-[1500px] gap-5 p-4 lg:grid-cols-[260px_1fr]"><aside className="hidden space-y-4 rounded-xl bg-white p-4 lg:block"><Line className="h-6 w-2/3" /><Line className="h-10 w-full" /><Line className="h-10 w-full" /><Line className="h-10 w-full" /></aside><div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-8"><Line className="h-10 w-1/2" /><Line className="h-5 w-full" /><Line className="h-5 w-5/6" /><Line className="h-[55vh] w-full" /></div></main></div>
            ) : (
                <div><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4"><Line className="h-10 w-36" /><Line className="h-10 w-40" /></header><div className="mx-auto grid max-w-[1600px] gap-5 p-4 md:grid-cols-[260px_1fr]"><aside className="hidden space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:block"><Line className="h-7 w-2/3" />{[0, 1, 2, 3, 4, 5].map((row) => <Line key={row} className="h-9 w-full" />)}</aside><main className="space-y-5"><div className="space-y-3"><Line className="h-8 w-48" /><Line className="h-4 w-72 max-w-full" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((card) => <div key={card} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><Line className="h-5 w-2/3" /><Line className="h-24 w-full" /><Line className="h-4 w-1/2" /></div>)}</div></main></div></div>
            )}
        </section>
    );
};

export default MemoSkeleton;
