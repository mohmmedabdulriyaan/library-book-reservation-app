const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Students and admins both use these
router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllRead); // must be above "/:id/read"
router.put("/:id/read", markRead);

module.exports = router;
