// Digital library: PDFs of notes, previous question papers and e-books.
// PDFs are stored inside MongoDB, so nothing is saved on the server's disk.
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");
const Resource = require("../models/Resource");

// @route  GET /api/resources
// @access Logged in
// Query (optional): type=notes|question_paper|ebook, subject=..., search=...
const getResources = asyncHandler(async (req, res) => {
  const { type, subject, search } = req.query;
  const filter = {};
  if (type && type !== "all") filter.type = type;
  if (subject && subject !== "All") filter.subject = subject;
  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: regex }, { subject: regex }, { description: regex }];
  }

  const [resources, subjects] = await Promise.all([
    Resource.find(filter).sort({ createdAt: -1 }), // the PDF data is not loaded here
    Resource.distinct("subject"),
  ]);
  res.json({ count: resources.length, subjects: subjects.sort(), resources });
});

// @route  GET /api/resources/:id/file
// @access Public (so the PDF can open in a new browser tab)
const openResourceFile = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).select("+data");
  if (!resource || !resource.data) {
    res.status(404);
    throw new Error("File not found");
  }

  const downloadName = (resource.originalName || `${resource.title}.pdf`).replace(/[^\w .()-]/g, "");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${downloadName}"`);
  res.send(resource.data);
});

// @route  POST /api/resources   (form-data: file + title, type, subject, year, description)
// @access Admin
const createResource = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please choose a PDF file");
  }

  const { title, type, subject, year, description } = req.body;
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error("Title is required");
  }

  const resource = await Resource.create({
    title: title.trim(),
    type: type || "notes",
    subject: (subject || "General").trim() || "General",
    year: year ? Number(year) : undefined,
    description: (description || "").trim(),
    data: req.file.buffer,
    originalName: req.file.originalname,
    size: req.file.size,
  });

  const saved = resource.toObject();
  delete saved.data; // don't send the whole PDF back
  res.status(201).json({ message: "PDF uploaded", resource: saved });
});

// @route  DELETE /api/resources/:id
// @access Admin
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error("File not found");
  }
  res.json({ message: "PDF deleted" });
});

module.exports = { getResources, openResourceFile, createResource, deleteResource };
