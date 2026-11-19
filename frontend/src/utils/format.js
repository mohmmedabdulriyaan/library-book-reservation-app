// Small helpers for showing dates nicely

// "18 Nov 2026"
export const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Whole days from today until the date (negative = already passed)
export const daysUntil = (value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return Math.round((date - today) / (24 * 60 * 60 * 1000));
};

// "Due in 5 days", "Due today", "3 days overdue"
export const dueText = (value) => {
  const days = daysUntil(value);
  if (days > 1) return `Due in ${days} days`;
  if (days === 1) return "Due tomorrow";
  if (days === 0) return "Due today";
  return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`;
};
