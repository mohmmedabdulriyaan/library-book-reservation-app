// Announcements: notices from the library to every student
const asyncHandler = require("../utils/asyncHandler");
const Announcement = require("../models/Announcement");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/email");

// @route  GET /api/announcements
// @access Logged in (students and admin)
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(50);
  res.json({ count: announcements.length, announcements });
});

// @route  POST /api/announcements
// @access Admin
// Body: { "title": "...", "message": "...", "important": true }
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, important } = req.body;
  if (!title || !title.trim() || !message || !message.trim()) {
    res.status(400);
    throw new Error("Title and message are required");
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    message: message.trim(),
    important: !!important,
    postedBy: req.user.name,
  });

  // Every student gets an alert under the bell icon
  const students = await Student.find().select("_id name email");
  await Notification.insertMany(
    students.map((s) => ({
      forRole: "student",
      student: s._id,
      type: "announcement",
      title: `Notice: ${announcement.title}`,
      message: announcement.message,
      link: "/announcements",
    }))
  );

  // Important notices are also emailed (only works if email is set up in .env)
  if (announcement.important) {
    for (const s of students) {
      if (s.email) await sendEmail(s.email, s.name, announcement.title, announcement.message);
    }
  }

  res.status(201).json({ message: `Announcement sent to ${students.length} students`, announcement });
});

// @route  DELETE /api/announcements/:id
// @access Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }
  res.json({ message: "Announcement deleted" });
});

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
