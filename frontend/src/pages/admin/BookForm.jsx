// Add / edit book form (shown inside a Modal)
import { useState } from "react";
import api, { getErrorMessage } from "../../api/axios";
import BookCover from "../../components/BookCover";

const COLORS = ["#1e3a8a", "#4f46e5", "#7c3aed", "#be123c", "#c2410c", "#ca8a04", "#15803d", "#0f766e", "#0369a1", "#475569"];
const ICONS = [
  "bi-book", "bi-code-slash", "bi-cpu", "bi-database", "bi-diagram-3", "bi-calculator",
  "bi-lightning-charge", "bi-robot", "bi-globe", "bi-graph-up", "bi-lightbulb", "bi-stars",
];

export default function BookForm({ book, categories, onSave, saving }) {
  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    isbn: book?.isbn || "",
    category: book?.category || "",
    description: book?.description || "",
    totalCopies: book?.totalCopies ?? 1,
    coverColor: book?.coverColor || COLORS[1],
    icon: book?.icon || ICONS[0],
    coverUrl: book?.coverUrl || "",
  });

  const set = (field, value) => setForm({ ...form, [field]: value });
  const handleChange = (e) => set(e.target.name, e.target.value);

  // "Add by ISBN": fill in the details from Google Books / Open Library
  const [lookup, setLookup] = useState({ busy: false, message: "", ok: false });
  const fetchByIsbn = async () => {
    const isbn = form.isbn.replace(/[^0-9Xx]/g, "");
    if (isbn.length !== 10 && isbn.length !== 13) {
      return setLookup({ busy: false, ok: false, message: "Type a 10 or 13 digit ISBN first." });
    }
    setLookup({ busy: true, message: "", ok: false });
    try {
      const { data } = await api.get(`/books/lookup/${isbn}`);
      setForm((f) => ({
        ...f,
        isbn: data.isbn,
        title: data.title || f.title,
        author: data.author || f.author,
        category: data.category || f.category,
        description: data.description || f.description,
        coverUrl: data.coverUrl || f.coverUrl,
      }));
      setLookup({ busy: false, ok: true, message: `Details filled from ${data.source}. Check them and add the number of copies.` });
    } catch (err) {
      setLookup({ busy: false, ok: false, message: getErrorMessage(err) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, totalCopies: Number(form.totalCopies) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="d-flex gap-3 align-items-center mb-3">
        <BookCover book={form} style={{ width: 64, fontSize: "1.4rem", flexShrink: 0 }} />
        <div className="small text-secondary">
          The real cover loads from the ISBN automatically. If none is found, the colour and icon below are used.
        </div>
      </div>

      {/* New book: type the ISBN and the rest fills in by itself */}
      {!book && (
        <div className="mb-3">
          <label className="form-label">
            ISBN <span className="text-secondary fw-normal">(type it and tap Fetch to fill the details)</span>
          </label>
          <div className="input-group isbn-row">
            <input
              className="form-control"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchByIsbn();
                }
              }}
              placeholder="e.g. 9780132350884"
              inputMode="numeric"
            />
            <button type="button" className="btn btn-soft" onClick={fetchByIsbn} disabled={lookup.busy}>
              {lookup.busy ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <>
                  <i className="bi bi-magic me-1"></i>Fetch
                </>
              )}
            </button>
          </div>
          {lookup.message && <div className={`small mt-1 ${lookup.ok ? "text-success" : "text-danger"}`}>{lookup.message}</div>}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Title</label>
        <input className="form-control" name="title" value={form.title} onChange={handleChange} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Author</label>
        <input className="form-control" name="author" value={form.author} onChange={handleChange} required />
      </div>
      <div className="row g-3 mb-3">
        <div className="col-7">
          <label className="form-label">Category</label>
          <input
            className="form-control"
            name="category"
            list="category-list"
            value={form.category}
            onChange={handleChange}
            placeholder="Type or pick"
            required
          />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="col-5">
          <label className="form-label">Total copies</label>
          <input type="number" min={0} className="form-control" name="totalCopies" value={form.totalCopies} onChange={handleChange} required />
        </div>
      </div>
      {book && (
        <div className="mb-3">
          <label className="form-label">
            ISBN <span className="text-secondary fw-normal">(optional)</span>
          </label>
          <input className="form-control" name="isbn" value={form.isbn} onChange={handleChange} />
        </div>
      )}
      <div className="mb-3">
        <label className="form-label">
          Cover image link <span className="text-secondary fw-normal">(optional)</span>
        </label>
        <input className="form-control" name="coverUrl" value={form.coverUrl} onChange={handleChange} placeholder="https://... (leave empty to use the ISBN)" />
      </div>
      <div className="mb-3">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={3} name="description" value={form.description} onChange={handleChange} />
      </div>

      <label className="form-label">Cover colour</label>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {COLORS.map((c) => (
          <button
            type="button"
            key={c}
            className={`color-dot ${form.coverColor === c ? "active" : ""}`}
            style={{ background: c }}
            onClick={() => set("coverColor", c)}
            aria-label={`Colour ${c}`}
          ></button>
        ))}
      </div>

      <label className="form-label">Icon</label>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {ICONS.map((icon) => (
          <button type="button" key={icon} className={`icon-pick ${form.icon === icon ? "active" : ""}`} onClick={() => set("icon", icon)} aria-label={icon}>
            <i className={`bi ${icon}`}></i>
          </button>
        ))}
      </div>

      <button className="btn btn-primary w-100" disabled={saving}>
        {saving ? <span className="spinner-border spinner-border-sm"></span> : book ? "Save changes" : "Add book"}
      </button>
    </form>
  );
}
