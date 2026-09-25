import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import billingService from "../services/billingService";
import BillingPeriodSelector from "../components/billing/BillingPeriodSelector";
import PlanCard from "../components/billing/PlanCard";

const Pricing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await billingService.getPlans();
        if (data && data.success !== false) {
          const payload = data.data || data;
          const list = Array.isArray(payload) ? payload : payload?.plans || payload?.items || [];
          setPlans(list);
        }
      } catch (e) {
        // Fallback: no hardcoded prices
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F7FA]">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-start mb-2">
            <button
              onClick={() => navigate("/app")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="size-4" />
              Go back
            </button>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            Choose the plan that fits your career journey.
          </p>

          {/* Billing Period Selector */}
          <div className="mt-8">
            <BillingPeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-white shadow animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            Unable to load plans. Please try again later.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selectedPeriod={selectedPeriod}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;