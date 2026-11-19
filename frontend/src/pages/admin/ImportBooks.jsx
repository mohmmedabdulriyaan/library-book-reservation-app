// Import many books at once from a CSV file (Excel: File > Save As > CSV)
import { useState } from "react";
import api, { getErrorMessage } from "../../api/axios";
import { downloadCsv } from "../../utils/csv";

const COLUMNS = ["title", "author", "category", "isbn", "totalCopies", "description", "coverUrl"];

// Reads CSV text into rows. Handles commas inside "quoted, values".
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
};

// Header names people might use -> our field names
const ALIASES = { copies: "totalCopies", totalcopies: "totalCopies", quantity: "totalCopies", coverurl: "coverUrl", cover: "coverUrl", isbn13: "isbn" };

const toBooks = (rows) => {
  const header = rows[0].map((h) => {
    const key = h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    return ALIASES[key] || COLUMNS.find((c) => c.toLowerCase() === key) || key;
  });
  return rows.slice(1).map((r) => {
    const book = {};
    header.forEach((h, i) => (book[h] = (r[i] || "").trim()));
    return book;
  });
};

export default function ImportBooks({ onDone }) {
  const [books, setBooks] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickFile = (e) => {
    const file = e.target.files[0];
    setResult(null);
    setError("");
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result).replace(/^﻿/, ""));
      if (rows.length < 2) return setError("The file needs a header row and at least one book.");
      const list = toBooks(rows);
      if (!("title" in list[0])) return setError('Could not find a "title" column. Download the template to see the format.');
      setBooks(list);
    };
    reader.readAsText(file);
  };

  const template = () =>
    downloadCsv("books-template.csv", COLUMNS, [
      ["The Psychology of Money", "Morgan Housel", "Finance", "9780857197689", "3", "Lessons on wealth and happiness", ""],
      ["Clean Architecture", "Robert C. Martin", "Computer Science", "9780134494166", "2", "", ""],
    ]);

  const importNow = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/books/bulk", { books });
      setResult(data);
      if (data.added > 0) onDone(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="small text-secondary">
        Columns: <strong>title, author, category</strong> (required), isbn, totalCopies, description, coverUrl. In Excel use
        File &gt; Save As &gt; CSV.
      </p>
      <button type="button" className="btn btn-light btn-sm mb-3" onClick={template}>
        <i className="bi bi-download me-1"></i>Download template
      </button>

      <label className="upload-drop mb-3">
        <input type="file" accept=".csv,text/csv" hidden onChange={pickFile} />
        <i className="bi bi-filetype-csv"></i>
        <span className="fw-semibold">{fileName || "Choose a CSV file"}</span>
        <span className="small text-secondary">{books.length ? `${books.length} books found` : "Up to 500 books"}</span>
      </label>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {books.length > 0 && !result && (
        <>
          <div className="table-responsive app-card mb-3" style={{ maxHeight: 220 }}>
            <table className="table table-sm small mb-0">
              <thead>
                <tr><th>#</th><th>Title</th><th>Author</th><th>Category</th><th>Copies</th></tr>
              </thead>
              <tbody>
                {books.slice(0, 50).map((b, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>{b.title}</td><td>{b.author}</td><td>{b.category}</td><td>{b.totalCopies || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary w-100" disabled={saving} onClick={importNow}>
            {saving ? <span className="spinner-border spinner-border-sm"></span> : `Import ${books.length} books`}
          </button>
        </>
      )}

      {result && (
        <div>
          <div className="alert alert-success py-2">
            <i className="bi bi-check2-circle me-2"></i>
            {result.message}
          </div>
          {result.skipped.length > 0 && (
            <div className="app-card p-2 small" style={{ maxHeight: 200, overflow: "auto" }}>
              {result.skipped.map((s) => (
                <div key={s.line} className="py-1">
                  <strong>Row {s.line}</strong> {s.title && `(${s.title})`}: <span className="text-danger">{s.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
