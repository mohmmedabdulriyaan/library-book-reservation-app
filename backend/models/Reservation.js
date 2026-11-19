// Reservation model: links a student to a book
//
// Status flow:
//   reserved  -> student reserved the book in the app (must collect within PICKUP_DAYS)
//   issued    -> admin handed the book to the student
//   returned  -> student gave the book back
//   cancelled -> reservation was cancelled (by student or admin)
//   expired   -> student did not collect the book in time
const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    status: {
      type: String,
      enum: ["reserved", "issued", "returned", "cancelled", "expired"],
      default: "reserved",
    },
    // Short code the student shows at the library counter (e.g. "K7P2QX")
    pickupCode: {
      type: String,
      uppercase: true,
    },
    reservedAt: {
      type: Date,
      default: Date.now,
    },
    pickupBy: Date, // last day to collect the book
    issuedAt: Date,
    dueDate: Date,
    returnedAt: Date,
    cancelledAt: Date,
    expiredAt: Date,
    renewCount: {
      type: Number,
      default: 0,
    },
    // Late fine (saved when the book is returned)
    fineAmount: {
      type: Number,
      default: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    fromWaitlist: {
      type: Boolean,
      default: false,
    },
    // So the same alert is not sent twice
    dueSoonNotified: {
      type: Boolean,
      default: false,
    },
    overdueNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
