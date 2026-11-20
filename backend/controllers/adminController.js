// Admin side: see who reserved / took each book, change status, fines, stats
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");
const Book = require("../models/Book");
const Student = require("../models/Student");
const Reservation = require("../models/Reservation");
const Waitlist = require("../models/Waitlist");
const BookRequest = require("../models/BookRequest");
const Resource = require("../models/Resource");
const crypto = require("crypto");
const { notifyStudent } = require("../services/notify");
const { DAY, ACTIVE, daysLate, toClient, releaseCopy } = require("../services/library");
const { LOAN_DAYS, FINE_PER_DAY } = require("../config/constants");

// Student fields shown in the admin panel
const STUDENT_FIELDS = "name rollNumber batch email";
const BOOK_FIELDS = "title author isbn category coverColor icon";

const populateAll = (query) =>
  query.populate("student", STUDENT_FIELDS).populate("book", BOOK_FIELDS);

const findReservation = async (id, res) => {
  const reservation = await Reservation.findById(id);
  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }
  return reservation;
};

// reserved -> issued (used by the Issue button and by the pickup code)
const issue = async (reservation) => {
  const now = new Date();
  reservation.status = "issued";
  reservation.issuedAt = now;
  reservation.dueDate = new Date(now.getTime() + LOAN_DAYS * DAY);
  await reservation.save();
  await reservation.populate([
    { path: "student", select: STUDENT_FIELDS },
    { path: "book", select: BOOK_FIELDS },
  ]);
  return reservation;
};

// @route  GET /api/admin/stats
// @access Admin
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const [
    totalBooks,
    copies,
    totalStudents,
    reserved,
    issued,
    overdue,
    waiting,
    topBooks,
    byBatch,
    returnedFines,
    issuedOverdue,
    pendingRequests,
    resources,
  ] = await Promise.all([
    Book.countDocuments(),
    Book.aggregate([
      { $group: { _id: null, total: { $sum: "$totalCopies" }, available: { $sum: "$availableCopies" } } },
    ]),
    Student.countDocuments(),
    Reservation.countDocuments({ status: "reserved" }),
    Reservation.countDocuments({ status: "issued" }),
    Reservation.countDocuments({ status: "issued", dueDate: { $lt: now } }),
    Waitlist.countDocuments({ status: "waiting" }),
    // Most borrowed books (issued or returned)
    Reservation.aggregate([
      { $match: { status: { $in: ["issued", "returned"] } } },
      { $group: { _id: "$book", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
      { $unwind: "$book" },
      { $project: { _id: 0, title: "$book.title", coverColor: "$book.coverColor", count: 1 } },
    ]),
    // Books borrowed by each batch
    Reservation.aggregate([
      { $match: { status: { $in: ["reserved", "issued", "returned"] } } },
      { $lookup: { from: "students", localField: "student", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $group: { _id: "$student.batch", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, batch: "$_id", count: 1 } },
    ]),
    // Unpaid fines of returned books
    Reservation.aggregate([
      { $match: { status: "returned", fineAmount: { $gt: 0 }, finePaid: false } },
      { $group: { _id: null, total: { $sum: "$fineAmount" } } },
    ]),
    Reservation.find({ status: "issued", dueDate: { $lt: now } }).select("dueDate"),
    BookRequest.countDocuments({ status: "pending" }),
    Resource.countDocuments(),
  ]);

  // Fines still growing on overdue books
  const runningFines = issuedOverdue.reduce((sum, r) => sum + daysLate(r.dueDate) * FINE_PER_DAY, 0);

  res.json({
    totalBooks,
    totalCopies: copies[0] ? copies[0].total : 0,
    availableCopies: copies[0] ? copies[0].available : 0,
    totalStudents,
    reserved,
    issued,
    overdue,
    waiting,
    finesDue: (returnedFines[0] ? returnedFines[0].total : 0) + runningFines,
    topBooks,
    byBatch,
    pendingRequests,
    resources,
  });
});

// @route  GET /api/admin/reservations
// @access Admin
// Query options (all optional):
//   status=reserved | issued | returned | cancelled | expired | overdue | fines
//   search=roll number, student name or book title
//   batch=2
const getAllReservations = asyncHandler(async (req, res) => {
  const { status, search, batch } = req.query;
  const filter = {};

  if (status === "overdue") {
    filter.status = "issued";
    filter.dueDate = { $lt: new Date() };
  } else if (status === "fines") {
    // unpaid fines: returned late and not paid, or overdue right now
    filter.$or = [
      { status: "returned", fineAmount: { $gt: 0 }, finePaid: false },
      { status: "issued", dueDate: { $lt: new Date() } },
    ];
  } else if (status) {
    filter.status = status;
  }

  const studentFilter = {};
  if (batch) studentFilter.batch = Number(batch);

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    const [students, books] = await Promise.all([
      Student.find({ $or: [{ name: regex }, { rollNumber: regex }] }).select("_id"),
      Book.find({ title: regex }).select("_id"),
    ]);
    const searchOr = [
      { student: { $in: students.map((s) => s._id) } },
      { book: { $in: books.map((b) => b._id) } },
      { pickupCode: search.trim().toUpperCase() },
    ];
    // Combine with the "fines" $or (if any) using $and
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  if (batch) {
    const batchStudents = await Student.find(studentFilter).select("_id");
    filter.student = { $in: batchStudents.map((s) => s._id) };
  }

  const reservations = await populateAll(Reservation.find(filter)).sort({ createdAt: -1 });
  res.json({ count: reservations.length, reservations: reservations.map(toClient) });
});

// @route  PUT /api/admin/reservations/:id/issue
// @access Admin  (student came and took the book: reserved -> issued)
const issueReservation = asyncHandler(async (req, res) => {
  const reservation = await findReservation(req.params.id, res);

  if (reservation.status !== "reserved") {
    res.status(400);
    throw new Error(`Only reserved books can be issued (this one is ${reservation.status})`);
  }

  await issue(reservation);
  res.json({ message: "Book issued", reservation: toClient(reservation) });
});

// @route  POST /api/admin/reservations/issue-by-code
// @access Admin   Body: { "code": "K7P2QX" }
const issueByCode = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  if (!code) {
    res.status(400);
    throw new Error("Enter the pickup code");
  }

  const reservation = await Reservation.findOne({ pickupCode: code, status: "reserved" });
  if (!reservation) {
    res.status(404);
    throw new Error("No reserved book with this code. It may be wrong, already issued or expired.");
  }

  await issue(reservation);
  res.json({
    message: `Issued "${reservation.book.title}" to ${reservation.student.name}`,
    reservation: toClient(reservation),
  });
});

