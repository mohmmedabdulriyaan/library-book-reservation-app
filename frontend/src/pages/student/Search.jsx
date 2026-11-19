import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import BookTile from "../../components/BookTile";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeleton";

export default function Search() {
  // The category can come from the Home screen link: /search?category=Programming
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "All";

  const [text, setText] = useState("");
  const [search, setSearch] = useState(""); // text after the user stops typing
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState("title");
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load categories once
  useEffect(() => {
    api.get("/books/categories").then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  // Wait 300 ms after typing stops before searching (fewer requests)
  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);

  // Load books whenever a filter changes
  useEffect(() => {
    setLoading(true);
    setError("");
    const params = { sort };
    if (search) params.search = search;
    if (category !== "All") params.category = category;
    if (availableOnly) params.available = "true";

    api
      .get("/books", { params })
      .then(({ data }) => setBooks(data.books))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [search, category, availableOnly, sort]);

  const chooseCategory = (c) => {
    if (c === "All") setSearchParams({});
    else setSearchParams({ category: c });
  };

  const clearAll = () => {
    setText("");
    setAvailableOnly(false);
    setSearchParams({});
  };

  return (
    <>
      <h1 className="page-title">Search books</h1>
      <p className="page-sub">Find a book and reserve it.</p>

      <div className="search-box mb-3">
        <i className="bi bi-search"></i>
        <input
          className="form-control"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Title, author or ISBN"
          autoFocus
        />
        {text && (
          <button className="clear-btn" onClick={() => setText("")} aria-label="Clear search">
            <i className="bi bi-x-circle-fill"></i>
          </button>
        )}
      </div>

      <div className="chip-scroll mb-3">
        {["All", ...categories].map((c) => (
          <button key={c} className={`chip ${category === c ? "active" : ""}`} onClick={() => chooseCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="availableOnly"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="availableOnly">
            Available only
          </label>
        </div>
        <select
          className="form-select form-select-sm w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort books"
        >
          <option value="title">Sort: Title A-Z</option>
          <option value="author">Sort: Author A-Z</option>
          <option value="available">Sort: Most available</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {loading ? (
        <div className="book-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>
              <SkeletonBlock height={0} style={{ aspectRatio: "3 / 4", height: "auto", borderRadius: 12 }} />
              <SkeletonBlock width="80%" height={12} className="mt-2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : books.length === 0 ? (
        <EmptyState icon="bi-search" title="No books found" text="Try another word or remove some filters.">
          <button className="btn btn-soft btn-sm" onClick={clearAll}>
            Clear filters
          </button>
        </EmptyState>
      ) : (
        <>
          <p className="small text-secondary mb-2">
            {books.length} book{books.length === 1 ? "" : "s"}
          </p>
          <div className="book-grid">
            {books.map((book, i) => (
              <BookTile key={book._id} book={book} eager={i < 12} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
