// The frame around every page after login:
//  - laptop: top bar with links
//  - phone:  top bar + bottom tab bar (like a mobile app)
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export default function AppLayout({ tabs, homePath, profilePath, notificationsPath, badge }) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="container inner" style={{ gap: 12 }}>
          <Link to={homePath} className="brand">
            <span className="brand-logo sm">
              <i className="bi bi-book-half"></i>
            </span>
            <span>
              Library
              {badge && <span className="badge-soft tint-primary ms-2 align-middle">{badge}</span>}
            </span>
          </Link>

          <nav className="top-nav">
            {tabs.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end}>
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto">
            <NotificationBell to={notificationsPath} />
          </div>

          <Link to={profilePath} className="d-flex align-items-center gap-2 text-decoration-none">
            <span className="d-none d-sm-block text-end lh-sm">
              <span className="d-block fw-semibold text-body small">{user?.name}</span>
              <span className="d-block text-secondary" style={{ fontSize: "0.75rem" }}>
                {user?.role === "admin" ? "Administrator" : user?.rollNumber}
              </span>
            </span>
            <span className="avatar">{getInitials(user?.name)}</span>
          </Link>
        </div>
      </header>

      <main className="container page">
        <Outlet />
      </main>

      <nav className="bottom-tabs">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end}>
            <i className={`bi ${tab.icon}`}></i>
            <span>{tab.short || tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