// @route  PUT /api/admin/reservations/:id/return
// @access Admin  (student gave the book back: issued -> returned)
const returnReservation = asyncHandler(async (req, res) => {
  const reservation = await findReservation(req.params.id, res);

  if (reservation.status !== "issued") {
    res.status(400);
    throw new Error(`Only issued books can be returned (this one is ${reservation.status})`);
  }

  const now = new Date();
  reservation.status = "returned";
  reservation.returnedAt = now;
  reservation.fineAmount = daysLate(reservation.dueDate, now) * FINE_PER_DAY;
  reservation.finePaid = reservation.fineAmount === 0;
  await reservation.save();

  // Copy goes back to the shelf, or to the next student in the waitlist
  await releaseCopy(reservation.book);

  if (reservation.fineAmount > 0) {
    await notifyStudent(
      reservation.student,
      "info",
      "Late fine",
      `You returned a book late. Please pay the fine of Rs ${reservation.fineAmount} at the library.`
    );
  }

  await reservation.populate([
    { path: "student", select: STUDENT_FIELDS },
    { path: "book", select: BOOK_FIELDS },
  ]);

  res.json({
    message: reservation.fineAmount > 0 ? `Book returned. Fine: Rs ${reservation.fineAmount}` : "Book returned",
    reservation: toClient(reservation),
  });
});

// @route  PUT /api/admin/reservations/:id/cancel
// @access Admin  (reserved -> cancelled)
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await findReservation(req.params.id, res);

  if (reservation.status !== "reserved") {
    res.status(400);
    throw new Error(`Only reserved books can be cancelled (this one is ${reservation.status})`);
  }

  reservation.status = "cancelled";
  reservation.cancelledAt = new Date();
  await reservation.save();
  await releaseCopy(reservation.book);

  await notifyStudent(reservation.student, "info", "Reservation cancelled", "The library cancelled one of your reservations.");

  await reservation.populate([
    { path: "student", select: STUDENT_FIELDS },
    { path: "book", select: BOOK_FIELDS },
  ]);
  res.json({ message: "Reservation cancelled", reservation: toClient(reservation) });
});

