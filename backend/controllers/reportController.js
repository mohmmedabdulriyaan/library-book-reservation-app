// Monthly library report as a PDF (for the HOD / principal)
// Made with pdfkit: the PDF is drawn line by line and sent to the browser.
const PDFDocument = require("pdfkit");
const asyncHandler = require("../utils/asyncHandler");
const Book = require("../models/Book");
const Student = require("../models/Student");
const Reservation = require("../models/Reservation");
const { daysLate } = require("../services/library");
const { FINE_PER_DAY } = require("../config/constants");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const IST = 5.5 * 60 * 60 * 1000; // India time is UTC + 5:30

// "2026-11" -> start and end of that month in India time
const monthRange = (value) => {
  const now = new Date(Date.now() + IST);
  let [year, month] = String(value || "").split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) {
    year = now.getUTCFullYear();
    month = now.getUTCMonth() + 1;
  }
  const start = new Date(Date.UTC(year, month - 1, 1) - IST);
  const end = new Date(Date.UTC(year, month, 1) - IST);
  return { year, month, start, end, label: `${MONTHS[month - 1]} ${year}` };
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// Collects all the numbers for the report
const buildReport = async (start, end) => {
  const inMonth = (field) => ({ [field]: { $gte: start, $lt: end } });
  const now = new Date();

  const groupIssued = (lookupFrom, field) => [
    { $match: inMonth("issuedAt") },
    { $lookup: { from: lookupFrom, localField: field, foreignField: "_id", as: "x" } },
    { $unwind: "$x" },
  ];

  const [
    reserved, issued, returned, expired, cancelled, newStudents, newBooks,
    returnedDocs, topBooks, byCategory, byBatch, topReaders, overdue, topRated,
    totalBooks, totalStudents, copies,
  ] = await Promise.all([
    Reservation.countDocuments(inMonth("reservedAt")),
    Reservation.countDocuments(inMonth("issuedAt")),
    Reservation.countDocuments(inMonth("returnedAt")),
    Reservation.countDocuments(inMonth("expiredAt")),
    Reservation.countDocuments(inMonth("cancelledAt")),
    Student.countDocuments(inMonth("createdAt")),
    Book.countDocuments(inMonth("createdAt")),
    Reservation.find({ ...inMonth("returnedAt"), fineAmount: { $gt: 0 } }).select("fineAmount finePaid"),
    Reservation.aggregate([
      ...groupIssued("books", "book"),
      { $group: { _id: "$x._id", title: { $first: "$x.title" }, author: { $first: "$x.author" }, count: { $sum: 1 } } },
      { $sort: { count: -1, title: 1 } },
      { $limit: 10 },
    ]),
    Reservation.aggregate([
      ...groupIssued("books", "book"),
      { $group: { _id: "$x.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Reservation.aggregate([
      ...groupIssued("students", "student"),
      { $group: { _id: "$x.batch", count: { $sum: 1 }, students: { $addToSet: "$x._id" } } },
      { $sort: { _id: 1 } },
    ]),
    Reservation.aggregate([
      ...groupIssued("students", "student"),
      { $group: { _id: "$x._id", name: { $first: "$x.name" }, roll: { $first: "$x.rollNumber" }, batch: { $first: "$x.batch" }, count: { $sum: 1 } } },
      { $sort: { count: -1, name: 1 } },
      { $limit: 5 },
    ]),
    Reservation.find({ status: "issued", dueDate: { $lt: now } })
      .populate("student", "name rollNumber batch")
      .populate("book", "title")
      .sort({ dueDate: 1 }),
    Book.find({ ratingCount: { $gt: 0 } }).sort({ ratingAvg: -1, ratingCount: -1 }).limit(5),
    Book.countDocuments(),
    Student.countDocuments(),
    Book.aggregate([{ $group: { _id: null, total: { $sum: "$totalCopies" }, available: { $sum: "$availableCopies" } } }]),
  ]);

  const finesCharged = returnedDocs.reduce((sum, r) => sum + r.fineAmount, 0);
  const finesPaid = returnedDocs.filter((r) => r.finePaid).reduce((sum, r) => sum + r.fineAmount, 0);

  return {
    reserved, issued, returned, expired, cancelled, newStudents, newBooks,
    finesCharged, finesPaid, topBooks, byCategory, byBatch, topReaders, overdue, topRated,
    totalBooks, totalStudents,
    totalCopies: copies[0] ? copies[0].total : 0,
    availableCopies: copies[0] ? copies[0].available : 0,
  };
};

// ---------- Drawing helpers ----------
const COLOR = { primary: "#4f46e5", dark: "#111827", grey: "#6b7280", line: "#e5e7eb", soft: "#f3f4f6" };
const LEFT = 50;
const WIDTH = 495; // A4 width (595) minus margins

const ensureSpace = (doc, needed) => {
  if (doc.y + needed > doc.page.height - 70) doc.addPage();
};

const heading = (doc, text) => {
  ensureSpace(doc, 100); // keep a heading together with the first rows below it
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(COLOR.dark).text(text, LEFT, doc.y);
  doc.moveTo(LEFT, doc.y + 3).lineTo(LEFT + WIDTH, doc.y + 3).lineWidth(1).strokeColor(COLOR.primary).stroke();
  doc.moveDown(0.6);
};

const note = (doc, text) => {
  doc.font("Helvetica-Oblique").fontSize(10).fillColor(COLOR.grey).text(text, LEFT, doc.y);
  doc.moveDown(0.3);
};

// Simple table: columns = [{ label, width, align }], rows = [[...], ...]
const table = (doc, columns, rows) => {
  const drawRow = (cells, { bold = false, fill = null } = {}) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9.5);
    const height =
      Math.max(...cells.map((cell, i) => doc.heightOfString(String(cell), { width: columns[i].width - 10 }))) + 10;
    ensureSpace(doc, height);
    const y = doc.y;
    if (fill) doc.rect(LEFT, y, WIDTH, height).fill(fill);
    let x = LEFT;
    cells.forEach((cell, i) => {
      doc.fillColor(bold ? COLOR.dark : "#1f2937").text(String(cell), x + 5, y + 5, { width: columns[i].width - 10, align: columns[i].align || "left" });
      x += columns[i].width;
    });
    doc.moveTo(LEFT, y + height).lineTo(LEFT + WIDTH, y + height).lineWidth(0.5).strokeColor(COLOR.line).stroke();
    doc.x = LEFT;
    doc.y = y + height;
  };

  drawRow(columns.map((c) => c.label), { bold: true, fill: COLOR.soft });
  rows.forEach((row) => drawRow(row));
  doc.moveDown(0.3);
};

