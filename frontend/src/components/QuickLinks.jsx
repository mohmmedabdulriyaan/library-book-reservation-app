// Row of shortcut tiles (icon + label), used on Home, Dashboard and Profile
import { Link } from "react-router-dom";

export default function QuickLinks({ links }) {
  return (
    <div className="quick-links">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="quick-link">
          <span className={`stat-icon mb-0 ${l.tint || "tint-primary"}`}>
            <i className={`bi ${l.icon}`}></i>
            {l.count > 0 && <span className="ql-count">{l.count}</span>}
          </span>
          <span className="ql-label">{l.label}</span>
        </Link>
      ))}
    </div>
  );
}
