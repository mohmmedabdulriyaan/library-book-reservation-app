import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../api/axios";
import PasswordInput from "../../components/PasswordInput";

// Same rule as the backend: 4 digits + 1 letter + 5 digits
const ROLL_REGEX = /^[0-9]{4}[A-Z][0-9]{5}$/;

export default function StudentSignup() {
  const { registerStudent } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    rollNumber: "",
    batch: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const rollNumber = form.rollNumber.trim().toUpperCase();

    // Check the form before sending it
    if (!ROLL_REGEX.test(rollNumber)) {
      return setError("Roll number should be 4 digits, 1 letter, then 5 digits");
    }
    const batch = Number(form.batch);
    if (!Number.isInteger(batch) || batch < 1) {
      return setError("Please enter a valid batch number");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      const user = await registerStudent({
        name: form.name.trim(),
        rollNumber,
        batch,
        email: form.email.trim() || undefined,
        password: form.password,
      });
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}!`);
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
          <h1 className="auth-title mt-0">Create account</h1>
          <p className="auth-sub">Sign up once with your college details.</p>

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full name</label>
              <div className="input-icon">
                <i className="bi bi-person"></i>
                <input
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-7">
                <label className="form-label">Roll number</label>
                <input
                  className="form-control text-uppercase"
                  name="rollNumber"
                  value={form.rollNumber}
                  onChange={handleChange}
                  placeholder="Your roll number"
                  maxLength={10}
                  required
                />
              </div>
              <div className="col-5">
                <label className="form-label">Batch</label>
                <input
                  type="number"
                  className="form-control"
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  placeholder="Batch no."
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">
                Email <span className="text-secondary fw-normal">(optional)</span>
              </label>
              <div className="input-icon">
                <i className="bi bi-envelope"></i>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@college.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <PasswordInput
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm password</label>
              <PasswordInput
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Type it again"
                autoComplete="new-password"
              />
            </div>

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : "Create account"}
            </button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            Already have an account?{" "}
            <Link to="/login" className="fw-semibold text-decoration-none">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
