// Library notices. Students read them; the admin can also post and delete.
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { formatDate } from "../utils/format";

export default function Announcements({ admin = false }) {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", message: "", important: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/announcements")
      .then(({ data }) => setList(data.announcements))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const post = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return toast.error("Please write a title and a message");
    setSaving(true);
    try {
      const { data } = await api.post("/announcements", form);
      setList((l) => [data.announcement, ...l]);
      setForm({ title: "", message: "", important: false });
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    try {
      await api.delete(`/announcements/${a._id}`);
      setList((l) => l.filter((x) => x._id !== a._id));
      toast.info("Announcement deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 680 }}>
      <h1 className="page-title">Announcements</h1>
      <p className="page-sub">{admin ? "Send a notice to every student." : "Latest notices from the library."}</p>

      {admin && (
        <form className="app-card p-3 mb-3" onSubmit={post}>
          <input
            className="form-control mb-2"
            placeholder="Title, e.g. Library closed on Monday"
            value={form.title}
            maxLength={100}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="form-control mb-2"
            rows={3}
            placeholder="Message for students"
            value={form.message}
            maxLength={600}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="important"
                checked={form.important}
                onChange={(e) => setForm({ ...form, important: e.target.checked })}
              />
              <label className="form-check-label small" htmlFor="important">
                Important (highlight and email students)
              </label>
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-megaphone me-2"></i>Post</>}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : list.length === 0 ? (
        <EmptyState icon="bi-megaphone" title="No announcements yet" text="Library notices will show up here." />
      ) : (
        list.map((a) => (
          <div key={a._id} className={`app-card p-3 mb-2 notice-card ${a.important ? "important" : ""}`}>
            <div className="d-flex align-items-start gap-3">
              <span className={`stat-icon mb-0 ${a.important ? "tint-danger" : "tint-primary"}`} style={{ flexShrink: 0 }}>
                <i className={`bi ${a.important ? "bi-exclamation-octagon" : "bi-megaphone"}`}></i>
              </span>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-semibold">{a.title}</span>
                  {a.important && <span className="badge-soft tint-danger">Important</span>}
                </div>
                <p className="small text-secondary mb-1 mt-1" style={{ whiteSpace: "pre-line" }}>
                  {a.message}
                </p>
                <div className="small text-secondary opacity-75">
                  {a.postedBy} · {formatDate(a.createdAt)}
                </div>
              </div>
              {admin && (
                <button className="btn btn-light btn-sm text-danger" onClick={() => remove(a)} aria-label="Delete">
                  <i className="bi bi-trash"></i>
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
