// Book model: every book in the library
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true, // allows books without an ISBN
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [0, "Copies cannot be negative"],
      default: 1,
    },
    availableCopies: {
      type: Number,
      min: [0, "Copies cannot be negative"],
    },
    // Link to a cover picture. If empty, the app uses the ISBN to load the
    // real cover from the Open Library covers dataset (covers.openlibrary.org)
    coverUrl: {
      type: String,
      default: "",
      trim: true,
    },
    // Used by the app to draw a simple coloured book cover when there is no picture
    coverColor: {
      type: String,
      default: "#0d6efd",
    },
    // Bootstrap icon name, e.g. "bi-book", "bi-cpu"
    icon: {
      type: String,
      default: "bi-book",
    },
  },
  { timestamps: true }
);

// When a new book is added, all copies are available
bookSchema.pre("save", function (next) {
  if (this.isNew && this.availableCopies === undefined) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

module.exports = mongoose.model("Book", bookSchema);
