// Book cover: shows the real front cover of the book.
// It tries these pictures in order and uses the first one that loads:
//   1. the cover link the admin saved (coverUrl)
//   2. Amazon book images (by ISBN-10) - fast and good quality
//   3. Open Library covers dataset (by ISBN)
// If none of them work, it draws a printed-style cover with the title and author.
//
// Speed: the picture that worked is remembered in the browser (localStorage),
// so next time the cover appears at once without trying the other sites again.
import { useState } from "react";

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

// Ask for the BIG version of a saved cover link, so it stays sharp
const hdLink = (url) => {
  // Google Books thumbnails are tiny (128px): ask for an 800px wide picture
  if (/books\.google|googleusercontent/.test(url)) {
    return url.replace("http://", "https://").replace(/&edge=curl/g, "").replace(/&fife=[^&]*/g, "") + "&fife=w800";
  }
  // Open Library: -S / -M (small / medium) -> -L (large)
  if (url.includes("covers.openlibrary.org")) return url.replace(/-[SM]\.jpg/, "-L.jpg");
  return url;
};

// All picture addresses we can try for a book (large, HD versions)
export const coverSources = (book) => {
  const list = [];
  if (book.coverUrl) list.push(hdLink(book.coverUrl));
  if (book.isbn) {
    const isbn = book.isbn.replace(/[^0-9X]/gi, "");
    const isbn10 = toIsbn10(isbn);
    // LZZZZZZZ = Amazon's large picture (about 500px tall, sharp even on phones)
    if (isbn10) list.push(`https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`);
    list.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
  }
  return list;
};

// First picture address (used where only one link is needed)
export const coverImageUrl = (book) => coverSources(book)[0] || "";

const NONE_RETRY_MS = 24 * 60 * 60 * 1000; // 1 day

// Sources to try, starting with the one that worked last time
const sourcesFor = (book) => {
  const all = coverSources(book);
  const id = book.coverUrl || book.isbn;
  const remembered = id ? readCache()[id] : undefined;
  // "none" means no site had this cover. Try again after a day, in case the
  // first try only failed because the internet was slow or offline.
  if (typeof remembered === "string" && remembered.startsWith("none")) {
    const when = Number(remembered.split(":")[1]) || 0;
    if (Date.now() - when < NONE_RETRY_MS && !book.coverUrl) return { id, list: [] };
    return { id, list: all };
  }
  if (remembered && all.includes(remembered)) return { id, list: [remembered, ...all.filter((s) => s !== remembered)] };
  return { id, list: all };
};

// Last name of the first author, for the drawn cover
const shortAuthor = (author = "") => author.split(",")[0].trim();

export default function BookCover({ book, style, className = "", eager = false }) {
  const bookId = book.coverUrl || book.isbn || book._id || book.title;

  // The list of pictures is worked out ONCE per book and then kept.
  // (Before, it was worked out again on every render. When a picture loaded,
  // the cache changed the order of the list, the cover reset itself and the
  // picture stayed hidden until you left the page and came back.)
  const [state, setState] = useState(() => ({ bookId, ...sourcesFor(book), index: 0, loaded: false }));
  let current = state;
  if (state.bookId !== bookId) {
    // A different book was passed in: start again from the first picture
    current = { bookId, ...sourcesFor(book), index: 0, loaded: false };
    setState(current);
  }
  const { id, list, index, loaded } = current;
  const src = list[index];

  const tryNext = () => {
    if (index + 1 >= list.length && id) saveCache(id, `none:${Date.now()}`); // no site has this cover
    setState((s) => (s.bookId === bookId ? { ...s, index: s.index + 1, loaded: false } : s));
  };

  const showPicture = (img) => {
    // Some sites send a tiny 1x1 picture instead of an error when they have no cover
    if (img.naturalWidth < 20) return tryNext();
    if (id) saveCache(id, src);
    setState((s) => (s.bookId === bookId && !s.loaded ? { ...s, loaded: true } : s));
  };

  // If the picture was already in the browser cache it can finish loading
  // before React is listening, so check it as soon as the <img> exists.
  const checkReady = (img) => {
    if (img && !loaded && img.complete && img.naturalWidth > 0) showPicture(img);
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
          ref={checkReady}
          onLoad={(e) => showPicture(e.currentTarget)}
          onError={tryNext}
        />
      )}
    </div>
  );
}
