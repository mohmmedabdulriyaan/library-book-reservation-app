// Student side: reserve a book, see my reservations, cancel, renew
const asyncHandler = require("../utils/asyncHandler");
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");
const Waitlist = require("../models/Waitlist");
const { notifyAdmin } = require("../services/notify");
const { ACTIVE, toClient, takeCopy, createReservation, releaseCopy } = require("../services/library");
const { getLimitForBatch } = require("../services/limits");
const {
  PICKUP_DAYS,
  RENEW_DAYS,
  MAX_RENEWALS,
} = require("../config/constants");

const DAY = 24 * 60 * 60 * 1000;
const BOOK_FIELDS = "title author category isbn coverColor icon";

// @route  POST /api/reservations
// @access Student
// Body: { "bookId": "..." }
const reserveBook = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const studentId = req.user._id;

  if (!bookId) {
    res.status(400);
    throw new Error("bookId is required");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  // 1. Same book already reserved or taken by this student?
  const already = await Reservation.findOne({ student: studentId, book: bookId, status: { $in: ACTIVE } });
  if (already) {
    res.status(400);
    throw new Error(`You already have this book (${already.status})`);
  }

  // 2. Limit of books per student (the admin can set a different limit for each batch)
  const limit = await getLimitForBatch(req.user.batch);
  const activeCount = await Reservation.countDocuments({ student: studentId, status: { $in: ACTIVE } });
  if (activeCount >= limit) {
    res.status(400);
    throw new Error(`Batch ${req.user.batch} students can hold only ${limit} books at a time`);
  }

  // 3. Take one copy, but only if a copy is left
  const updatedBook = await takeCopy(bookId);
  if (!updatedBook) {
    res.status(400);
    throw new Error("No copies left. You can join the waitlist instead.");
  }

  let reservation;
  try {
    reservation = await createReservation(studentId, bookId);
  } catch (error) {
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } }); // give the copy back
    throw error;
  }

  // If the student was in the waitlist for this book, they no longer need to wait
  await Waitlist.updateMany(
    { student: studentId, book: bookId, status: "waiting" },
    { status: "fulfilled", fulfilledAt: new Date() }
  );

  await notifyAdmin(
    "new_reservation",
    "New reservation",
    `${req.user.name} (${req.user.rollNumber}, Batch ${req.user.batch}) reserved "${updatedBook.title}".`
  );

  await reservation.populate("book", BOOK_FIELDS);

  res.status(201).json({
    message: `"${updatedBook.title}" reserved. Collect it within ${PICKUP_DAYS} days using code ${reservation.pickupCode}.`,
    reservation: toClient(reservation),
  });
});

// @route  GET /api/reservations/my
// @access Student
// Optional: ?status=reserved | issued | returned | cancelled | expired
const getMyReservations = asyncHandler(async (req, res) => {
  const filter = { student: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const reservations = await Reservation.find(filter).populate("book", BOOK_FIELDS).sort({ createdAt: -1 });

  // Books that other students are waiting for cannot be renewed
  const waitedBooks = await Waitlist.distinct("book", { status: "waiting" });
  const waitedSet = new Set(waitedBooks.map((id) => id.toString()));

  const list = reservations.map((r) => {
    const obj = toClient(r);
    obj.canRenew =
      r.status === "issued" &&
      !obj.isOverdue &&
      r.renewCount < MAX_RENEWALS &&
      !!r.book &&
      !waitedSet.has(r.book._id.toString());
    return obj;
  });

  const totalFineDue = list.reduce((sum, r) => sum + r.fineDue, 0);
  const limit = await getLimitForBatch(req.user.batch);
  res.json({ count: list.length, totalFineDue, limit, reservations: list });
});

// @route  PUT /api/reservations/:id/cancel
// @access Student (own reservation, only while status is "reserved")
const cancelMyReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, student: req.user._id });

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }
  if (reservation.status !== "reserved") {
    res.status(400);
    throw new Error(`Only reserved books can be cancelled (this one is ${reservation.status})`);
  }

  reservation.status = "cancelled";
  reservation.cancelledAt = new Date();
  await reservation.save();

  // Give the copy back (and to the next student in the waitlist)
  await releaseCopy(reservation.book);

  res.json({ message: "Reservation cancelled", reservation: toClient(reservation) });
});

