const express = require("express");
const {
  getBooks,
  getCategories,
  getBookById,
  createBook,
  bulkCreateBooks,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const { getBookReviews, saveReview, deleteReview } = require("../controllers/reviewController");
const { getSimilarBooks, getRecommendedBooks } = require("../controllers/recommendController");
const { lookupIsbn } = require("../controllers/isbnController");
const { protect, studentOnly, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Anyone can browse books
router.get("/", getBooks);
router.get("/categories", getCategories); // must be above "/:id"
router.get("/recommended", protect, studentOnly, getRecommendedBooks); // "Recommended for you"
router.get("/lookup/:isbn", protect, adminOnly, lookupIsbn); // "Add book by ISBN"
router.get("/:id", getBookById);
router.get("/:id/similar", getSimilarBooks); // "You may also like"

// Ratings and reviews
router.get("/:id/reviews", getBookReviews);
router.post("/:id/reviews", protect, studentOnly, saveReview);
router.delete("/:id/reviews/:reviewId", protect, deleteReview);

// Only admin can add / edit / delete
router.post("/", protect, adminOnly, createBook);
router.post("/bulk", protect, adminOnly, bulkCreateBooks);
router.put("/:id", protect, adminOnly, updateBook);
router.delete("/:id", protect, adminOnly, deleteBook);

module.exports = router;
