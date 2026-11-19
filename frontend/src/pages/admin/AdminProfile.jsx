import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getInitials } from "../../layouts/AppLayout";
import ThemeToggle from "../../components/ThemeToggle";
import { Link } from "react-router-dom";

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("You have been logged out");
    navigate("/welcome");
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      <div className="app-card p-4 text-center mb-3">
        <span className="avatar lg mb-3" style={{ background: "#111827", color: "#fff" }}>
          {getInitials(user.name)}
        </span>
        <h1 className="h5 fw-bold mb-1">{user.name}</h1>
        <div className="text-secondary small mb-2">@{user.username}</div>
        <span className="badge-soft tint-warning">Administrator</span>
      </div>

      <div className="app-card mb-3">
        {[
          { to: "/admin/requests", icon: "bi-lightbulb", label: "Book requests" },
          { to: "/admin/library", icon: "bi-file-earmark-pdf", label: "E-Library uploads" },
          { to: "/admin/announcements", icon: "bi-megaphone", label: "Announcements" },
          { to: "/admin/settings", icon: "bi-sliders", label: "Borrowing limits and email" },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="list-row">
            <i className={`bi ${l.icon} text-primary`}></i>
            <span className="fw-semibold">{l.label}</span>
            <i className="bi bi-chevron-right ms-auto text-secondary"></i>
          </Link>
        ))}
      </div>

      <div className="app-card mb-3">
        <ThemeToggle />
      </div>

      <button className="btn btn-light w-100 text-danger" onClick={handleLogout}>
        <i className="bi bi-box-arrow-right me-2"></i>Log out
      </button>
    </div>
  );
}
