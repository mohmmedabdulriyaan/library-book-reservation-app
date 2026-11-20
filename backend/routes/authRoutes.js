const express = require("express");
const {
  registerStudent,
  loginStudent,
  forgotPassword,
  loginAdmin,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { protect, studentOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);
router.post("/student/forgot-password", forgotPassword);
router.post("/admin/login", loginAdmin);

router.get("/me", protect, getMe);
router.put("/me", protect, studentOnly, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
