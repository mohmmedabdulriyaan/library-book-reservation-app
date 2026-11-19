// One book in a list: small cover, title, author and availability
import { Link } from "react-router-dom";
import BookCover from "./BookCover";

export default function BookListItem({ book }) {
  const available = book.availableCopies > 0;

  return (
    <Link to={`/books/${book._id}`} className="app-card book-row">
      <BookCover book={book} style={{ width: 64, fontSize: "1.4rem", flexShrink: 0 }} />
      <div className="flex-grow-1 overflow-hidden">
        <div className="fw-semibold text-truncate-2">{book.title}</div>
        <div className="small text-secondary text-truncate">{book.author}</div>
        <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
          <span className="badge-soft tint-primary">{book.category}</span>
          <span className={`badge-soft ${available ? "tint-success" : "tint-danger"}`}>
            {available ? `${book.availableCopies} available` : "Not available"}
          </span>
        </div>
      </div>
      <i className="bi bi-chevron-right text-secondary"></i>
    </Link>
  );
}
