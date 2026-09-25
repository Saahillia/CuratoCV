import React from "react";
import { ArrowRight } from "lucide-react";

const PlanCard = ({ plan, selectedPeriod, onSelectPeriod, onSubscribe }) => {
  // Get the billing option for the selected period
  const billingOption = plan.billing?.periods[selectedPeriod] || null;

  // Calculate price display: amount is in INR (e.g., 199 for ₹199)
  const priceDisplay = billingOption ? `₹${billingOption.amount}` : "Free";
  const periodLabel = selectedPeriod === "monthly" ? "/mo" : "";

  // Determine if this is the free plan
  const isFree = plan.id === "free";

  // Get resume limit display
  const resumeLimitDisplay =
    plan.resumeLimit === null ? "Unlimited" : `${plan.resumeLimit} Resumes`;

  // Get AI credits display
  const aiCreditsDisplay = plan.ai.enabled
    ? `${plan.ai.creditsPerBillingPeriod} AI credits/month`
    : "No AI";

  // Handle subscribe action
  const handleSubscribe = () => {
    if (isFree) {
      // Redirect to app/dashboard for free plan
      onSubscribe?.("/app");
    } else if (billingOption) {
      // Redirect to checkout with plan and period
      onSubscribe?.(`/checkout?plan=${plan.id}&period=${selectedPeriod}`);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow p-8 border border-slate-100 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
        {!isFree && (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#17375F] text-white">
            Popular
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 mt-2">{plan.description}</p>

      {/* Price */}
      <div className="mt-4 text-3xl font-extrabold text-[#17375F]">
        {priceDisplay}{periodLabel}
      </div>

      {/* Features */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Includes</h4>
        <ul className="space-y-2 text-sm text-slate-600">
          {/* Resume limit */}
          <li className="flex items-center gap-2">
            <ArrowRight className="size-4 text-[#17375F]" />
            {resumeLimitDisplay}
          </li>
          {/* AI credits */}
          <li className="flex items-center gap-2">
            <ArrowRight className="size-4 text-[#17375F]" />
            {aiCreditsDisplay}
          </li>
          {/* Other features */}
          {Object.entries(plan.features).map(([key, value]) => {
            // Skip ai and resumeLimit as we already displayed them
            if (key === "ai" || key === "resumeLimit") return null;
            const label = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());
            return (
              <li key={key} className="flex items-center gap-2">
                <ArrowRight className="size-4 text-[#17375F]" />
                {label}
                {value === true ? " ✓" : value === false ? " ✗" : ""}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Action Button */}
      <div className="mt-8">
        {isFree ? (
          <a
            href="/app"
            onClick={handleSubscribe}
            className="block w-full py-3 px-4 text-center rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Get Started
          </a>
        ) : (
          <a
            href={`/checkout?plan=${plan.id}&period=${selectedPeriod}`}
            onClick={handleSubscribe}
            className="block w-full py-3 px-4 text-center rounded-xl font-semibold bg-[#17375F] text-white hover:bg-[#24527A] transition"
          >
            Subscribe Now
          </a>
        )}
      </div>
    </div>
  );
};

export default PlanCard;