// Library settings: how many books each batch can hold, and email status
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import Loader from "../../components/Loader";

export default function LibrarySettings() {
  const toast = useToast();
  const [defaultLimit, setDefaultLimit] = useState(3);
  const [rows, setRows] = useState([]); // [{ batch, limit }]
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then(({ data }) => {
        setDefaultLimit(data.defaultLimit);
        setRows(data.batchLimits.map((b) => ({ batch: String(b.batch), limit: String(b.limit) })));
        setEmailEnabled(data.emailEnabled);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [toast]);

  const change = (i, field, value) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [field]: value } : row)));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/admin/settings", {
        defaultLimit: Number(defaultLimit),
        batchLimits: rows.filter((r) => r.batch !== "" || r.limit !== "").map((r) => ({ batch: Number(r.batch), limit: Number(r.limit) })),
      });
      setRows(data.batchLimits.map((b) => ({ batch: String(b.batch), limit: String(b.limit) })));
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      <h1 className="page-title">Library settings</h1>
      <p className="page-sub">Borrowing limits and email reminders.</p>

      <form className="app-card p-3 mb-3" onSubmit={save}>
        <h2 className="h6 fw-bold mb-1">Borrowing limit by batch</h2>
        <p className="small text-secondary">How many books a student can hold at once (reserved + issued).</p>

        <label className="form-label">All batches (default)</label>
        <div className="input-group mb-3" style={{ maxWidth: 220 }}>
          <input type="number" min={1} max={20} className="form-control" value={defaultLimit} onChange={(e) => setDefaultLimit(e.target.value)} />
          <span className="input-group-text">books</span>
        </div>

        <label className="form-label">Different limit for some batches</label>
        {rows.length === 0 && <p className="small text-secondary mb-2">Every batch uses the default limit.</p>}
        {rows.map((row, i) => (
          <div key={i} className="d-flex gap-2 align-items-center mb-2">
            <div className="input-group">
              <span className="input-group-text">Batch</span>
              <input type="number" min={1} className="form-control" value={row.batch} onChange={(e) => change(i, "batch", e.target.value)} />
            </div>
            <div className="input-group">
              <input type="number" min={1} max={20} className="form-control" value={row.limit} onChange={(e) => change(i, "limit", e.target.value)} />
              <span className="input-group-text">books</span>
            </div>
            <button type="button" className="btn btn-light text-danger" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-soft btn-sm mb-3" onClick={() => setRows([...rows, { batch: "", limit: "" }])}>
          <i className="bi bi-plus-lg me-1"></i>Add batch rule
        </button>

        <button className="btn btn-primary w-100" disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm"></span> : "Save limits"}
        </button>
      </form>

      <div className="app-card p-3">
        <div className="d-flex align-items-center gap-3">
          <span className={`stat-icon mb-0 ${emailEnabled ? "tint-success" : "tint-warning"}`}>
            <i className="bi bi-envelope"></i>
          </span>
          <div>
            <div className="fw-semibold">Email reminders are {emailEnabled ? "ON" : "OFF"}</div>
            <div className="small text-secondary">
              {emailEnabled
                ? "Students with an email get due-soon, overdue, waitlist and important notice emails."
                : "Add BREVO_API_KEY and EMAIL_FROM (in backend/.env, or Render > Environment online) and restart to turn them on."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
