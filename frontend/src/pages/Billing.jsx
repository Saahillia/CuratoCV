import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import billingService from "../services/billingService";
import resumeService from "../services/resumeService";
import PaymentStatus from "../components/Billing/PaymentStatus";
import UsageMeter from "../components/Billing/UsageMeter";

const Billing = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, entData, resumesData] = await Promise.all([
          billingService.getCurrentSubscription(),
          billingService.getEntitlements(),
          resumeService.getUserResumes(),
        ]);

        const sub = subData?.data || subData;
        setSubscription(sub);

        const ent = entData?.data || entData;
        setEntitlements(ent);

        const userResumes = resumesData?.data?.resumes || resumesData?.resumes || resumesData?.data || resumesData || [];
        setResumes(userResumes);
      } catch (err) {
        setSubscription(null);
        setEntitlements(null);
        setResumes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You'll retain access until the current period ends.")) return;
    setCancelling(true);
    try {
      const data = await billingService.cancelSubscription();
      const updated = data?.data || data;
      if (updated) setSubscription(updated);
    } catch (e) {
      // error handled by api interceptor
    } finally {
      setCancelling(false);
    }
  };

  const planName = entitlements?.planName || subscription?.plan?.name || "Free";
  const status = subscription?.status || "inactive";
  const periodEnd = subscription?.currentPeriodEnd || null;
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false;

  const resumesUsed = resumes.length;
  const resumesLimit = entitlements?.resumeLimit ?? null;

  const aiUsed = entitlements?.ai?.creditsUsed ?? 0;
  const aiLimit = entitlements?.ai?.creditsGranted ?? null;

  return (
    <div className="min-h-screen bg-[#F3F7FA]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Go back
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-8">Billing & Subscription</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Payment Status Card */}
            <PaymentStatus
              status={status}
              planName={planName}
              periodEnd={periodEnd}
              cancelAtPeriodEnd={cancelAtPeriodEnd}
            />

            {/* Usage Meters */}
            {entitlements && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Resource Usage</h3>
                <UsageMeter
                  used={resumesUsed}
                  limit={resumesLimit}
                  label="Resumes"
                  unit="resumes"
                />
                <UsageMeter
                  used={aiUsed}
                  limit={aiLimit}
                  label="AI Credits"
                  unit="credits"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {status === "active" && !cancelAtPeriodEnd ? (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full h-11 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Subscription"}
                </button>
              ) : (
                <a
                  href="/pricing"
                  className="block w-full text-center py-3 rounded-xl bg-[#17375F] text-white font-semibold hover:bg-[#24527A] transition"
                >
                  Upgrade / Change Plan
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;