// Digital library: PDFs of notes, previous question papers and e-books.
// Students open and read them. The admin can also upload and delete PDFs.
import { useEffect, useState } from "react";
import api, { API_URL, getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { SkeletonList } from "../components/Skeleton";
import { formatDate } from "../utils/format";

const TYPES = {
  notes: { label: "Notes", icon: "bi-journal-text", tint: "tint-primary" },
  question_paper: { label: "Question papers", short: "Question paper", icon: "bi-file-earmark-text", tint: "tint-warning" },
  ebook: { label: "E-books", short: "E-book", icon: "bi-book", tint: "tint-success" },
};

const fileSize = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const fileUrl = (r) => `${API_URL}/resources/${r._id}/file`;

const EMPTY_FORM = { title: "", type: "notes", subject: "", year: "", description: "" };

export default function DigitalLibrary({ admin = false }) {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [type, setType] = useState("all");
  const [subject, setSubject] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(null); // PDF open in the reader
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api
      .get("/resources")
      .then(({ data }) => {
        setList(data.resources);
        setSubjects(data.subjects);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please choose a PDF file");
    if (!form.title.trim()) return toast.error("Please enter a title");

    const data = new FormData(); // files are sent as form-data, not JSON
    data.append("file", file);
    Object.entries(form).forEach(([k, v]) => data.append(k, v));

    setUploading(true);
    try {
      const res = await api.post("/resources", data);
      toast.success(res.data.message);
      setShowUpload(false);
      setForm(EMPTY_FORM);
      setFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (r) => {
    try {
      await api.delete(`/resources/${r._id}`);
      setList((l) => l.filter((x) => x._id !== r._id));
      toast.info("PDF deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const text = search.trim().toLowerCase();
  const shown = list.filter(
    (r) =>
      (type === "all" || r.type === type) &&
      (subject === "All" || r.subject === subject) &&
      (!text || `${r.title} ${r.subject} ${r.description}`.toLowerCase().includes(text))
  );

  return (
    <div>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <h1 className="page-title">E-Library</h1>
          <p className="page-sub">Notes, previous question papers and e-books. Read them anywhere.</p>
        </div>
        {admin && (
          <button className="btn btn-primary text-nowrap" onClick={() => setShowUpload(true)}>
            <i className="bi bi-upload me-2"></i>Upload
          </button>
        )}
      </div>

      <div className="search-box mb-3">
        <i className="bi bi-search"></i>
        <input className="form-control" placeholder="Search notes, papers or subjects" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="seg mb-3">
        <button className={type === "all" ? "active" : ""} onClick={() => setType("all")}>All</button>
        {Object.entries(TYPES).map(([key, t]) => (
          <button key={key} className={type === key ? "active" : ""} onClick={() => setType(key)}>
            {t.label}
          </button>
        ))}
      </div>

      {subjects.length > 1 && (
        <div className="chip-scroll mb-3">
          {["All", ...subjects].map((s) => (
            <button key={s} className={`chip ${subject === s ? "active" : ""}`} onClick={() => setSubject(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon="bi-file-earmark-pdf" title="No PDFs here yet" text={admin ? "Upload notes or question papers for students." : "Check back soon for notes and question papers."} />
      ) : (
        <div className="row g-2 g-md-3">
          {shown.map((r) => {
            const t = TYPES[r.type] || TYPES.notes;
            return (
              <div key={r._id} className="col-md-6 col-lg-4">
                <div className="app-card p-3 h-100 d-flex flex-column">
                  <div className="d-flex gap-3 align-items-start">
                    <span className={`pdf-icon ${t.tint}`}>
                      <i className="bi bi-file-earmark-pdf-fill"></i>
                    </span>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold lh-sm">{r.title}</div>
                      <div className="small text-secondary mt-1">
                        {t.short || t.label} · {r.subject}
                        {r.year ? ` · ${r.year}` : ""}
                      </div>
                    </div>
                  </div>
                  {r.description && <p className="small text-secondary mt-2 mb-0">{r.description}</p>}
                  <div className="d-flex align-items-center gap-2 mt-auto pt-3">
                    <span className="small text-secondary me-auto">
                      {fileSize(r.size)} · <i className="bi bi-eye"></i> {r.views}
                    </span>
                    {admin && (
                      <button className="btn btn-light btn-sm text-danger" onClick={() => remove(r)} aria-label="Delete">
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                    <a className="btn btn-light btn-sm" href={fileUrl(r)} target="_blank" rel="noreferrer" aria-label="Open in new tab">
                      <i className="bi bi-box-arrow-up-right"></i>
                    </a>
                    <button
                      className="btn btn-soft btn-sm"
                      // Phones can't show a PDF inside the page, so open it in the phone's PDF viewer
                      onClick={() => (window.innerWidth < 768 ? window.open(fileUrl(r), "_blank") : setReading(r))}
                    >
                      <i className="bi bi-book me-1"></i>Read
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF reader inside the app */}
      {reading && (
        <Modal title={reading.title} onClose={() => setReading(null)} width={900}>
          <iframe className="pdf-frame" src={fileUrl(reading)} title={reading.title}></iframe>
          <a className="btn btn-light w-100 mt-2" href={fileUrl(reading)} target="_blank" rel="noreferrer">
            <i className="bi bi-download me-2"></i>Open or download the PDF
          </a>
        </Modal>
      )}

      {/* Upload form (admin) */}
      {showUpload && (
        <Modal title="Upload a PDF" onClose={() => setShowUpload(false)}>
          <form onSubmit={upload}>
            <label className="upload-drop mb-3">
              <input type="file" accept="application/pdf,.pdf" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
              <i className="bi bi-cloud-arrow-up"></i>
              <span className="fw-semibold">{file ? file.name : "Choose a PDF file"}</span>
              <span className="small text-secondary">{file ? fileSize(file.size) : "Max 15 MB"}</span>
            </label>
            <div className="mb-2">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. DBMS Unit 2 Notes" />
            </div>
            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(TYPES).map(([key, t]) => (
                    <option key={key} value={key}>{t.short || t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Year (optional)</label>
                <input type="number" className="form-control" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2025" />
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label">Subject</label>
              <input className="form-control" list="subject-list" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. DBMS" />
              <datalist id="subject-list">
                {subjects.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="mb-3">
              <label className="form-label">Description (optional)</label>
              <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary w-100" disabled={uploading}>
              {uploading ? <span className="spinner-border spinner-border-sm"></span> : "Upload PDF"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
