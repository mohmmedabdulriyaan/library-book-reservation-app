// Waitlist model: students waiting for a book that has no copies left
const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    // waiting   -> in the queue
    // fulfilled -> a copy was reserved for the student automatically
    // cancelled -> the student left the queue
    status: {
      type: String,
      enum: ["waiting", "fulfilled", "cancelled"],
      default: "waiting",
    },
    fulfilledAt: Date,
  },
  { timestamps: true } // createdAt decides the order of the queue
);

module.exports = mongoose.model("Waitlist", waitlistSchema);
