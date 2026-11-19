const express = require("express");
const {
  getRequests,
  createRequest,
  toggleVote,
  updateRequestStatus,
  deleteRequest,
} = require("../controllers/bookRequestController");
const { protect, studentOnly, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getRequests);
router.post("/", protect, studentOnly, createRequest);
router.put("/:id/vote", protect, studentOnly, toggleVote);
router.put("/:id/status", protect, adminOnly, updateRequestStatus);
router.delete("/:id", protect, adminOnly, deleteRequest);

module.exports = router;