// @route  PUT /api/admin/reservations/:id/fine-paid
// @access Admin  (student paid the late fine)
const markFinePaid = asyncHandler(async (req, res) => {
  const reservation = await findReservation(req.params.id, res);

  if (reservation.status !== "returned" || reservation.fineAmount <= 0) {
    res.status(400);
    throw new Error("There is no fine to pay on this reservation (return the book first)");
  }

  reservation.finePaid = true;
  await reservation.save();
  await reservation.populate([
    { path: "student", select: STUDENT_FIELDS },
    { path: "book", select: BOOK_FIELDS },
  ]);
  res.json({ message: "Fine marked as paid", reservation: toClient(reservation) });
});

// @route  GET /api/admin/books/:id/reservations
// @access Admin  (who has this book right now + waitlist + history)
const getBookReservations = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  const [reservations, waitlist] = await Promise.all([
    Reservation.find({ book: book._id }).populate("student", STUDENT_FIELDS).sort({ createdAt: -1 }),
    Waitlist.find({ book: book._id, status: "waiting" }).populate("student", STUDENT_FIELDS).sort({ createdAt: 1 }),
  ]);

  const list = reservations.map(toClient);
  res.json({
    book,
    current: list.filter((r) => ACTIVE.includes(r.status)),
    waitlist,
    history: list.filter((r) => !ACTIVE.includes(r.status)),
  });
});

// @route  GET /api/admin/students
// @access Admin   Optional: ?search=name or roll  &batch=2
const getStudents = asyncHandler(async (req, res) => {
  const { search, batch } = req.query;
  const filter = {};

  if (batch) filter.batch = Number(batch);
  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: regex }, { rollNumber: regex }];
  }

  const students = await Student.find(filter).select("-password").sort({ resetRequestedAt: -1, rollNumber: 1 });

  // Count active books and total borrowed for each student
  const counts = await Reservation.aggregate([
    {
      $group: {
        _id: "$student",
        active: { $sum: { $cond: [{ $in: ["$status", ACTIVE] }, 1, 0] } },
        borrowed: { $sum: { $cond: [{ $in: ["$status", ["issued", "returned"]] }, 1, 0] } },
      },
    },
  ]);
  const countMap = {};
  counts.forEach((c) => {
    countMap[c._id.toString()] = c;
  });

  res.json({
    count: students.length,
    students: students.map((s) => {
      const c = countMap[s._id.toString()] || {};
      return { ...s.toObject(), activeBooks: c.active || 0, totalBorrowed: c.borrowed || 0 };
    }),
  });
});

// @route  GET /api/admin/students/:id
// @access Admin  (one student + all their reservations)
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).select("-password");
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  const reservations = await Reservation.find({ student: student._id })
    .populate("book", BOOK_FIELDS)
    .sort({ createdAt: -1 });

  const list = reservations.map(toClient);
  res.json({
    student,
    totalFineDue: list.reduce((sum, r) => sum + r.fineDue, 0),
    reservations: list,
  });
});

// @route  PUT /api/admin/students/:id/reset-password
// @access Admin
// Gives the student a new temporary password, shown once to the admin
const resetStudentPassword = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  // Easy to read out at the counter: e.g. "lib-4821"
  const tempPassword = `lib-${crypto.randomInt(1000, 10000)}`;
  student.password = tempPassword; // hashed again by the model
  student.resetRequestedAt = null;
  await student.save();

  await notifyStudent(
    student._id,
    "info",
    "Your password was reset",
    "The librarian gave you a new password. Change it in Profile > Change password.",
    "/profile"
  );

  res.json({ message: "Password reset", tempPassword });
});

module.exports = {
  getStats,
  getAllReservations,
  issueReservation,
  issueByCode,
  returnReservation,
  cancelReservation,
  markFinePaid,
  getBookReservations,
  getStudents,
  getStudentById,
  resetStudentPassword,
};
