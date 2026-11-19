const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");
const Waitlist = require("../models/Waitlist");
const Wishlist = require("../models/Wishlist");
const { fillFromWaitlist } = require("../services/library");

// @route  GET /api/books
// @access Public
// Query options (all optional):
//   search=java        matches title, author or ISBN
//   category=Programming
//   available=true     only books with copies left
//   sort=title | author | newest | available
const getBooks = asyncHandler(async (req, res) => {
  const { search, category, available, sort } = req.query;
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: regex }, { author: regex }, { isbn: regex }];
  }

  if (category && category !== "All") {
    filter.category = category;
  }

  if (available === "true") {
    filter.availableCopies = { $gt: 0 };
  }

  const sortOptions = {
    title: { title: 1 },
    author: { author: 1 },
    newest: { createdAt: -1 },
    available: { availableCopies: -1, title: 1 },
  };

  const books = await Book.find(filter).sort(sortOptions[sort] || { title: 1 });
  res.json({ count: books.length, books });
});

// @route  GET /api/books/categories
// @access Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.distinct("category");
  res.json({ categories: categories.sort() });
});

// @route  GET /api/books/:id
// @access Public
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }
  res.json({ book });
});

// @route  POST /api/books
// @access Admin
const createBook = asyncHandler(async (req, res) => {
  const { title, author, isbn, category, description, totalCopies, coverColor, icon, coverUrl } = req.body;

  const copies = totalCopies === undefined ? 1 : Number(totalCopies);
  if (Number.isNaN(copies) || copies < 0) {
    res.status(400);
    throw new Error("Total copies must be 0 or more");
  }

  const book = await Book.create({
    title,
    author,
    isbn: isbn || undefined,
    category,
    description,
    totalCopies: copies,
    availableCopies: copies,
    coverColor,
    icon,
    coverUrl,
  });

  res.status(201).json({ message: "Book added", book });
});

// Colours and icons given to imported books (so every cover looks different)
const COLORS = ["#1e3a8a", "#0f766e", "#7c3aed", "#b45309", "#0369a1", "#15803d", "#9f1239", "#c2410c", "#4338ca", "#be123c"];
const ICONS = ["bi-book", "bi-journal-text", "bi-journal-bookmark", "bi-bookmark-star", "bi-lightbulb", "bi-stars"];

// @route  POST /api/books/bulk
// @access Admin
// Body: { "books": [ { title, author, category, isbn, totalCopies, description, coverUrl }, ... ] }
// Used by "Import CSV" in the admin panel. Bad rows and duplicate ISBNs are skipped, not failed.
const bulkCreateBooks = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body.books) ? req.body.books : [];
  if (rows.length === 0) {
    res.status(400);
    throw new Error("No books found in the file");
  }
  if (rows.length > 500) {
    res.status(400);
    throw new Error("You can import up to 500 books at a time");
  }

  const existingIsbns = new Set((await Book.find({ isbn: { $ne: null } }).select("isbn")).map((b) => b.isbn));
  const toInsert = [];
  const skipped = [];

  rows.forEach((row, i) => {
    const line = i + 2; // +1 for the header row, +1 because rows start at 1
    const title = String(row.title || "").trim();
    const author = String(row.author || "").trim();
    const category = String(row.category || "").trim();
    const isbn = String(row.isbn || "").replace(/[^0-9Xx]/g, "").toUpperCase();
    const copies = row.totalCopies === undefined || row.totalCopies === "" ? 1 : Number(row.totalCopies);

    if (!title || !author || !category) return skipped.push({ line, title, reason: "Title, author and category are required" });
    if (!Number.isInteger(copies) || copies < 0) return skipped.push({ line, title, reason: "Copies must be a whole number" });
    if (isbn && existingIsbns.has(isbn)) return skipped.push({ line, title, reason: `ISBN ${isbn} already exists` });

    if (isbn) existingIsbns.add(isbn); // also stops the same ISBN twice in one file
    toInsert.push({
      title,
      author,
      category,
      isbn: isbn || undefined,
      description: String(row.description || "").trim(),
      coverUrl: String(row.coverUrl || "").trim(),
      totalCopies: copies,
      availableCopies: copies,
      coverColor: COLORS[toInsert.length % COLORS.length],
      icon: ICONS[toInsert.length % ICONS.length],
    });
  });

  if (toInsert.length > 0) await Book.insertMany(toInsert);

  res.status(201).json({
    message: `${toInsert.length} book${toInsert.length === 1 ? "" : "s"} imported, ${skipped.length} skipped`,
    added: toInsert.length,
    skipped,
  });
});

// @route  PUT /api/books/:id
// @access Admin
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  const fields = ["title", "author", "isbn", "category", "description", "coverColor", "icon", "coverUrl"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) book[field] = req.body[field];
  });
  if (book.isbn === "") book.isbn = undefined;

  // If total copies change, change available copies by the same amount
  if (req.body.totalCopies !== undefined) {
    const newTotal = Number(req.body.totalCopies);
    const copiesOut = book.totalCopies - book.availableCopies; // reserved or issued right now

    if (Number.isNaN(newTotal) || newTotal < copiesOut) {
      res.status(400);
      throw new Error(`Total copies cannot be less than ${copiesOut} (copies currently reserved or issued)`);
    }

    book.totalCopies = newTotal;
    book.availableCopies = newTotal - copiesOut;
  }

  await book.save();

  // New copies added? Give them to students in the waitlist first
  if (book.availableCopies > 0) {
    await fillFromWaitlist(book._id);
  }

  const updated = await Book.findById(book._id);
  res.json({ message: "Book updated", book: updated });
});

// @route  DELETE /api/books/:id
// @access Admin
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  // Do not delete a book that a student has reserved or taken
  const activeCount = await Reservation.countDocuments({
    book: book._id,
    status: { $in: ["reserved", "issued"] },
  });
  if (activeCount > 0) {
    res.status(400);
    throw new Error("This book has active reservations. Return or cancel them first.");
  }

  await Reservation.deleteMany({ book: book._id }); // old history for this book
  await Waitlist.deleteMany({ book: book._id });
  await Wishlist.deleteMany({ book: book._id });
  await book.deleteOne();
  res.json({ message: "Book deleted" });
});

module.exports = { getBooks, getCategories, getBookById, createBook, bulkCreateBooks, updateBook, deleteBook };
