const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const { notifyAdmin } = require("../services/notify");

// Roll number format: 4 digits + 1 letter + 5 digits (e.g. 2503A51133)
const ROLL_REGEX = /^[0-9]{4}[A-Z][0-9]{5}$/;

// What we send back about a student (no password)
const studentData = (s) => ({
  _id: s._id,
  name: s.name,
  rollNumber: s.rollNumber,
  batch: s.batch,
  email: s.email,
  role: "student",
  createdAt: s.createdAt,
});

const adminData = (a) => ({
  _id: a._id,
  name: a.name,
  username: a.username,
  role: "admin",
});

// @route  POST /api/auth/student/register
// @access Public
const registerStudent = asyncHandler(async (req, res) => {
  const { name, rollNumber, batch, email, password } = req.body;

  if (!name || !rollNumber || !batch || !password) {
    res.status(400);
    throw new Error("Name, roll number, batch and password are required");
  }

  const roll = String(rollNumber).trim().toUpperCase();
  if (!ROLL_REGEX.test(roll)) {
    res.status(400);
    throw new Error("Roll number should be 4 digits, 1 letter, then 5 digits");
  }

  const exists = await Student.findOne({ rollNumber: roll });
  if (exists) {
    res.status(400);
    throw new Error("This roll number is already registered. Please log in.");
  }

  const student = await Student.create({
    name,
    rollNumber: roll,
    batch: Number(batch),
    email,
    password, // hashed automatically by the Student model
  });

  res.status(201).json({
    message: "Account created",
    token: generateToken(student._id, "student"),
    user: studentData(student),
  });
});

// @route  POST /api/auth/student/login
// @access Public
const loginStudent = asyncHandler(async (req, res) => {
  const { rollNumber, password } = req.body;

  if (!rollNumber || !password) {
    res.status(400);
    throw new Error("Roll number and password are required");
  }

  const student = await Student.findOne({ rollNumber: String(rollNumber).trim().toUpperCase() });

  if (!student || !(await student.matchPassword(password))) {
    res.status(401);
    throw new Error("Wrong roll number or password");
  }

  // They remembered it after all, so drop any open reset request
  if (student.resetRequestedAt) {
    student.resetRequestedAt = null;
    await student.save();
  }

  res.json({
    message: "Logged in",
    token: generateToken(student._id, "student"),
    user: studentData(student),
  });
});

// @route  POST /api/auth/student/forgot-password
// @access Public
// The student sends roll number + batch. The admin sees the request and gives
// a new temporary password at the library counter (works without email).
const forgotPassword = asyncHandler(async (req, res) => {
  const { rollNumber, batch } = req.body;

  if (!rollNumber || !batch) {
    res.status(400);
    throw new Error("Roll number and batch are required");
  }

  const student = await Student.findOne({ rollNumber: String(rollNumber).trim().toUpperCase() });

  // Same answer either way, so nobody can find out which roll numbers exist
  if (student && student.batch === Number(batch)) {
    const alreadyAsked = Boolean(student.resetRequestedAt);
    student.resetRequestedAt = new Date();
    await student.save();

    if (!alreadyAsked) {
      await notifyAdmin(
        "password_reset",
        "Password reset request",
        `${student.name} (${student.rollNumber}, Batch ${student.batch}) forgot their password.`,
        "/admin/students"
      );
    }
  }

  res.json({
    message: "Request sent. Visit the library counter with your college ID card to get a new password.",
  });
});

// @route  POST /api/auth/admin/login
// @access Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error("Username and password are required");
  }

  const admin = await Admin.findOne({ username: String(username).trim().toLowerCase() });

  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error("Wrong username or password");
  }

  res.json({
    message: "Logged in",
    token: generateToken(admin._id, "admin"),
    user: adminData(admin),
  });
});

// @route  GET /api/auth/me
// @access Logged in (student or admin)
const getMe = asyncHandler(async (req, res) => {
  const user = req.role === "admin" ? adminData(req.user) : studentData(req.user);
  res.json({ user });
});

// @route  PUT /api/auth/me
// @access Student
// Students can change name, batch and email (not roll number)
const updateProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);
  const { name, batch, email } = req.body;

  if (name !== undefined) student.name = name;
  if (batch !== undefined) student.batch = Number(batch);
  if (email !== undefined) student.email = email;

  await student.save();
  res.json({ message: "Profile updated", user: studentData(student) });
});

// @route  PUT /api/auth/change-password
// @access Logged in (student or admin)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  const Model = req.role === "admin" ? Admin : Student;
  const user = await Model.findById(req.user._id);

  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error("Current password is wrong");
  }

  user.password = newPassword; // hashed again by the model
  await user.save();
  res.json({ message: "Password changed" });
});

module.exports = {
  registerStudent,
  loginStudent,
  forgotPassword,
  loginAdmin,
  getMe,
  updateProfile,
  changePassword,
};
