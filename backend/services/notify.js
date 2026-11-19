// Helpers to create notifications (the bell icon) and send email reminders
const Notification = require("../models/Notification");
const Student = require("../models/Student");
const { sendEmail } = require("./email");

// These alert types are also sent by email (if the student added an email)
const EMAIL_TYPES = ["due_soon", "overdue", "waitlist", "expired", "request", "announcement"];

// Alert for one student
const notifyStudent = async (studentId, type, title, message, link = "/reservations") => {
  const notification = await Notification.create({ forRole: "student", student: studentId, type, title, message, link });

  if (EMAIL_TYPES.includes(type)) {
    const student = await Student.findById(studentId).select("name email");
    if (student && student.email) await sendEmail(student.email, student.name, title, message);
  }
  return notification;
};

// Alert for the admin panel
const notifyAdmin = (type, title, message, link = "/admin/reservations") =>
  Notification.create({ forRole: "admin", type, title, message, link });

module.exports = { notifyStudent, notifyAdmin };
