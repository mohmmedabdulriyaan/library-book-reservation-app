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
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Anyone can browse books
router.get("/", getBooks);
router.get("/categories", getCategories); // must be above "/:id"
router.get("/:id", getBookById);

// Only admin can add / edit / delete
router.post("/", protect, adminOnly, createBook);
router.post("/bulk", protect, adminOnly, bulkCreateBooks);
router.put("/:id", protect, adminOnly, updateBook);
router.delete("/:id", protect, adminOnly, deleteBook);

module.exports = router;
