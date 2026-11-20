import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../api/axios";
import PasswordInput from "../../components/PasswordInput";

export default function StudentLogin() {
  const { loginStudent } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ rollNumber: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await loginStudent(form.rollNumber.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
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
        <Link to="/welcome" className="back-link">
          <i className="bi bi-arrow-left"></i> Back
        </Link>

        <div className="app-card auth-card">
          <span className="brand-logo">
            <i className="bi bi-mortarboard"></i>
          </span>
          <h1 className="auth-title">Student login</h1>
          <p className="auth-sub">Log in with your roll number to reserve books.</p>

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Roll number</label>
              <div className="input-icon">
                <i className="bi bi-person-badge"></i>
                <input
                  className="form-control text-uppercase"
                  name="rollNumber"
                  value={form.rollNumber}
                  onChange={handleChange}
                  placeholder="Your roll number"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-baseline">
                <label className="form-label">Password</label>
                <Link to="/forgot-password" className="small fw-semibold text-decoration-none">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput value={form.password} onChange={handleChange} autoComplete="current-password" />
            </div>

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : "Log in"}
            </button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            New here?{" "}
            <Link to="/signup" className="fw-semibold text-decoration-none">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
