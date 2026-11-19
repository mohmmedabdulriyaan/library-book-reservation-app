// Shared library logic used by several controllers:
// pickup codes, fines, giving freed copies to the waitlist, and the
// background job that expires uncollected books and sends due-date alerts.
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");
const Waitlist = require("../models/Waitlist");
const { notifyStudent, notifyAdmin } = require("./notify");
const { getLimitForBatch } = require("./limits");
const {
  PICKUP_DAYS,
  FINE_PER_DAY,
  DUE_SOON_DAYS,
} = require("../config/constants");

const DAY = 24 * 60 * 60 * 1000;
const ACTIVE = ["reserved", "issued"];

// ---------- Pickup code ----------

// 6 characters without look-alike letters (no 0/O, 1/I)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const makePickupCode = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    const used = await Reservation.exists({ pickupCode: code, status: "reserved" });
    if (!used) return code;
  }
  throw new Error("Could not create a pickup code, please try again");
};

// ---------- Fines ----------

// Number of full or part days between the due date and "at"
const daysLate = (dueDate, at = new Date()) => {
  if (!dueDate) return 0;
  const diff = new Date(at) - new Date(dueDate);
  return diff > 0 ? Math.ceil(diff / DAY) : 0;
};

// Fine for a reservation right now (in rupees)
const getFine = (r) => {
  if (r.status === "issued") return daysLate(r.dueDate) * FINE_PER_DAY;
  if (r.status === "returned") return r.fineAmount || 0;
  return 0;
};

// Turns a reservation document into the JSON the app needs
const toClient = (r) => {
  const obj = typeof r.toObject === "function" ? r.toObject() : { ...r };
  obj.isOverdue = r.status === "issued" && !!r.dueDate && r.dueDate < new Date();
  obj.fine = getFine(r);
  obj.fineDue = obj.fine > 0 && !r.finePaid ? obj.fine : 0;
  return obj;
};

// ---------- Creating a reservation ----------

// Call this only AFTER one copy has been taken from book.availableCopies
const createReservation = async (studentId, bookId, fromWaitlist = false) => {
  const now = new Date();
  return Reservation.create({
    student: studentId,
    book: bookId,
    reservedAt: now,
    pickupBy: new Date(now.getTime() + PICKUP_DAYS * DAY),
    pickupCode: await makePickupCode(),
    fromWaitlist,
  });
};

// Takes one copy only if a copy is left (safe when two people click at once)
const takeCopy = (bookId) =>
  Book.findOneAndUpdate({ _id: bookId, availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1 } }, { new: true });

// ---------- Waitlist ----------

// Gives available copies of a book to students in the waitlist (first come, first served)
const fillFromWaitlist = async (bookId) => {
  const queue = await Waitlist.find({ book: bookId, status: "waiting" })
    .sort({ createdAt: 1 })
    .populate("student", "batch");

  for (const entry of queue) {
    if (!entry.student) continue; // student account was deleted
    const studentId = entry.student._id;
    // Can this student take one more book?
    const [activeCount, alreadyHas] = await Promise.all([
      Reservation.countDocuments({ student: studentId, status: { $in: ACTIVE } }),
      Reservation.exists({ student: studentId, book: bookId, status: { $in: ACTIVE } }),
    ]);
    if (alreadyHas) {
      entry.status = "fulfilled";
      entry.fulfilledAt = new Date();
      await entry.save();
      continue;
    }
    if (activeCount >= (await getLimitForBatch(entry.student.batch))) continue; // skip, keep them in the queue

    const book = await takeCopy(bookId);
    if (!book) return; // no copies left

    try {
      await createReservation(studentId, bookId, true);
    } catch (error) {
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      throw error;
    }

    entry.status = "fulfilled";
    entry.fulfilledAt = new Date();
    await entry.save();

    await notifyStudent(
      studentId,
      "waitlist",
      "Your waitlisted book is ready",
      `"${book.title}" was reserved for you. Collect it within ${PICKUP_DAYS} days.`
    );
  }
};

// Puts one copy back on the shelf, then offers it to the waitlist
const releaseCopy = async (bookId) => {
  await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
  await fillFromWaitlist(bookId);
};

// ---------- Background job ----------

let running = false;

const runMaintenance = async () => {
  if (running) return;
  running = true;
  try {
    const now = new Date();

    // 1. Old reservations made before pickup codes existed get a code
    const noCode = await Reservation.find({ status: "reserved", pickupCode: { $in: [null, ""] } });
    for (const r of noCode) {
      r.pickupCode = await makePickupCode();
      if (!r.pickupBy) r.pickupBy = new Date(r.reservedAt.getTime() + PICKUP_DAYS * DAY);
      await r.save();
    }

    // 2. Reserved books not collected in time -> expired
    const toExpire = await Reservation.find({ status: "reserved", pickupBy: { $lt: now } }).populate("book", "title");
    for (const r of toExpire) {
      r.status = "expired";
      r.expiredAt = now;
      await r.save();
      await notifyStudent(
        r.student,
        "expired",
        "Reservation expired",
        `You did not collect "${r.book ? r.book.title : "your book"}" in ${PICKUP_DAYS} days, so it was released.`
      );
      if (r.book) await releaseCopy(r.book._id);
    }

    // 3. Due soon alerts
    const dueSoon = await Reservation.find({
      status: "issued",
      dueSoonNotified: false,
      dueDate: { $gte: now, $lte: new Date(now.getTime() + DUE_SOON_DAYS * DAY) },
    }).populate("book", "title");
    for (const r of dueSoon) {
      await notifyStudent(
        r.student,
        "due_soon",
        "Book due soon",
        `Please return "${r.book ? r.book.title : "your book"}" by ${r.dueDate.toDateString()}.`
      );
      r.dueSoonNotified = true;
      await r.save();
    }

    // 4. Overdue alerts (student + admin)
    const overdue = await Reservation.find({ status: "issued", overdueNotified: false, dueDate: { $lt: now } })
      .populate("book", "title")
      .populate("student", "name rollNumber");
    for (const r of overdue) {
      if (!r.student) continue;
      const title = r.book ? r.book.title : "your book";
      await notifyStudent(
        r.student._id,
        "overdue",
        "Book overdue",
        `"${title}" is overdue. A fine of Rs ${FINE_PER_DAY} per day is added until you return it.`
      );
      await notifyAdmin(
        "overdue",
        "Overdue book",
        `${r.student.name} (${r.student.rollNumber}) has not returned "${title}".`,
        "/admin/reservations?status=overdue"
      );
      r.overdueNotified = true;
      await r.save();
    }
  } catch (error) {
    console.error("Maintenance job failed:", error.message);
  } finally {
    running = false;
  }
};

// Runs the job now and then every 10 minutes
const startMaintenance = () => {
  setTimeout(runMaintenance, 3000);
  setInterval(runMaintenance, 10 * 60 * 1000);
};

module.exports = {
  DAY,
  ACTIVE,
  daysLate,
  getFine,
  toClient,
  takeCopy,
  createReservation,
  releaseCopy,
  fillFromWaitlist,
  runMaintenance,
  startMaintenance,
};
