// Book cover: shows the real front cover of the book.
// It tries these pictures in order and uses the first one that loads:
//   1. the cover link the admin saved (coverUrl)
//   2. Amazon book images (by ISBN-10) - fast and good quality
//   3. Open Library covers dataset (by ISBN)
// If none of them work, it draws a printed-style cover with the title and author.
//
// Speed: the picture that worked is remembered in the browser (localStorage),
// so next time the cover appears at once without trying the other sites again.
import { useEffect, useState } from "react";

// Turn a 13-digit ISBN (978...) into the older 10-digit ISBN
const toIsbn10 = (isbn = "") => {
  const digits = isbn.replace(/[^0-9X]/gi, "");
  if (digits.length === 10) return digits;
  if (digits.length !== 13 || !digits.startsWith("978")) return "";
  const core = digits.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(core[i]) * (10 - i);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? "X" : String(check));
};

// ---------- Remember which picture worked ----------
const CACHE_KEY = "coverCache";
let memory = null;
const readCache = () => {
  if (memory) return memory;
  try {
    memory = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    memory = {};
  }
  return memory;
};
const saveCache = (id, value) => {
  const cache = readCache();
  if (cache[id] === value) return;
  cache[id] = value;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full or blocked: covers still work, just not remembered
  }
};

// All picture addresses we can try for a book
export const coverSources = (book) => {
  const list = [];
  if (book.coverUrl) list.push(book.coverUrl);
  if (book.isbn) {
    const isbn = book.isbn.replace(/[^0-9X]/gi, "");
    const isbn10 = toIsbn10(isbn);
    if (isbn10) list.push(`https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.MZZZZZZZ.jpg`);
    list.push(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`);
  }
  return list;
};

// First picture address (used where only one link is needed)
export const coverImageUrl = (book) => coverSources(book)[0] || "";

// Sources to try, starting with the one that worked last time
const sourcesFor = (book) => {
  const all = coverSources(book);
  const id = book.coverUrl || book.isbn;
  const remembered = id ? readCache()[id] : undefined;
  if (remembered === "none" && !book.coverUrl) return { id, list: [] };
  if (remembered && all.includes(remembered)) return { id, list: [remembered, ...all.filter((s) => s !== remembered)] };
  return { id, list: all };
};

// Last name of the first author, for the drawn cover
const shortAuthor = (author = "") => author.split(",")[0].trim();

export default function BookCover({ book, style, className = "", eager = false }) {
  const { id, list } = sourcesFor(book);
  const key = list.join("|");
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // A different book was passed in: start again from the first picture
  useEffect(() => {
    setIndex(0);
    setLoaded(false);
  }, [key]);

  const src = list[index];

  const tryNext = () => {
    setLoaded(false);
    if (index + 1 >= list.length && id) saveCache(id, "none"); // no site has this cover
    setIndex((i) => i + 1);
  };

  // Some sites send a tiny 1x1 picture instead of an error when they have no cover
  const handleLoad = (e) => {
    if (e.target.naturalWidth < 20) return tryNext();
    setLoaded(true);
    if (id) saveCache(id, src);
  };

  return (
    <div
      className={`book-cover ${loaded ? "has-img" : ""} ${className}`}
      style={{ "--cover": book.coverColor || "#4f46e5", ...style }}
    >
      {/* Drawn cover, visible until a real picture loads (or if none exists) */}
      <div className="cover-art">
        <i className={`bi ${book.icon || "bi-book"}`}></i>
        <div className="cover-title">{book.title}</div>
        <div className="cover-author">{shortAuthor(book.author)}</div>
      </div>
      {src && (
        <img
          key={src}
          src={src}
          alt={book.title}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={eager ? "high" : "auto"}
          referrerPolicy="no-referrer"
          className={loaded ? "show" : ""}
          onLoad={handleLoad}
          onError={tryNext}
        />
      )}
    </div>
  );
}
