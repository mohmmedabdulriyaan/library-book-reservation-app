const express = require("express");
const { joinWaitlist, getMyWaitlist, leaveWaitlist } = require("../controllers/waitlistController");
const { protect, studentOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, studentOnly);

router.post("/", joinWaitlist);
router.get("/my", getMyWaitlist);
router.delete("/:id", leaveWaitlist);

module.exports = router;
