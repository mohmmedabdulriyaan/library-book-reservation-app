// Announcement model: notices from the library to all students
// e.g. "Library closed on Monday", "20 new books arrived"
const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    message: { type: String, required: [true, "Message is required"], trim: true },
    important: { type: Boolean, default: false }, // shown highlighted, and emailed
    postedBy: { type: String, default: "Library Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
