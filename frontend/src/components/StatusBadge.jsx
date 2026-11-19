// Coloured label for a reservation status
const STYLES = {
  reserved: { label: "Reserved", className: "tint-primary" },
  issued: { label: "Issued", className: "tint-success" },
  returned: { label: "Returned", className: "tint-info" },
  cancelled: { label: "Cancelled", className: "tint-danger" },
  expired: { label: "Expired", className: "tint-warning" },
};

export default function StatusBadge({ status, overdue }) {
  if (overdue) return <span className="badge-soft tint-danger">Overdue</span>;
  const style = STYLES[status] || { label: status, className: "tint-primary" };
  return <span className={`badge-soft ${style.className}`}>{style.label}</span>;
}
