// "You may also like" suggestions
const asyncHandler = require("../utils/asyncHandler");
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");
const Wishlist = require("../models/Wishlist");

// Best books first: higher rating, then more copies on the shelf
const byQuality = (a, b) =>
  (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.availableCopies > 0) - (a.availableCopies > 0) || a.title.localeCompare(b.title);

// @route  GET /api/books/:id/similar
// @access Public
// Books by the same author first, then books from the same category.
const getSimilarBooks = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }
  const limit = 6;

  const [sameAuthor, sameCategory] = await Promise.all([
    Book.find({ _id: { $ne: book._id }, author: book.author }),
    Book.find({ _id: { $ne: book._id }, category: book.category }),
  ]);

  const picked = new Map();
  [...sameAuthor.sort(byQuality), ...sameCategory.sort(byQuality)].forEach((b) => {
    if (picked.size < limit) picked.set(String(b._id), b);
  });

  // Not enough? Fill up with the best rated books of the library
  if (picked.size < limit) {
    const top = await Book.find({ _id: { $nin: [book._id, ...picked.keys()] } })
      .sort({ ratingAvg: -1, availableCopies: -1 })
      .limit(limit - picked.size);
    top.forEach((b) => picked.set(String(b._id), b));
  }

  res.json({ books: [...picked.values()] });
});

// @route  GET /api/books/recommended
// @access Student
// Looks at the categories and authors of the books the student borrowed or
// saved, and suggests other books from them that the student has not read yet.
const getRecommendedBooks = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const [history, saved] = await Promise.all([
    Reservation.find({ student: studentId, status: { $in: ["reserved", "issued", "returned"] } }).populate("book", "category author"),
    Wishlist.find({ student: studentId }).populate("book", "category author"),
  ]);

  // Points for each category and author the student likes
  const categoryPoints = {};
  const authorPoints = {};
  const seen = new Set(); // books already borrowed, reserved or saved
  [...history, ...saved].forEach((item) => {
    if (!item.book) return; // book was deleted
    seen.add(String(item.book._id));
    categoryPoints[item.book.category] = (categoryPoints[item.book.category] || 0) + 1;
    authorPoints[item.book.author] = (authorPoints[item.book.author] || 0) + 1;
  });

  const candidates = await Book.find({ _id: { $nin: [...seen] } });
  const hasHistory = Object.keys(categoryPoints).length > 0;

  const scored = candidates
    .map((book) => ({
      book,
      score:
        (categoryPoints[book.category] || 0) * 2 +
        (authorPoints[book.author] || 0) * 3 +
        (book.ratingAvg || 0) * 0.5 +
        (book.availableCopies > 0 ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score || byQuality(a.book, b.book))
    .slice(0, 12)
    .map((s) => s.book);

  res.json({
    // "history" = based on what you read, "popular" = new student, best rated books
    basedOn: hasHistory ? "history" : "popular",
    books: scored,
  });
});

module.exports = { getSimilarBooks, getRecommendedBooks };
