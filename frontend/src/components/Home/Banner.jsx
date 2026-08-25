import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden border-b border-[#1D3557]/10 bg-[#1D3557]">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute right-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[#00BFA6]/15 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[#4A90E2]/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-11 items-center justify-center px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">

          {/* New Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[#00BFA6]" />
            New
          </span>

          {/* Message */}
          <p className="font-medium text-white">
            Build smarter with{" "}
            <span className="font-semibold text-white">
              CuratoCV AI
            </span>

            <span className="mx-1.5 text-white/50">—</span>

            Turn your experience into{" "}
            <span className="font-semibold text-[#00BFA6]">
              ATS-ready content.
            </span>
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="group inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1D3557] transition-all hover:bg-[#F8FAFC]"
          >
            Try it now

            <ArrowRight className="size-3.5 text-[#00BFA6] transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;