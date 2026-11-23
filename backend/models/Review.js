// Review model: a star rating (1-5) and a short comment from a student.
// A student can review a book only after returning it, and only once
// (writing again updates the old review).
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Pick a star rating"],
      min: [1, "Rating must be 1 to 5 stars"],
      max: [5, "Rating must be 1 to 5 stars"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment can be at most 500 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// One review per student per book
reviewSchema.index({ book: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
