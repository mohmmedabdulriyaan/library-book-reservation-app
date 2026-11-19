import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import BookCover from "../../components/BookCover";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import { SkeletonList } from "../../components/Skeleton";
import BookForm from "./BookForm";
import BookHolders from "./BookHolders";
import ImportBooks from "./ImportBooks";

export default function ManageBooks() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Which pop-up is open: { type: "add" | "edit" | "holders" | "delete", book }
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = { sort: "title" };
    if (search) params.search = search;
    if (category !== "All") params.category = category;
    api
      .get("/books", { params })
      .then(({ data }) => setBooks(data.books))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  const loadCategories = () =>
    api.get("/books/categories").then(({ data }) => setCategories(data.categories)).catch(() => {});

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(load, [search, category]);

  const saveBook = async (form) => {
    setSaving(true);
    try {
      if (modal.type === "edit") {
        await api.put(`/books/${modal.book._id}`, form);
        toast.success("Book updated");
      } else {
        await api.post("/books", form);
        toast.success("Book added");
      }
      setModal(null);
      load();
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async () => {
    setSaving(true);
    try {
      await api.delete(`/books/${modal.book._id}`);
      toast.success("Book deleted");
      setModal(null);
      load();
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);

  return (
    <>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-sub">
            {books.length} titles · {availableCopies} of {totalCopies} copies on the shelf
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <button className="btn btn-light text-nowrap" onClick={() => setModal({ type: "import" })}>
            <i className="bi bi-filetype-csv me-1"></i>Import
          </button>
          <button className="btn btn-primary text-nowrap" onClick={() => setModal({ type: "add" })}>
            <i className="bi bi-plus-lg me-1"></i>Add book
          </button>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-8">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input className="form-control" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search title, author or ISBN" />
          </div>
        </div>
        <div className="col-md-4">
          <select className="form-select h-100" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : books.length === 0 ? (
        <EmptyState icon="bi-journal-x" title="No books found" text="Try another search, or add a new book." />
      ) : (
        <div className="app-card">
          {books.map((book) => {
            const out = book.totalCopies - book.availableCopies;
            return (
              <div key={book._id} className="list-row admin-book-row">
                <BookCover book={book} style={{ width: 56, fontSize: "1.1rem", flexShrink: 0 }} />
                <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                  <div className="fw-semibold text-truncate">{book.title}</div>
                  <div className="small text-secondary text-truncate">
                    {book.author} · {book.category}
                  </div>
                  <div className="small mt-1">
                    <span className={book.availableCopies > 0 ? "text-success fw-semibold" : "text-danger fw-semibold"}>
                      {book.availableCopies}/{book.totalCopies} available
                    </span>
                    {out > 0 && <span className="text-secondary"> · {out} out</span>}
                  </div>
                </div>
                <div className="admin-book-actions">
                  <button className="btn btn-soft btn-sm text-nowrap" onClick={() => setModal({ type: "holders", book })}>
                    <i className="bi bi-people me-1"></i>Who has it
                  </button>
                  <button className="btn btn-light btn-sm" onClick={() => setModal({ type: "edit", book })} aria-label="Edit">
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn btn-light btn-sm text-danger" onClick={() => setModal({ type: "delete", book })} aria-label="Delete">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(modal?.type === "add" || modal?.type === "edit") && (
        <Modal title={modal.type === "add" ? "Add a book" : "Edit book"} onClose={() => setModal(null)}>
          <BookForm book={modal.book} categories={categories} onSave={saveBook} saving={saving} />
        </Modal>
      )}

      {modal?.type === "import" && (
        <Modal title="Import books from CSV" onClose={() => setModal(null)} width={640}>
          <ImportBooks
            onDone={(message) => {
              toast.success(message);
              load();
              loadCategories();
            }}
          />
        </Modal>
      )}

      {modal?.type === "holders" && (
        <Modal title={modal.book.title} onClose={() => setModal(null)}>
          <BookHolders bookId={modal.book._id} />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <Modal title="Delete book?" onClose={() => setModal(null)} width={420}>
          <p>
            <strong>{modal.book.title}</strong> and its reservation history will be removed. This cannot be undone.
          </p>
          <div className="d-flex gap-2">
            <button className="btn btn-light flex-fill" onClick={() => setModal(null)}>
              Keep it
            </button>
            <button className="btn btn-danger flex-fill" onClick={deleteBook} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
