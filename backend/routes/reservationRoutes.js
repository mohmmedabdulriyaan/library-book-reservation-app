const express = require("express");
const {
  reserveBook,
  getMyReservations,
  cancelMyReservation,
  renewReservation,
  getMyStats,
} = require("../controllers/reservationController");
const { protect, studentOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route here needs a logged-in student
router.use(protect, studentOnly);

router.post("/", reserveBook);
router.get("/my", getMyReservations);
router.get("/stats", getMyStats);
router.put("/:id/cancel", cancelMyReservation);
router.put("/:id/renew", renewReservation);

module.exports = router;
