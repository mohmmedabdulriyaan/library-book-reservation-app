// A row of book tiles that scrolls sideways (used for suggestions)
import BookTile from "./BookTile";

export default function BookRow({ books }) {
  return (
    <div className="book-row">
      {books.map((book) => (
        <div key={book._id} className="book-row-item">
          <BookTile book={book} />
        </div>
      ))}
    </div>
  );
}
