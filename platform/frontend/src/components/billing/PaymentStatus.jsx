import React from "react";

const PaymentStatus = ({ status, planName, periodEnd, cancelAtPeriodEnd }) => {
  // Format the end date
  const formattedEndDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "—";

  // Determine status color and text
  let statusText = status.charAt(0).toUpperCase() + status.slice(1);
  let statusClass = "bg-slate-100 text-slate-600";

  switch (status) {
    case "active":
      statusText = "Active";
      statusClass = "bg-green-100 text-green-700";
      break;
    case "pending":
      statusText = "Pending";
      statusClass = "bg-yellow-100 text-yellow-700";
      break;
    case "cancelled":
      statusText = "Cancelled";
      statusClass = "bg-red-100 text-red-700";
      break;
    case "expired":
      statusText = "Expired";
      statusClass = "bg-slate-100 text-slate-600";
      break;
    case "past_due":
      statusText = "Past Due";
      statusClass = "bg-red-100 text-red-700";
      break;
    default:
      statusText = status.charAt(0).toUpperCase() + status.slice(1);
      statusClass = "bg-slate-100 text-slate-600";
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{planName}</h2>
          <p className="text-sm text-slate-500">
            Subscription plan
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
          {statusText}
        </span>
      </div>

      <p className="text-sm text-slate-500">
        {cancelAtPeriodEnd
          ? `Cancels on ${formattedEndDate}. Access continues until then.`
          : `Renews on ${formattedEndDate}.`}
      </p>
    </div>
  );
};

export default PaymentStatus;