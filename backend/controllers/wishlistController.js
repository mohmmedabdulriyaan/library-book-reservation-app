// Wishlist: students save books to read later
const asyncHandler = require("../utils/asyncHandler");
const Wishlist = require("../models/Wishlist");
const Book = require("../models/Book");

// @route  GET /api/wishlist
// @access Student
const getWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ student: req.user._id }).populate("book").sort({ createdAt: -1 });
  const books = items.filter((i) => i.book).map((i) => ({ ...i.book.toObject(), savedAt: i.createdAt }));
  res.json({ count: books.length, books });
});

// @route  POST /api/wishlist
// @access Student
// Body: { "bookId": "..." }
const addToWishlist = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const book = bookId ? await Book.findById(bookId) : null;
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  const exists = await Wishlist.findOne({ student: req.user._id, book: bookId });
  if (!exists) await Wishlist.create({ student: req.user._id, book: bookId });

  res.status(201).json({ message: `"${book.title}" saved to your wishlist` });
});

// @route  DELETE /api/wishlist/:bookId
// @access Student
const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.deleteOne({ student: req.user._id, book: req.params.bookId });
  res.json({ message: "Removed from your wishlist" });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
