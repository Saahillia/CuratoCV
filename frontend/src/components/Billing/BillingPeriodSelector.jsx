import React from "react";

const PERIOD_LABELS = {
  monthly: "Monthly",
  three_month: "3 Months",
  six_month: "6 Months",
  yearly: "Yearly",
};

const PERIOD_ORDER = ["monthly", "three_month", "six_month", "yearly"];

const BillingPeriodSelector = ({ selectedPeriod, onPeriodChange, planId }) => {
  const handleSelect = (period) => {
    if (period !== selectedPeriod) {
      onPeriodChange?.(period);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 justify-center">
      {PERIOD_ORDER.map((period) => {
        const isSelected = period === selectedPeriod;
        const label = PERIOD_LABELS[period] || period;

        return (
          <button
            key={period}
            type="button"
            onClick={() => handleSelect(period)}
            className={`
              rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200
              border
              ${
                isSelected
                  ? "bg-[#17375F] text-white border-[#17375F] shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#17375F] hover:text-[#17375F]"
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default BillingPeriodSelector;
