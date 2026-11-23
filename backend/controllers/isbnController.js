// "Add book by ISBN": the admin types an ISBN and we fill in the details
// (title, author, category, description, cover) from free book websites:
//   1. Google Books   (googleapis.com)
//   2. Open Library   (openlibrary.org) - used if Google has nothing
// The admin can still change anything before saving.
const asyncHandler = require("../utils/asyncHandler");
const Book = require("../models/Book");

const cleanIsbn = (isbn = "") => String(isbn).replace(/[^0-9Xx]/g, "").toUpperCase();

// fetch() with a time limit so a slow website does not hang the form
const getJson = async (url) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "college-library-app" } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null; // no internet, timeout or bad reply
  }
};

const fromGoogle = async (isbn) => {
  const key = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : "";
  const data = await getJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${key}`);
  const info = data && data.items && data.items[0] && data.items[0].volumeInfo;
  if (!info || !info.title) return null;
  const image = info.imageLinks && (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail);
  return {
    title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
    author: (info.authors || []).join(", "),
    category: (info.categories || [])[0] || "",
    description: info.description || "",
    coverUrl: image ? image.replace("http://", "https://").replace("&edge=curl", "") : "",
    source: "Google Books",
  };
};

const fromOpenLibrary = async (isbn) => {
  const data = await getJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
  const info = data && data[`ISBN:${isbn}`];
  if (!info || !info.title) return null;
  const notes = typeof info.notes === "string" ? info.notes : info.notes && info.notes.value;
  return {
    title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
    author: (info.authors || []).map((a) => a.name).join(", "),
    category: ((info.subjects || [])[0] || {}).name || "",
    description: notes || "",
    coverUrl: (info.cover && (info.cover.medium || info.cover.large)) || "",
    source: "Open Library",
  };
};

// @route  GET /api/books/lookup/:isbn
// @access Admin
const lookupIsbn = asyncHandler(async (req, res) => {
  const isbn = cleanIsbn(req.params.isbn);
  if (isbn.length !== 10 && isbn.length !== 13) {
    res.status(400);
    throw new Error("An ISBN has 10 or 13 digits");
  }

  // Already in the library?
  const existing = await Book.findOne({ isbn }).select("title");
  if (existing) {
    res.status(409);
    throw new Error(`"${existing.title}" with this ISBN is already in the library`);
  }

  const details = (await fromGoogle(isbn)) || (await fromOpenLibrary(isbn));
  if (!details) {
    res.status(404);
    throw new Error("No details found for this ISBN. Check the number or type the details yourself.");
  }

  // Remove HTML tags some websites put in the text, and keep it short enough for the app
  details.description = details.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (details.description.length > 1200) details.description = details.description.slice(0, 1197) + "...";
  res.json({ isbn, ...details });
});

module.exports = { lookupIsbn };
