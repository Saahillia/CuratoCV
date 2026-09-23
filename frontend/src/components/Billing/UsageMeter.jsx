const UsageMeter = ({ used = 0, limit = null, label = "Usage", unit = "" }) => {
  // Calculate percentage: limit === null means unlimited
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : limit === 0 ? (used > 0 ? 100 : 0) : Math.min(100, Math.round((used / limit) * 100));

  // Determine progress bar color based on usage percentage
  let progressColor = "bg-green-500";
  if (percentage >= 90) {
    progressColor = "bg-red-500";
  } else if (percentage >= 70) {
    progressColor = "bg-amber-500";
  }

  // Format limit text
  const limitText = isUnlimited ? "Unlimited" : `${used} / ${limit} ${unit}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex justify-between items-center mb-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        <span className="text-slate-500">{limitText}</span>
      </div>

      {!isUnlimited && (
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default UsageMeter;