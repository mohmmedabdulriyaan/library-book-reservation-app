// The bell icon: list alerts, mark them as read
const asyncHandler = require("../utils/asyncHandler");
const Notification = require("../models/Notification");

// Students see their own alerts, admins see admin alerts
const ownFilter = (req) => (req.role === "admin" ? { forRole: "admin" } : { forRole: "student", student: req.user._id });

// @route  GET /api/notifications
// @access Logged in
const getNotifications = asyncHandler(async (req, res) => {
  const filter = ownFilter(req);
  const [notifications, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ ...filter, read: false }),
  ]);
  res.json({ unread, notifications });
});

// @route  GET /api/notifications/unread-count
// @access Logged in (used by the bell every minute)
const getUnreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ ...ownFilter(req), read: false });
  res.json({ unread });
});

// @route  PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, ...ownFilter(req) }, { read: true }, { new: true });
  if (!n) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ notification: n });
});

// @route  PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ ...ownFilter(req), read: false }, { read: true });
  res.json({ message: "All marked as read" });
});

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
