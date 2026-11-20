const express = require("express");
const {
  registerStudent,
  loginStudent,
  getSecurityQuestion,
  resetPasswordWithAnswer,
  updateSecurityQuestion,
  loginAdmin,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { protect, studentOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);
router.post("/student/forgot-password/question", getSecurityQuestion);
router.post("/student/forgot-password/reset", resetPasswordWithAnswer);
router.post("/admin/login", loginAdmin);

router.get("/me", protect, getMe);
router.put("/me", protect, studentOnly, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/security-question", protect, studentOnly, updateSecurityQuestion);

module.exports = router;