// @route  PUT /api/reservations/:id/renew
// @access Student  (adds RENEW_DAYS to the due date, once, if nobody is waiting)
const renewReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, student: req.user._id });

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }
  if (reservation.status !== "issued") {
    res.status(400);
    throw new Error("Only issued books can be renewed");
  }
  if (reservation.dueDate < new Date()) {
    res.status(400);
    throw new Error("Overdue books cannot be renewed. Please return it to the library.");
  }
  if (reservation.renewCount >= MAX_RENEWALS) {
    res.status(400);
    throw new Error(`A book can be renewed only ${MAX_RENEWALS} time${MAX_RENEWALS === 1 ? "" : "s"}`);
  }
  const someoneWaiting = await Waitlist.exists({ book: reservation.book, status: "waiting" });
  if (someoneWaiting) {
    res.status(400);
    throw new Error("Other students are waiting for this book, so it cannot be renewed");
  }

  reservation.dueDate = new Date(reservation.dueDate.getTime() + RENEW_DAYS * DAY);
  reservation.renewCount += 1;
  reservation.dueSoonNotified = false; // send a new reminder for the new date
  await reservation.save();
  await reservation.populate("book", BOOK_FIELDS);

  res.json({ message: `Renewed. New due date: ${reservation.dueDate.toDateString()}`, reservation: toClient(reservation) });
});

// @route  GET /api/reservations/stats
// @access Student
// Reading stats: books read, favourite category, monthly chart, streak, badges
const getMyStats = asyncHandler(async (req, res) => {
  const all = await Reservation.find({ student: req.user._id, issuedAt: { $ne: null } }).populate("book", "title category");
  const now = new Date();
  const year = now.getFullYear();

  const returned = all.filter((r) => r.status === "returned");
  const readThisYear = returned.filter((r) => r.returnedAt && r.returnedAt.getFullYear() === year).length;
  const onTime = returned.filter((r) => r.returnedAt && r.dueDate && r.returnedAt <= r.dueDate).length;
  const finesPaid = returned.filter((r) => r.finePaid).reduce((sum, r) => sum + (r.fineAmount || 0), 0);

  // Books per category
  const categoryCount = {};
  all.forEach((r) => {
    const c = r.book ? r.book.category : "Other";
    categoryCount[c] = (categoryCount[c] || 0) + 1;
  });
  const categories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Books borrowed in each of the last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, now.getMonth() - i, 1);
    const count = all.filter(
      (r) => r.issuedAt.getFullYear() === d.getFullYear() && r.issuedAt.getMonth() === d.getMonth()
    ).length;
    months.push({ label: d.toLocaleString("en-US", { month: "short" }), count });
  }

  // Streak: months in a row (up to this month) with at least one book borrowed
  let streak = 0;
  for (let i = 0; i < 24; i++) {
    const d = new Date(year, now.getMonth() - i, 1);
    const has = all.some(
      (r) => r.issuedAt.getFullYear() === d.getFullYear() && r.issuedAt.getMonth() === d.getMonth()
    );
    if (has) streak++;
    else if (i > 0) break; // this month can still be empty without breaking the streak
  }

  const total = all.length;
  const level = total >= 10 ? "Scholar" : total >= 3 ? "Bookworm" : "Beginner";

  res.json({
    totalBorrowed: total,
    reading: all.filter((r) => r.status === "issued").length,
    readThisYear,
    onTimeRate: returned.length ? Math.round((onTime / returned.length) * 100) : 100,
    finesPaid,
    favouriteCategory: categories[0] ? categories[0].category : null,
    categories,
    months,
    streak,
    level,
    recent: returned
      .sort((a, b) => b.returnedAt - a.returnedAt)
      .slice(0, 5)
      .map((r) => ({ _id: r._id, title: r.book ? r.book.title : "Deleted book", returnedAt: r.returnedAt })),
  });
});

module.exports = { reserveBook, getMyReservations, cancelMyReservation, renewReservation, getMyStats };
