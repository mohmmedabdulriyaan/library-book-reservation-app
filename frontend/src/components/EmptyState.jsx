// Friendly message for empty lists or screens that come later
export default function EmptyState({ icon = "bi-inbox", tint = "tint-primary", title, text, children }) {
  return (
    <div className="app-card empty-state">
      <div className={`icon ${tint}`}>
        <i className={`bi ${icon}`}></i>
      </div>
      <h3 className="h6 fw-bold mb-1">{title}</h3>
      {text && <p className="text-secondary small mb-3">{text}</p>}
      {children}
    </div>
  );
}
