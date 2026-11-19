// BookRequest model: a student asks the library to buy a book it does not have.
// Other students can "+1" the same request, so the admin sees the most wanted books.
const mongoose = require("mongoose");

const bookRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Book title is required"], trim: true },
    author: { type: String, trim: true, default: "" },
    reason: { type: String, trim: true, default: "" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    // Everyone who wants this book (includes the student who asked first)
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    // pending   -> waiting for the admin
    // approved  -> the library will buy it
    // added     -> the book is now in the library
    // rejected  -> the library will not buy it
    status: {
      type: String,
      enum: ["pending", "approved", "added", "rejected"],
      default: "pending",
    },
    adminNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookRequest", bookRequestSchema);
