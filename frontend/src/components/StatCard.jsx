export default function StatCard({ icon, tint, value, label }) {
  return (
    <div className="app-card stat-card h-100">
      <div className={`stat-icon ${tint}`}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="overflow-hidden" style={{ minWidth: 0 }}>
        <div className="stat-value text-truncate">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
