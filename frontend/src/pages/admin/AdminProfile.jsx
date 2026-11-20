import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import PasswordInput from "../../components/PasswordInput";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getInitials } from "../../layouts/AppLayout";
import ThemeToggle from "../../components/ThemeToggle";
import { Link } from "react-router-dom";

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const savePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (form.newPassword !== form.confirmPassword) return toast.error("New passwords do not match");

    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPassword(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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
        <button className="list-row" onClick={() => setShowPassword(!showPassword)}>
          <i className="bi bi-key text-primary"></i>
          <span className="fw-semibold">Change password</span>
          <i className={`bi ${showPassword ? "bi-chevron-down" : "bi-chevron-right"} ms-auto text-secondary`}></i>
        </button>
        {showPassword && (
          <form className="p-3" onSubmit={savePassword}>
            <div className="mb-3">
              <label className="form-label">Current password</label>
              <PasswordInput
                name="currentPassword"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">New password</label>
              <PasswordInput
                name="newPassword"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm new password</label>
              <PasswordInput
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Type it again"
                autoComplete="new-password"
              />
            </div>
            <button className="btn btn-primary w-100" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : "Change password"}
            </button>
          </form>
        )}
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
