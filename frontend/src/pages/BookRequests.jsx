// Book requests. Students ask for books the library does not have and +1 others' requests.
// The admin sees the most wanted books first and approves, adds or rejects them.
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { formatDate } from "../utils/format";

const STATUS = {
  pending: { label: "Pending", tint: "tint-warning" },
  approved: { label: "Approved", tint: "tint-info" },
  added: { label: "In library", tint: "tint-success" },
  rejected: { label: "Rejected", tint: "tint-danger" },
};

const FILTERS = ["all", "pending", "approved", "added", "rejected"];

export default function BookRequests({ admin = false }) {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", author: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState({}); // admin note typed for each request

  const load = () => {
    api
      .get("/requests")
      .then(({ data }) => setList(data.requests))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const replace = (updated) => setList((l) => l.map((r) => (r._id === updated._id ? { ...r, ...updated, requestedBy: r.requestedBy } : r)));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Please enter the book title");
    setSaving(true);
    try {
      const { data } = await api.post("/requests", form);
      toast.success(data.message);
      setForm({ title: "", author: "", reason: "" });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const vote = async (r) => {
    try {
      const { data } = await api.put(`/requests/${r._id}/vote`);
      replace(data.request);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const setStatus = async (r, status) => {
    try {
      const { data } = await api.put(`/requests/${r._id}/status`, { status, adminNote: notes[r._id] ?? r.adminNote });
      replace(data.request);
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (r) => {
    try {
      await api.delete(`/requests/${r._id}`);
      setList((l) => l.filter((x) => x._id !== r._id));
      toast.info("Request deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const shown = filter === "all" ? list : list.filter((r) => r.status === filter);
  const pending = list.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto" style={{ maxWidth: 760 }}>
      <h1 className="page-title">Book requests</h1>
      <p className="page-sub">
        {admin
          ? `${pending} waiting for a decision. Most wanted books are at the top.`
          : "Can't find a book? Ask the library to buy it, or +1 a request."}
      </p>

      {!admin && (
        <form className="app-card p-3 mb-3" onSubmit={submit}>
          <div className="row g-2">
            <div className="col-md-6">
              <input className="form-control" placeholder="Book title *" value={form.title} maxLength={150}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-md-6">
              <input className="form-control" placeholder="Author (optional)" value={form.author} maxLength={100}
                onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="col-12">
              <input className="form-control" placeholder="Why do you need it? (optional)" value={form.reason} maxLength={200}
                onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary w-100 mt-2" disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-send me-2"></i>Send request</>}
          </button>
        </form>
      )}

      <div className="chip-scroll mb-3">
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : STATUS[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon="bi-lightbulb" title="No requests here" text={admin ? "Student requests will show up here." : "Be the first to request a book."} />
      ) : (
        shown.map((r) => (
          <div key={r._id} className="app-card p-3 mb-2">
            <div className="d-flex gap-3 align-items-start">
              {/* Votes */}
              <button
                className={`vote-box ${r.myVote ? "voted" : ""}`}
                onClick={() => !admin && vote(r)}
                disabled={admin || r.status === "rejected" || r.status === "added"}
                aria-label="Vote"
              >
                <i className="bi bi-caret-up-fill"></i>
                <span>{r.voteCount}</span>
              </button>

              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <div style={{ minWidth: 0 }}>
                    <div className="fw-semibold">{r.title}</div>
                    {r.author && <div className="small text-secondary">{r.author}</div>}
                  </div>
                  <span className={`badge-soft ${STATUS[r.status].tint}`}>{STATUS[r.status].label}</span>
                </div>
                {r.reason && <div className="small mt-1">“{r.reason}”</div>}
                <div className="small text-secondary mt-1">
                  {admin && r.requestedBy ? `${r.requestedBy.name} (${r.requestedBy.rollNumber}, Batch ${r.requestedBy.batch}) · ` : ""}
                  {formatDate(r.createdAt)} · {r.voteCount} student{r.voteCount === 1 ? "" : "s"} want this
                </div>
                {r.adminNote && !admin && (
                  <div className="small mt-2 p-2 rounded-3 tint-info">
                    <i className="bi bi-chat-left-text me-1"></i>
                    {r.adminNote}
                  </div>
                )}

                {admin && (
                  <div className="mt-2">
                    <input
                      className="form-control form-control-sm mb-2"
                      placeholder="Note for students (optional)"
                      value={notes[r._id] ?? r.adminNote ?? ""}
                      onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })}
                    />
                    <div className="d-flex gap-2 flex-wrap">
                      <button className="btn btn-soft btn-sm" onClick={() => setStatus(r, "approved")} disabled={r.status === "approved"}>
                        <i className="bi bi-check2 me-1"></i>Approve
                      </button>
                      <button className="btn btn-success btn-sm" onClick={() => setStatus(r, "added")} disabled={r.status === "added"}>
                        <i className="bi bi-journal-plus me-1"></i>Added
                      </button>
                      <button className="btn btn-light btn-sm text-danger" onClick={() => setStatus(r, "rejected")} disabled={r.status === "rejected"}>
                        Reject
                      </button>
                      <button className="btn btn-light btn-sm ms-auto" onClick={() => remove(r)} aria-label="Delete">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
