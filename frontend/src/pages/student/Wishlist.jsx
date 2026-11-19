// Wishlist: books the student saved to read later
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import BookTile from "../../components/BookTile";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeleton";

export default function Wishlist() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/wishlist")
      .then(({ data }) => setBooks(data.books))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (book) => {
    try {
      await api.delete(`/wishlist/${book._id}`);
      setBooks((list) => list.filter((b) => b._id !== book._id));
      toast.info(`"${book.title}" removed`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const availableCount = books.filter((b) => b.availableCopies > 0).length;

  return (
    <div>
      <h1 className="page-title">My wishlist</h1>
      <p className="page-sub">
        {books.length === 0
          ? "Save books you want to read later."
          : `${books.length} saved · ${availableCount} available to reserve now`}
      </p>

      {loading ? (
        <div className="book-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBlock key={i} height={0} style={{ aspectRatio: "3 / 4", borderRadius: 12 }} />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : books.length === 0 ? (
        <EmptyState icon="bi-heart" tint="tint-danger" title="Your wishlist is empty" text="Tap the heart on any book to save it here.">
          <Link to="/search" className="btn btn-primary btn-sm">
            Browse books
          </Link>
        </EmptyState>
      ) : (
        <div className="book-grid">
          {books.map((book, i) => (
            <div key={book._id} className="position-relative">
              <BookTile book={book} eager={i < 9} />
              <button className="wish-remove" onClick={() => remove(book)} aria-label={`Remove ${book.title}`}>
                <i className="bi bi-heart-fill"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
