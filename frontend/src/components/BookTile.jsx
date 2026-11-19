// A book in a grid: cover on top, title and author below
import { Link } from "react-router-dom";
import BookCover from "./BookCover";

export default function BookTile({ book, eager = false }) {
  const available = book.availableCopies > 0;
  return (
    <Link to={`/books/${book._id}`} className="book-tile">
      <BookCover book={book} eager={eager} />
      <div className="t">{book.title}</div>
      <div className="a">{book.author}</div>
      <div className={`small fw-semibold ${available ? "text-success" : "text-danger"}`} style={{ fontSize: "0.72rem" }}>
        <span className="avail-dot" style={{ background: available ? "var(--success)" : "var(--danger)" }}></span>
        {available ? `${book.availableCopies} available` : "Waitlist"}
      </div>
    </Link>
  );
}
