const pulse = "animate-pulse rounded bg-slate-200";

const Line = ({ className = "" }) => <div aria-hidden="true" className={`${pulse} ${className}`} />;
const Card = ({ className = "" }) => <div aria-hidden="true" className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`} />;

const PlatformSkeleton = ({ type = "profile" }) => {
    const label = type === "billing" ? "Loading billing details" : type === "pricing" ? "Loading plans" : type === "checkout" ? "Loading checkout" : type === "settings" ? "Loading account settings" : "Loading your profile";

    return (
        <section role="status" aria-label={label} aria-busy="true" className="w-full">
            <span className="sr-only">{label}…</span>
            {type === "billing" ? (
                <div className="space-y-5">
                    <Card className="space-y-4"><Line className="h-4 w-28" /><Line className="h-8 w-2/3" /><Line className="h-4 w-1/2" /></Card>
                    <Line className="h-6 w-40" />
                    <Card className="space-y-4"><Line className="h-4 w-24" /><Line className="h-3 w-full" /><Line className="h-4 w-32" /><Line className="h-3 w-full" /></Card>
                    <Line className="h-11 w-full" />
                </div>
            ) : type === "pricing" ? (
                <div className="grid gap-5 md:grid-cols-3">
                    {[0, 1, 2].map((item) => <Card key={item} className="min-h-80 space-y-5"><Line className="h-5 w-2/3" /><Line className="h-10 w-1/2" /><Line className="h-4 w-full" /><Line className="h-4 w-5/6" /><Line className="mt-10 h-11 w-full" /></Card>)}
                </div>
            ) : type === "checkout" ? (
                <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><Card className="space-y-5"><Line className="h-7 w-1/2" /><Line className="h-12 w-full" /><Line className="h-12 w-full" /><Line className="h-12 w-full" /><Line className="h-12 w-full" /></Card><Card className="space-y-5"><Line className="h-6 w-2/3" /><Line className="h-4 w-full" /><Line className="h-4 w-5/6" /><Line className="mt-10 h-12 w-full" /></Card></div>
            ) : type === "settings" ? (
                <div className="space-y-7"><Line className="h-8 w-48" /><Line className="h-4 w-3/4" />{[0, 1, 2].map((section) => <div key={section} className="space-y-3"><Line className="h-5 w-40" /><div className="grid gap-4 md:grid-cols-2"><Card className="min-h-36 space-y-4"><Line className="h-5 w-1/2" /><Line className="h-4 w-full" /><Line className="h-10 w-36" /></Card><Card className="min-h-36 space-y-4"><Line className="h-5 w-1/2" /><Line className="h-4 w-full" /><Line className="h-10 w-36" /></Card></div></div>)}</div>
            ) : (
                <div className="space-y-5"><Line className="h-4 w-28" /><Line className="h-8 w-40" /><Line className="h-4 w-2/3" /><Card className="flex flex-col gap-4 sm:flex-row sm:items-center"><Line className="size-16 shrink-0 rounded-2xl" /><div className="flex-1 space-y-3"><Line className="h-6 w-48" /><Line className="h-4 w-64 max-w-full" /></div><Line className="h-14 w-40" /></Card><Card className="space-y-4"><Line className="h-6 w-52" /><Line className="h-12 w-full" /><Line className="h-10 w-28" /></Card><Card className="space-y-4"><Line className="h-6 w-44" /><div className="grid gap-4 sm:grid-cols-2"><Line className="h-28" /><Line className="h-28" /></div></Card></div>
            )}
        </section>
    );
};

export default PlatformSkeleton;
