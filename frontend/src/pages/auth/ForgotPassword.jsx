import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PasswordInput from "../../components/PasswordInput";

// Forgot password in 2 steps:
// 1. Enter roll number -> we show your security question
// 2. Answer it and choose a new password -> you are logged in
export default function ForgotPassword() {
  const { saveLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [rollNumber, setRollNumber] = useState("");
  const [question, setQuestion] = useState("");
  const [form, setForm] = useState({ answer: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const findQuestion = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/student/forgot-password/question", { rollNumber: rollNumber.trim() });
      setQuestion(data.question);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 6) return setError("New password must be at least 6 characters");
    if (form.newPassword !== form.confirmPassword) return setError("New passwords do not match");

    setLoading(true);
    try {
      const { data } = await api.post("/auth/student/forgot-password/reset", {
        rollNumber: rollNumber.trim(),
        answer: form.answer,
        newPassword: form.newPassword,
      });
      saveLogin(data.token, data.user);
      toast.success("Password changed. You are logged in.");
      navigate("/home");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <Link to="/login" className="back-link">
          <i className="bi bi-arrow-left"></i> Back to login
        </Link>

        <div className="app-card auth-card">
          <span className="brand-logo">
            <i className="bi bi-key"></i>
          </span>
          <h1 className="auth-title">Forgot password</h1>
          <p className="auth-sub">
            {question ? "Answer your security question and choose a new password." : "Enter your roll number to get started."}
          </p>

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          {!question ? (
            <form onSubmit={findQuestion}>
              <div className="mb-4">
                <label className="form-label">Roll number</label>
                <div className="input-icon">
                  <i className="bi bi-person-badge"></i>
                  <input
                    className="form-control text-uppercase"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 2503A51133"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <button className="btn btn-primary w-100" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : "Next"}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword}>
              <div className="app-card p-3 mb-3 small">
                <div className="text-secondary mb-1">Security question</div>
                <div className="fw-semibold">{question}</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Your answer</label>
                <input
                  className="form-control"
                  name="answer"
                  value={form.answer}
                  onChange={handleChange}
                  placeholder="Not case sensitive"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">New password</label>
                <PasswordInput
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Confirm new password</label>
                <PasswordInput
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Type it again"
                  autoComplete="new-password"
                />
              </div>
              <button className="btn btn-primary w-100" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : "Reset password"}
              </button>
              <button
                type="button"
                className="btn btn-link w-100 small mt-2 text-decoration-none"
                onClick={() => {
                  setQuestion("");
                  setError("");
                }}
              >
                Use a different roll number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
