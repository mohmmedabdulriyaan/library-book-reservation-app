// Student side: join or leave the waitlist for a book with no copies left
const asyncHandler = require("../utils/asyncHandler");
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");
const Waitlist = require("../models/Waitlist");
const { ACTIVE } = require("../services/library");

// Position in the queue (1 = next in line)
const getPosition = async (entry) =>
  (await Waitlist.countDocuments({ book: entry.book, status: "waiting", createdAt: { $lt: entry.createdAt } })) + 1;

// @route  POST /api/waitlist
// @access Student   Body: { "bookId": "..." }
const joinWaitlist = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const studentId = req.user._id;

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }
  if (book.availableCopies > 0) {
    res.status(400);
    throw new Error("This book has copies available. Reserve it instead.");
  }

  const hasIt = await Reservation.exists({ student: studentId, book: bookId, status: { $in: ACTIVE } });
  if (hasIt) {
    res.status(400);
    throw new Error("You already have this book");
  }

  const existing = await Waitlist.findOne({ student: studentId, book: bookId, status: "waiting" });
  if (existing) {
    res.status(400);
    throw new Error("You are already in the waitlist for this book");
  }

  const entry = await Waitlist.create({ student: studentId, book: bookId });
  const position = await getPosition(entry);

  res.status(201).json({
    message: `Added to the waitlist. You are number ${position} in line.`,
    entry: { ...entry.toObject(), position },
  });
});

// @route  GET /api/waitlist/my
// @access Student
const getMyWaitlist = asyncHandler(async (req, res) => {
  const entries = await Waitlist.find({ student: req.user._id, status: "waiting" })
    .populate("book", "title author category coverColor icon availableCopies")
    .sort({ createdAt: 1 });

  const list = [];
  for (const e of entries) {
    list.push({ ...e.toObject(), position: await getPosition(e) });
  }
  res.json({ count: list.length, waitlist: list });
});

// @route  DELETE /api/waitlist/:id
// @access Student (leave the queue)
const leaveWaitlist = asyncHandler(async (req, res) => {
  const entry = await Waitlist.findOne({ _id: req.params.id, student: req.user._id, status: "waiting" });
  if (!entry) {
    res.status(404);
    throw new Error("Waitlist entry not found");
  }
  entry.status = "cancelled";
  await entry.save();
  res.json({ message: "Removed from the waitlist" });
});

module.exports = { joinWaitlist, getMyWaitlist, leaveWaitlist };
