// Seed script: run with "npm run seed"
// 1. Inserts all books
// 2. Creates the default admin (if missing)
// 3. Creates 12 demo students with reservations, issued books, due dates,
//    fines and waitlist entries, so the app has realistic data to show.
// 4. Adds announcements, book requests, wishlists, sample PDFs for the
//    digital library and borrowing limits for each batch.
// Students you created yourself are kept (only their old reservations are cleared).
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Book = require("../models/Book");
const Admin = require("../models/Admin");
const Reservation = require("../models/Reservation");
const Waitlist = require("../models/Waitlist");
const Notification = require("../models/Notification");
const Student = require("../models/Student");
const Wishlist = require("../models/Wishlist");
const Announcement = require("../models/Announcement");
const BookRequest = require("../models/BookRequest");
const Resource = require("../models/Resource");
const Setting = require("../models/Setting");
const extras = require("./extras");
const makePdf = require("./samplePdf");
const books = require("./books");
const { DEMO_PASSWORD, students: demoStudents } = require("./students");
const { LOAN_DAYS, PICKUP_DAYS, RENEW_DAYS, FINE_PER_DAY } = require("../config/constants");

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

// Random 6 character pickup code (same letters the app uses)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const usedCodes = new Set();
const pickupCode = () => {
  let code;
  do {
    code = "";
    for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
};

// Builds one reservation document from a "loan" in students.js
const makeReservation = (studentId, book, loan) => {
  const base = { student: studentId, book: book._id, status: loan.status };

  if (loan.status === "reserved") {
    const reservedAt = daysAgo(loan.daysAgo);
    return { ...base, reservedAt, pickupCode: pickupCode(), pickupBy: new Date(reservedAt.getTime() + PICKUP_DAYS * DAY) };
  }

  const issuedAt = daysAgo(loan.daysAgo);
  const renewCount = loan.renewCount || 0;
  const dueDate = new Date(issuedAt.getTime() + (LOAN_DAYS + renewCount * RENEW_DAYS) * DAY);
  const reservedAt = new Date(issuedAt.getTime() - DAY);
  const doc = { ...base, reservedAt, issuedAt, dueDate, renewCount };

  if (loan.status === "returned") {
    const returnedAt = daysAgo(loan.returnedDaysAgo);
    const late = Math.max(0, Math.ceil((returnedAt - dueDate) / DAY));
    doc.returnedAt = returnedAt;
    doc.fineAmount = late * FINE_PER_DAY;
    doc.finePaid = !!loan.finePaid;
  }
  return doc;
};

dotenv.config();

const DEFAULT_ADMIN = {
  name: "Library Admin",
  username: "admin",
  password: "admin123",
};

const seed = async () => {
  await connectDB();

  // Remove old books (and their reservations, which would point to deleted books)
  await Reservation.deleteMany({});
  await Waitlist.deleteMany({});
  await Wishlist.deleteMany({});
  await Announcement.deleteMany({});
  await BookRequest.deleteMany({});
  await Notification.deleteMany({});
  await Book.deleteMany({});

  // availableCopies starts equal to totalCopies
  const booksToInsert = books.map((b) => ({ ...b, availableCopies: b.totalCopies }));
  await Book.insertMany(booksToInsert);
  console.log(`Inserted ${booksToInsert.length} books`);

  // Create the default admin only if it does not exist yet
  const existingAdmin = await Admin.findOne({ username: DEFAULT_ADMIN.username });
  if (existingAdmin) {
    console.log(`Admin "${DEFAULT_ADMIN.username}" already exists, skipped`);
  } else {
    await Admin.create(DEFAULT_ADMIN); // password is hashed by the model
    console.log(`Created admin -> username: ${DEFAULT_ADMIN.username}  password: ${DEFAULT_ADMIN.password}`);
  }

  // ---------- Demo students ----------
  // Remove old copies of the demo students, then create them again
  await Student.deleteMany({ rollNumber: { $in: demoStudents.map((s) => s.rollNumber) } });
  const created = await Student.create(
    demoStudents.map(({ loans, ...s }) => ({ ...s, password: DEMO_PASSWORD })) // password is hashed by the model
  );
  console.log(`Created ${created.length} demo students (password: ${DEMO_PASSWORD})`);

  // ---------- Their reservations and waitlist ----------
  const bookByTitle = {};
  (await Book.find()).forEach((b) => (bookByTitle[b.title] = b));

  const reservations = [];
  const waitlist = [];
  const takenCopies = {}; // bookId -> copies that are reserved or issued

  demoStudents.forEach((s, i) => {
    const studentId = created[i]._id;
    s.loans.forEach((loan, j) => {
      const book = bookByTitle[loan.book];
      if (!book) return console.log(`  Skipped "${loan.book}" (book not found)`);

      if (loan.status === "waiting") {
        // createdAt decides the queue order, so space them a few minutes apart
        waitlist.push({ student: studentId, book: book._id, status: "waiting", createdAt: new Date(Date.now() - (60 - i - j) * 60000) });
        return;
      }
      if (loan.status === "reserved" || loan.status === "issued") {
        takenCopies[book._id] = (takenCopies[book._id] || 0) + 1;
      }
      const doc = makeReservation(studentId, book, loan);
      doc.createdAt = doc.reservedAt; // so lists show them in the right order
      reservations.push(doc);
    });
  });

  await Reservation.insertMany(reservations);
  await Waitlist.insertMany(waitlist);

  // Books that are reserved or issued have fewer copies on the shelf
  for (const [bookId, taken] of Object.entries(takenCopies)) {
    const book = await Book.findById(bookId);
    book.availableCopies = Math.max(0, book.totalCopies - taken);
    await book.save();
  }
  console.log(`Created ${reservations.length} reservations and ${waitlist.length} waitlist entries`);

  // ---------- Extra features ----------
  const studentByRoll = {};
  (await Student.find()).forEach((s) => (studentByRoll[s.rollNumber] = s));
  const now = Date.now();

  // Announcements (newest first) + an alert for every student
  const posted = [];
  for (let i = 0; i < extras.announcements.length; i++) {
    const a = extras.announcements[i];
    const createdAt = new Date(now - i * 2 * DAY);
    posted.push(await Announcement.create({ ...a, postedBy: DEFAULT_ADMIN.name, createdAt }));
  }
  await Notification.insertMany(
    Object.values(studentByRoll).flatMap((s) =>
      posted.map((a) => ({
        forRole: "student",
        student: s._id,
        type: "announcement",
        title: `Notice: ${a.title}`,
        message: a.message,
        link: "/announcements",
        read: a !== posted[0], // only the newest is unread
        createdAt: a.createdAt,
      }))
    )
  );

  // Book requests with votes
  for (const r of extras.requests) {
    const votes = r.votes.map((roll) => studentByRoll[roll]).filter(Boolean).map((s) => s._id);
    if (votes.length === 0) continue;
    await BookRequest.create({ ...r, votes, requestedBy: votes[0] });
  }

  // Wishlists
  const wish = [];
  for (const [roll, titles] of Object.entries(extras.wishlists)) {
    const student = studentByRoll[roll];
    if (!student) continue;
    titles.forEach((t) => bookByTitle[t] && wish.push({ student: student._id, book: bookByTitle[t]._id }));
  }
  await Wishlist.insertMany(wish);

  // Digital library: sample PDFs (saved inside MongoDB; PDFs the admin uploaded are kept)
  await Resource.deleteMany({ fileName: /^sample-/ });
  for (let i = 0; i < extras.resources.length; i++) {
    const { lines, ...info } = extras.resources[i];
    const pdf = makePdf(info.title, lines);
    await Resource.create({
      ...info,
      data: pdf,
      fileName: `sample-${i + 1}.pdf`,
      originalName: `${info.title}.pdf`,
      size: pdf.length,
      views: 12 - i * 2,
    });
  }

  // Borrowing limits
  await Setting.findOneAndUpdate({ name: "library" }, { name: "library", ...extras.limits }, { upsert: true });

  console.log(
    `Added ${posted.length} announcements, ${extras.requests.length} book requests, ${wish.length} wishlist items, ${extras.resources.length} sample PDFs and batch limits`
  );

  console.log("\nSeeding finished.");
  console.log("Demo student login -> roll number: 2503A51101  password: " + DEMO_PASSWORD);
  await mongoose.connection.close();
};

seed().catch(async (err) => {
  console.error("Seeding failed:", err.message);
  await mongoose.connection.close();
  process.exit(1);
});
