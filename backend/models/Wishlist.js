// Wishlist model: books a student saved to read later
const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  },
  { timestamps: true }
);

// A book can be in a student's wishlist only once
wishlistSchema.index({ student: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
