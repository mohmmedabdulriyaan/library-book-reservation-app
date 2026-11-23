const express = require("express");
const {
  getStats,
  getAllReservations,
  issueReservation,
  issueByCode,
  returnReservation,
  cancelReservation,
  markFinePaid,
  getBookReservations,
  getStudents,
  getStudentById,
  resetStudentPassword,
} = require("../controllers/adminController");
const { getLibrarySettings, updateLibrarySettings } = require("../controllers/settingsController");
const { getMonthlyReport } = require("../controllers/reportController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route here needs a logged-in admin
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/report", getMonthlyReport); // monthly PDF report, ?month=2026-11

router.get("/reservations", getAllReservations);
router.post("/reservations/issue-by-code", issueByCode);
router.put("/reservations/:id/issue", issueReservation);
router.put("/reservations/:id/return", returnReservation);
router.put("/reservations/:id/cancel", cancelReservation);
router.put("/reservations/:id/fine-paid", markFinePaid);

router.get("/books/:id/reservations", getBookReservations);

router.get("/students", getStudents);
router.get("/students/:id", getStudentById);
router.put("/students/:id/reset-password", resetStudentPassword);

router.get("/settings", getLibrarySettings);
router.put("/settings", updateLibrarySettings);

module.exports = router;
