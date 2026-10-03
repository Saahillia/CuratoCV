/**
 * Developer context for platform/frontend/src/pages/Billing.jsx.
 * Purpose: implement the Platform Billing page workflow.
 * Why here: account, navigation, and billing surfaces are common platform capabilities mounted by the root shell.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import billingService from "../services/billingService";
import api from "@curatocv/api-client";
import PaymentStatus from "../components/billing/PaymentStatus";
import UsageMeter from "../components/billing/UsageMeter";
import AccountCenterNav from "../components/common/AccountCenterNav";
import { subscribeToResumeCollectionUpdates } from "../services/resumeUsageEvents";
import PlatformSkeleton from "../components/common/PlatformSkeleton";
import toast from "react-hot-toast";

const getResumeCount = (response) => {
  const payload = response?.data ?? response;
  const result = payload?.data ?? payload;
  if (!Array.isArray(result?.resumes)) {
    throw new Error("Resume usage data was returned in an unexpected format.");
  }
  const count = Number(result.count);
  return Number.isFinite(count) && count >= 0 ? count : result.resumes.length;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || fallback;

const Billing = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [entitlements, setEntitlements] = useState(null);
  const [entitlementError, setEntitlementError] = useState("");
  const [resumeCount, setResumeCount] = useState(null);
  const [resumeUsageError, setResumeUsageError] = useState("");
  const [lastResumeUpdate, setLastResumeUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const refreshInFlight = useRef(false);
  const refreshQueued = useRef(false);
  const refreshResumeUsageRef = useRef(null);

  const refreshResumeUsage = useCallback(async () => {
    if (refreshInFlight.current) {
      refreshQueued.current = true;
      return;
    }
    refreshInFlight.current = true;
    setRefreshing(true);

    try {
      const response = await api.get("/users/resumes");
      setResumeCount(getResumeCount(response));
      setResumeUsageError("");
      setLastResumeUpdate(new Date());
    } catch (error) {
      setResumeUsageError(getErrorMessage(error, "Could not load resume usage."));
    } finally {
      setRefreshing(false);
      refreshInFlight.current = false;
      if (refreshQueued.current) {
        refreshQueued.current = false;
        window.setTimeout(() => refreshResumeUsageRef.current?.(), 0);
      }
    }
  }, []);
  refreshResumeUsageRef.current = refreshResumeUsage;

  const refreshData = useCallback(async () => {
    const [subscriptionResult, entitlementResult] = await Promise.allSettled([
      billingService.getCurrentSubscription(),
      billingService.getEntitlements(),
    ]);

    if (subscriptionResult.status === "fulfilled") {
      const result = subscriptionResult.value?.data ?? subscriptionResult.value;
      setSubscription(result?.data ?? result);
      setSubscriptionError("");
    } else {
      setSubscriptionError(getErrorMessage(subscriptionResult.reason, "Could not load subscription details."));
    }
    if (entitlementResult.status === "fulfilled") {
      const result = entitlementResult.value?.data ?? entitlementResult.value;
      setEntitlements(result?.data ?? result);
      setEntitlementError("");
    } else {
      setEntitlementError(getErrorMessage(entitlementResult.reason, "Could not load plan usage."));
    }

    await refreshResumeUsage();
    setLoading(false);
  }, [refreshResumeUsage]);

  useEffect(() => {
    refreshData();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshResumeUsage();
    };
    const unsubscribe = subscribeToResumeCollectionUpdates(refreshResumeUsage);
    const intervalId = window.setInterval(refreshWhenVisible, 15000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshData, refreshResumeUsage]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You'll retain access until the current period ends.")) return;
    setCancelling(true);
    try {
      const data = await billingService.cancelSubscription();
      const updated = data?.data || data;
      if (updated) setSubscription(updated);
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not cancel the subscription. Please try again."));
    } finally {
      setCancelling(false);
    }
  };

  const planName = entitlements?.planName || subscription?.plan?.name || "Free";
  const status = subscription?.status || "inactive";
  const periodEnd = subscription?.currentPeriodEnd || null;
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false;

  const resumesLimit = entitlements?.resumeLimit === -1 ? null : entitlements?.resumeLimit ?? null;

  const aiUsed = entitlements?.ai?.creditsUsed ?? 0;
  const aiLimit = entitlements?.ai?.creditsGranted ?? null;

  return (
    <div className="min-h-screen bg-[#F3F7FA]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <AccountCenterNav />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Go back
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-8">Billing & Subscription</h1>

        {loading ? <PlatformSkeleton type="billing" /> : (
          <div className="space-y-6">
            {/* Payment Status Card */}
            {subscriptionError ? (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p>Subscription details could not be refreshed.</p>
                <p className="mt-1 text-xs">{subscriptionError}</p>
                <button type="button" onClick={refreshData} className="mt-2 min-h-10 font-semibold underline underline-offset-2">Try again</button>
              </div>
            ) : (
              <PaymentStatus
                status={status}
                planName={planName}
                periodEnd={periodEnd}
                cancelAtPeriodEnd={cancelAtPeriodEnd}
              />
            )}

            {/* Usage Meters */}
            <section aria-labelledby="resource-usage-heading" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="resource-usage-heading" className="text-lg font-bold text-slate-900">Resource Usage</h2>
                  <button
                    type="button"
                    onClick={refreshResumeUsage}
                    disabled={refreshing}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#17375F] hover:bg-[#E8F0F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0353A4] disabled:cursor-wait disabled:opacity-60"
                    aria-label="Refresh billing usage"
                  >
                    <RefreshCw aria-hidden="true" size={15} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Updating…" : "Refresh usage"}
                  </button>
                </div>
                {entitlementError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
                    <p>Plan limits could not be refreshed.</p>
                    <p className="mt-1 text-xs">{entitlementError}</p>
                  </div>
                )}
                {resumeUsageError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
                    <p>{resumeCount === null ? "Resume usage is temporarily unavailable." : "Could not refresh resume usage; showing the last known count."}</p>
                    <p className="mt-1 text-xs">{resumeUsageError}</p>
                    <button type="button" onClick={refreshResumeUsage} className="mt-2 min-h-10 font-semibold underline underline-offset-2">Try again</button>
                  </div>
                )}
                {resumeCount !== null && entitlements && (
                  <div aria-live="polite" aria-atomic="true">
                    <UsageMeter
                      used={resumeCount}
                      limit={resumesLimit}
                      label="Resumes"
                      unit="resumes"
                    />
                  </div>
                )}
                {lastResumeUpdate && (
                  <p className="text-right text-xs text-slate-500">
                    Updated <time dateTime={lastResumeUpdate.toISOString()}>{lastResumeUpdate.toLocaleTimeString()}</time>
                  </p>
                )}
                {entitlements && <UsageMeter
                  used={aiUsed}
                  limit={aiLimit}
                  label="AI Credits"
                  unit="credits"
                />}
            </section>

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