// Grid of number boxes for the summary
const statBoxes = (doc, items) => {
  const perRow = 4;
  const gap = 9;
  const boxWidth = (WIDTH - gap * (perRow - 1)) / perRow;
  const boxHeight = 52;
  for (let i = 0; i < items.length; i += perRow) {
    ensureSpace(doc, boxHeight + gap);
    const y = doc.y;
    items.slice(i, i + perRow).forEach((item, j) => {
      const x = LEFT + j * (boxWidth + gap);
      doc.roundedRect(x, y, boxWidth, boxHeight, 6).fill(COLOR.soft);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(item.color || COLOR.primary).text(String(item.value), x + 10, y + 9, { width: boxWidth - 20 });
      doc.font("Helvetica").fontSize(8.5).fillColor(COLOR.grey).text(item.label, x + 10, y + 32, { width: boxWidth - 20 });
    });
    doc.x = LEFT;
    doc.y = y + boxHeight + gap;
  }
};

// @route  GET /api/admin/report?month=2026-11
// @access Admin
// Sends the PDF file "library-report-2026-11.pdf"
const getMonthlyReport = asyncHandler(async (req, res) => {
  const range = monthRange(req.query.month);
  const data = await buildReport(range.start, range.end);
  const fileName = `library-report-${range.year}-${String(range.month).padStart(2, "0")}.pdf`;

  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true, info: { Title: `Library report - ${range.label}` } });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  doc.pipe(res);

  // Title band
  doc.rect(0, 0, doc.page.width, 92).fill(COLOR.primary);
  doc.font("Helvetica-Bold").fontSize(20).fillColor("#ffffff").text("College Library", LEFT, 26);
  doc.font("Helvetica").fontSize(12).text(`Monthly report - ${range.label}`, LEFT, 52);
  doc.fontSize(9).text(`Generated on ${formatDate(new Date())}`, LEFT, 52, { width: WIDTH, align: "right" });
  doc.y = 115;

  heading(doc, "Summary of the month");
  statBoxes(doc, [
    { value: data.issued, label: "Books issued" },
    { value: data.returned, label: "Books returned" },
    { value: data.reserved, label: "New reservations" },
    { value: data.expired + data.cancelled, label: "Expired / cancelled", color: COLOR.grey },
    { value: data.newStudents, label: "New students joined" },
    { value: data.newBooks, label: "New books added" },
    { value: `Rs ${data.finesCharged}`, label: "Fines charged", color: "#b45309" },
    { value: `Rs ${data.finesPaid}`, label: "Fines paid", color: "#15803d" },
  ]);
  note(
    doc,
    `Library today: ${data.totalBooks} book titles, ${data.availableCopies} of ${data.totalCopies} copies on the shelf, ${data.totalStudents} students.`
  );

  heading(doc, "Most borrowed books");
  if (data.topBooks.length === 0) note(doc, "No books were issued this month.");
  else
    table(
      doc,
      [
        { label: "#", width: 30, align: "center" },
        { label: "Title", width: 245 },
        { label: "Author", width: 160 },
        { label: "Times", width: 60, align: "center" },
      ],
      data.topBooks.map((b, i) => [i + 1, b.title, b.author, b.count])
    );

  heading(doc, "Borrowing by category and batch");
  if (data.byCategory.length === 0) note(doc, "No books were issued this month.");
  else {
    table(
      doc,
      [
        { label: "Category", width: 375 },
        { label: "Books issued", width: 120, align: "center" },
      ],
      data.byCategory.map((c) => [c._id, c.count])
    );
    table(
      doc,
      [
        { label: "Batch", width: 255 },
        { label: "Students who borrowed", width: 120, align: "center" },
        { label: "Books issued", width: 120, align: "center" },
      ],
      data.byBatch.map((b) => [`Batch ${b._id}`, b.students.length, b.count])
    );
  }

  heading(doc, "Top readers");
  if (data.topReaders.length === 0) note(doc, "No books were issued this month.");
  else
    table(
      doc,
      [
        { label: "#", width: 30, align: "center" },
        { label: "Name", width: 200 },
        { label: "Roll number", width: 125 },
        { label: "Batch", width: 70, align: "center" },
        { label: "Books", width: 70, align: "center" },
      ],
      data.topReaders.map((s, i) => [i + 1, s.name, s.roll, s.batch, s.count])
    );

  heading(doc, `Overdue books today (${data.overdue.length})`);
  if (data.overdue.length === 0) note(doc, "No overdue books. Every issued book is within its due date.");
  else
    table(
      doc,
      [
        { label: "Student", width: 135 },
        { label: "Roll / Batch", width: 105 },
        { label: "Book", width: 135 },
        { label: "Due date", width: 70 },
        { label: "Fine", width: 50, align: "right" },
      ],
      data.overdue.map((r) => [
        r.student ? r.student.name : "Deleted student",
        r.student ? `${r.student.rollNumber} / B${r.student.batch}` : "-",
        r.book ? r.book.title : "Deleted book",
        formatDate(r.dueDate),
        `Rs ${daysLate(r.dueDate) * FINE_PER_DAY}`,
      ])
    );

  heading(doc, "Best rated books");
  if (data.topRated.length === 0) note(doc, "No reviews yet.");
  else
    table(
      doc,
      [
        { label: "Title", width: 275 },
        { label: "Author", width: 130 },
        { label: "Stars", width: 45, align: "center" },
        { label: "Reviews", width: 45, align: "center" },
      ],
      data.topRated.map((b) => [b.title, b.author, b.ratingAvg.toFixed(1), b.ratingCount])
    );

  // Page numbers at the bottom of every page
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // allow writing in the margin without making a new page
    doc.font("Helvetica").fontSize(8).fillColor(COLOR.grey);
    doc.text(`College Library - ${range.label}`, LEFT, doc.page.height - 35, { lineBreak: false });
    doc.text(`Page ${i + 1} of ${pages.count}`, LEFT, doc.page.height - 35, { width: WIDTH, align: "right", lineBreak: false });
    doc.page.margins.bottom = bottom;
  }

  doc.end();
});

module.exports = { getMonthlyReport, monthRange, buildReport };
