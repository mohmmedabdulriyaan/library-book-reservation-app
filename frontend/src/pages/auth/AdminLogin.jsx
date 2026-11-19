import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../api/axios";
import PasswordInput from "../../components/PasswordInput";

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAdmin(form.username.trim(), form.password);
      toast.success("Logged in as admin");
      navigate("/admin");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <Link to="/welcome" className="back-link">
          <i className="bi bi-arrow-left"></i> Back
        </Link>

        <div className="app-card auth-card">
          <span className="brand-logo" style={{ background: "#111827" }}>
            <i className="bi bi-shield-lock"></i>
          </span>
          <h1 className="auth-title">Admin login</h1>
          <p className="auth-sub">For library staff only.</p>

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <div className="input-icon">
                <i className="bi bi-person"></i>
                <input
                  className="form-control"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <PasswordInput value={form.password} onChange={handleChange} autoComplete="current-password" />
            </div>

            <button className="btn btn-dark w-100" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
