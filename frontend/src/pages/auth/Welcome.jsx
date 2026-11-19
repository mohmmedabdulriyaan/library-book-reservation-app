// First screen: choose Student or Admin
import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="welcome-hero mb-4">
          <span className="brand-logo" style={{ background: "rgba(255,255,255,0.16)" }}>
            <i className="bi bi-book-half"></i>
          </span>
          <h1 className="fw-bold mt-3 mb-2" style={{ fontSize: "1.75rem" }}>
            College Library
          </h1>
          <p className="mb-0" style={{ opacity: 0.85 }}>
            Search books, reserve them in seconds and collect them from the library.
          </p>
        </div>

        <p className="text-secondary fw-semibold small mb-2">Continue as</p>

        <Link to="/login" className="app-card role-option mb-3">
          <span className="role-icon tint-primary">
            <i className="bi bi-mortarboard"></i>
          </span>
          <span className="flex-grow-1">
            <span className="d-block fw-bold">Student</span>
            <span className="d-block small text-secondary">Log in or create your account</span>
          </span>
          <i className="bi bi-chevron-right text-secondary"></i>
        </Link>

        <Link to="/admin/login" className="app-card role-option">
          <span className="role-icon tint-warning">
            <i className="bi bi-shield-lock"></i>
          </span>
          <span className="flex-grow-1">
            <span className="d-block fw-bold">Admin</span>
            <span className="d-block small text-secondary">Manage books and reservations</span>
          </span>
          <i className="bi bi-chevron-right text-secondary"></i>
        </Link>
      </div>
    </div>
  );
}
