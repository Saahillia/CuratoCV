/**
 * Developer context for platform/frontend/src/pages/Checkout.jsx.
 * Purpose: implement the Platform Checkout page workflow.
 * Why here: account, navigation, and billing surfaces are common platform capabilities mounted by the root shell.
 */
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import billingService from "../services/billingService";
import { loadScript } from "../utils/loadScript";
import PlatformSkeleton from "../components/common/PlatformSkeleton";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planId = searchParams.get("plan") || "pro";
  const billingPeriod = searchParams.get("period") || "monthly";

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [planDetails, setPlanDetails] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);

  const processingRef = useRef(false);

  // The URL only chooses which plan to display. Fetch price details from the
  // backend because the browser must never be the authority for payable amounts.
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const [plansRes, billingRes] = await Promise.all([
          billingService.getPlans(),
          billingService.getBillingOption(planId, billingPeriod),
        ]);

        const plans = plansRes?.data || plansRes?.plans || plansRes?.items || plansRes || [];
        const selectedPlan = plans.find((p) => p.id === planId);

        const billingOption = billingRes?.data || billingRes;

        if (!selectedPlan) {
          throw new Error("Invalid plan selected.");
        }
        if (!billingOption || !billingOption.amount) {
          throw new Error("Invalid billing period for this plan.");
        }

        setPlanDetails({
          plan: selectedPlan,
          billingOption,
        });
      } catch (err) {
        setError(err.message || "Failed to load plan details.");
      } finally {
        setInitializing(false);
      }
    };

    fetchPlanDetails();
  }, [planId, billingPeriod]);

  const handleCheckout = async () => {
    // Stop two rapid clicks from creating two separate provider orders.
    // This protects the UI flow; backend payment idempotency is still required.
    if (processingRef.current) return;
    processingRef.current = true;

    setLoading(true);
    setMessage("Creating order...");
    setError("");

    try {
      // Ask the server to resolve the plan/price and create the Razorpay order.
      // The client receives the order details but does not choose the amount.
      const orderRes = await billingService.createOrder({ planId, billingPeriod });
      const orderData = orderRes?.data || orderRes;

      if (!orderData?.providerOrderId || !orderData?.amount) {
        throw new Error("Invalid order response from server.");
      }

      setOrderCreated(true);
      setMessage("Launching Razorpay...");

      // Load the provider's checkout code only when the user starts checkout.
      // The server secret is never placed in this browser configuration.
      await loadScript("https://checkout.razorpay.com/v1/checkout.js");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "CuratoCV",
        description: `${planDetails?.plan?.name} - ${billingPeriod}`,
        order_id: orderData.providerOrderId,
        handler: async (response) => {
          // A successful provider popup is not proof to CuratoCV. Send the
          // provider identifiers/signature to the backend for verification.
          setMessage("Verifying payment...");
          try {
            const verifyRes = await billingService.verifyCheckoutPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const verifyData = verifyRes?.data || verifyRes;

            if (verifyData?.alreadyProcessed) {
              setMessage("Payment already processed. Redirecting...");
            } else {
              setMessage("Payment verified successfully!");
            }

            // Small delay for user to see success
            setTimeout(() => {
              navigate("/app", { replace: true });
            }, 1000);
          } catch (err) {
            setError(err?.response?.data?.error?.message || err.message || "Payment verification failed.");
            setLoading(false);
            processingRef.current = false;
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#17375F",
        },
        modal: {
          ondismiss: () => {
            // Let the user retry only if checkout closed before an order was
            // created. Once created, preserve the state for server reconciliation.
            if (!orderCreated) {
              setMessage("");
              setLoading(false);
              processingRef.current = false;
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || "Failed to initiate payment.");
      setLoading(false);
      processingRef.current = false;
    }
  };

  // Render error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Checkout Error</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <a
            href="/pricing"
            className="inline-block px-6 py-3 rounded-xl bg-[#17375F] text-white font-semibold hover:bg-[#24527A] transition"
          >
            Back to Plans
          </a>
        </div>
      </div>
    );
  }

  if (initializing) {
    return <main className="min-h-screen bg-[#F3F7FA] px-4 py-8"><div className="mx-auto max-w-5xl"><PlatformSkeleton type="checkout" /></div></main>;
  }

  const plan = planDetails?.plan;
  const billingOption = planDetails?.billingOption;

  return (
    <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Go back
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900">Checkout</h1>
          <p className="text-sm text-slate-500 mt-1">
            {plan?.name} · {billingPeriod === "monthly" ? "Monthly" : billingPeriod === "three_month" ? "3 Months" : billingPeriod === "six_month" ? "6 Months" : "Yearly"}
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-600">{plan?.name}</span>
            <span className="font-semibold text-slate-900">
              ₹{billingOption?.amount}
              {billingPeriod === "monthly" ? "/mo" : ""}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>Billing Period</span>
            <span className="font-medium">
              {billingPeriod === "monthly"
                ? "Monthly"
                : billingPeriod === "three_month"
                ? "3 Months"
                : billingPeriod === "six_month"
                ? "6 Months"
                : "Yearly"}
            </span>
          </div>
          <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-lg text-[#17375F]">
              ₹{billingOption?.amount}
            </span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handleCheckout}
          disabled={loading || !planDetails}
          className="w-full h-12 rounded-xl bg-[#17375F] text-white font-semibold hover:bg-[#24527A] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? message || "Processing..." : "Pay with Razorpay"}
        </button>

        {message && !error && (
          <p className="mt-4 text-sm text-slate-600 text-center">{message}</p>
        )}

        <p className="mt-6 text-xs text-center text-slate-400">
          Secured by Razorpay. We never store your card details.
        </p>
      </div>
    </div>
  );
};

export default Checkout;
