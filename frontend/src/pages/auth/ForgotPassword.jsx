import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";

// Student forgot their password: they send roll number + batch,
// then collect a new password from the librarian (no email needed).
export default function ForgotPassword() {
  const [form, setForm] = useState({ rollNumber: "", batch: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/student/forgot-password", {
        rollNumber: form.rollNumber.trim(),
        batch: Number(form.batch),
      });
      setDone(data.message);
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
          <p className="auth-sub">Tell us who you are. The librarian will give you a new password.</p>

          {done ? (
            <>
              <div className="alert alert-success small d-flex gap-2">
                <i className="bi bi-check-circle"></i>
                <span>{done}</span>
              </div>
              <ol className="small text-secondary ps-3 mb-4">
                <li>Go to the library counter with your college ID card.</li>
                <li>The librarian gives you a new password.</li>
                <li>Log in and change it in Profile &gt; Change password.</li>
              </ol>
              <Link to="/login" className="btn btn-primary w-100">
                Back to login
              </Link>
            </>
          ) : (
            <>
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
                      placeholder="e.g. 2503A51133"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Batch</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    name="batch"
                    value={form.batch}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    required
                  />
                </div>

                <button className="btn btn-primary w-100" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : "Send request"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
