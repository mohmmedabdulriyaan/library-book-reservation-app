// Book ratings and reviews
const asyncHandler = require("../utils/asyncHandler");
const Book = require("../models/Book");
const Review = require("../models/Review");
const Reservation = require("../models/Reservation");

// Work out the average stars of a book again and save it on the book
// (so lists can show the rating without loading every review)
const updateBookRating = async (bookId) => {
  const [result] = await Review.aggregate([
    { $match: { book: bookId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Book.findByIdAndUpdate(bookId, {
    ratingAvg: result ? Math.round(result.avg * 10) / 10 : 0,
    ratingCount: result ? result.count : 0,
  });
};

const findBook = async (id, res) => {
  const book = await Book.findById(id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }
  return book;
};

// @route  GET /api/books/:id/reviews
// @access Public
const getBookReviews = asyncHandler(async (req, res) => {
  const book = await findBook(req.params.id, res);
  const reviews = await Review.find({ book: book._id })
    .populate("student", "name batch")
    .sort({ updatedAt: -1 });

  // How many reviews gave 5 stars, 4 stars, ... (for the little bar chart)
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  res.json({
    ratingAvg: book.ratingAvg || 0,
    ratingCount: book.ratingCount || 0,
    breakdown,
    reviews,
  });
});

// @route  POST /api/books/:id/reviews
// @access Student   Body: { "rating": 4, "comment": "Very useful for exams" }
// Writing again changes your old review.
const saveReview = asyncHandler(async (req, res) => {
  const book = await findBook(req.params.id, res);
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Pick a star rating from 1 to 5");
  }
  if (comment.length > 500) {
    res.status(400);
    throw new Error("Comment can be at most 500 characters");
  }

  // Only students who borrowed and returned this book can review it
  const hasRead = await Reservation.exists({ student: req.user._id, book: book._id, status: "returned" });
  if (!hasRead) {
    res.status(403);
    throw new Error("You can review a book after you have borrowed and returned it");
  }

  const existing = await Review.findOne({ book: book._id, student: req.user._id });
  const review = await Review.findOneAndUpdate(
    { book: book._id, student: req.user._id },
    { rating, comment },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("student", "name batch");

  await updateBookRating(book._id);
  res.status(existing ? 200 : 201).json({ message: existing ? "Review updated" : "Thanks for your review!", review });
});

// @route  DELETE /api/books/:id/reviews/:reviewId
// @access Student (own review) or Admin (any review, e.g. a rude comment)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.reviewId, book: req.params.id });
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  if (req.role !== "admin" && String(review.student) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only delete your own review");
  }
  await review.deleteOne();
  await updateBookRating(review.book);
  res.json({ message: "Review deleted" });
});

module.exports = { getBookReviews, saveReview, deleteReview, updateBookRating };
