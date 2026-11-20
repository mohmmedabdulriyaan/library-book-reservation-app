import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getInitials } from "../../layouts/AppLayout";
import PasswordInput from "../../components/PasswordInput";
import ThemeToggle from "../../components/ThemeToggle";
import { Link } from "react-router-dom";
import SECURITY_QUESTIONS from "../../utils/securityQuestions";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [section, setSection] = useState(null); // null | "edit" | "password"
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, batch: user.batch, email: user.email || "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [questionForm, setQuestionForm] = useState({ currentPassword: "", question: SECURITY_QUESTIONS[0], answer: "" });

  const saveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.answer.trim()) return toast.error("Please type an answer");
    setSaving(true);
    try {
      const { data } = await api.put("/auth/security-question", {
        currentPassword: questionForm.currentPassword,
        question: questionForm.question,
        answer: questionForm.answer.trim(),
      });
      updateUser(data.user);
      toast.success("Security question saved");
      setQuestionForm({ currentPassword: "", question: SECURITY_QUESTIONS[0], answer: "" });
      setSection(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (name) => setSection(section === name ? null : name);

  const saveProfile = async (e) => {
    e.preventDefault();
    const batch = Number(profileForm.batch);
    if (!profileForm.name.trim()) return toast.error("Name cannot be empty");
    if (!Number.isInteger(batch) || batch < 1) return toast.error("Please enter a valid batch number");

    setSaving(true);
    try {
      const { data } = await api.put("/auth/me", {
        name: profileForm.name.trim(),
        batch,
        email: profileForm.email.trim(),
      });
      updateUser(data.user);
      toast.success("Profile updated");
      setSection(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("New passwords do not match");

    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSection(null);
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

  const rows = [
    { icon: "bi-person-badge", label: "Roll number", value: user.rollNumber },
    { icon: "bi-people", label: "Batch", value: `Batch ${user.batch}` },
    { icon: "bi-envelope", label: "Email", value: user.email || "Not added" },
  ];

  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      <div className="app-card p-4 text-center mb-3">
        <span className="avatar lg mb-3">{getInitials(user.name)}</span>
        <h1 className="h5 fw-bold mb-1">{user.name}</h1>
        <span className="badge-soft tint-primary">Student</span>
      </div>

      <div className="app-card mb-3">
        {rows.map((row) => (
          <div key={row.label} className="list-row">
            <span className="stat-icon tint-primary mb-0" style={{ width: 36, height: 36 }}>
              <i className={`bi ${row.icon}`}></i>
            </span>
            <div>
              <div className="small text-secondary">{row.label}</div>
              <div className="fw-semibold">{row.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="app-card mb-3">
        {/* Edit profile */}
        <button className="list-row" onClick={() => toggle("edit")}>
          <i className="bi bi-pencil-square text-primary"></i>
          <span className="fw-semibold">Edit profile</span>
          <i className={`bi ${section === "edit" ? "bi-chevron-down" : "bi-chevron-right"} ms-auto text-secondary`}></i>
        </button>
        {section === "edit" && (
          <form className="p-3 border-bottom" onSubmit={saveProfile}>
            <div className="mb-3">
              <label className="form-label">Full name</label>
              <input
                className="form-control"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-5">
                <label className="form-label">Batch</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={profileForm.batch}
                  onChange={(e) => setProfileForm({ ...profileForm, batch: e.target.value })}
                  required
                />
              </div>
              <div className="col-7">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <p className="small text-secondary">Roll number cannot be changed.</p>
            <button className="btn btn-primary w-100" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : "Save changes"}
            </button>
          </form>
        )}

        {/* Change password */}
        <button className="list-row" onClick={() => toggle("password")}>
          <i className="bi bi-key text-primary"></i>
          <span className="fw-semibold">Change password</span>
          <i className={`bi ${section === "password" ? "bi-chevron-down" : "bi-chevron-right"} ms-auto text-secondary`}></i>
        </button>
        {section === "password" && (
          <form className="p-3" onSubmit={savePassword}>
            <div className="mb-3">
              <label className="form-label">Current password</label>
              <PasswordInput
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">New password</label>
              <PasswordInput
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm new password</label>
              <PasswordInput
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Type it again"
                autoComplete="new-password"
              />
            </div>
            <button className="btn btn-primary w-100" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : "Change password"}
            </button>
          </form>
        )}

        {/* Security question (used on "Forgot password") */}
        <button className="list-row" onClick={() => toggle("question")}>
          <i className="bi bi-shield-lock text-primary"></i>
          <span className="fw-semibold">Security question</span>
          {!user.hasSecurityQuestion && <span className="badge-soft tint-warning ms-2">Not set</span>}
          <i className={`bi ${section === "question" ? "bi-chevron-down" : "bi-chevron-right"} ms-auto text-secondary`}></i>
        </button>
        {section === "question" && (
          <form className="p-3" onSubmit={saveQuestion}>
            <p className="small text-secondary">If you forget your password, you answer this to set a new one.</p>
            <div className="mb-3">
              <label className="form-label">Question</label>
              <select
                className="form-select"
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Answer</label>
              <input
                className="form-control"
                value={questionForm.answer}
                onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                placeholder="Not case sensitive"
                autoComplete="off"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Current password</label>
              <PasswordInput
                name="questionPassword"
                value={questionForm.currentPassword}
                onChange={(e) => setQuestionForm({ ...questionForm, currentPassword: e.target.value })}
                placeholder="To confirm it's you"
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-primary w-100" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : "Save question"}
            </button>
          </form>
        )}
      </div>

      <div className="app-card mb-3">
        {[
          { to: "/stats", icon: "bi-bar-chart-line", label: "Reading stats" },
          { to: "/wishlist", icon: "bi-heart", label: "My wishlist" },
          { to: "/requests", icon: "bi-lightbulb", label: "Book requests" },
          { to: "/library", icon: "bi-file-earmark-pdf", label: "E-Library" },
          { to: "/announcements", icon: "bi-megaphone", label: "Announcements" },
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
