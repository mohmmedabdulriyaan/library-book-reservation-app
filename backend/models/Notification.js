// Notification model: the alerts shown under the bell icon
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // "student" alerts belong to one student; "admin" alerts are for all admins
    forRole: {
      type: String,
      enum: ["student", "admin"],
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    // ready, due_soon, overdue, waitlist, expired, new_reservation, info
    type: {
      type: String,
      default: "info",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    link: {
      type: String, // page to open when the alert is tapped, e.g. "/reservations"
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
