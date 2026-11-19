// Resource model: a PDF in the digital library
// (class notes, previous question papers, e-books)
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    type: {
      type: String,
      enum: ["notes", "question_paper", "ebook"],
      default: "notes",
    },
    subject: { type: String, trim: true, default: "General" },
    year: { type: Number }, // e.g. 2025 for a question paper (optional)
    description: { type: String, trim: true, default: "" },
    // The PDF itself is saved inside MongoDB, so it also works after deploying
    // (online servers often delete files saved on their disk).
    // select: false = not loaded in lists, only when the PDF is opened.
    data: { type: Buffer, required: true, select: false },
    fileName: { type: String, default: "" }, // e.g. "sample-1.pdf" for the demo PDFs
    originalName: { type: String, default: "" },
    size: { type: Number, default: 0 }, // bytes
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
