/** Format resume dates according to the document customization setting. */
export const formatResumeDate = (value, format = "MM/YYYY") => {
  if (typeof value !== "string") return "";
  const match = value.trim().match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Math.min(12, Math.max(1, Number(match[2] || 1)));
  const day = Math.min(31, Math.max(1, Number(match[3] || 1)));
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");

  switch (format) {
    case "MMMM YYYY":
      return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    case "DD/MM/YYYY": return `${paddedDay}/${paddedMonth}/${year}`;
    case "MM/DD/YYYY": return `${paddedMonth}/${paddedDay}/${year}`;
    case "YYYY-MM-DD": return `${year}-${paddedMonth}-${paddedDay}`;
    default: return `${paddedMonth}/${year}`;
  }
};
