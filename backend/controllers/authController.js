const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

// Roll number format: 4 digits + 1 letter + 5 digits (e.g. 2503A51133)
const ROLL_REGEX = /^[0-9]{4}[A-Z][0-9]{5}$/;

// What we send back about a student (no password)
const studentData = (s) => ({
  _id: s._id,
  name: s.name,
  rollNumber: s.rollNumber,
  batch: s.batch,
  email: s.email,
  hasSecurityQuestion: Boolean(s.securityQuestion),
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
  const { name, rollNumber, batch, email, password, securityQuestion, securityAnswer } = req.body;

  if (!name || !rollNumber || !batch || !password) {
    res.status(400);
    throw new Error("Name, roll number, batch and password are required");
  }
  if (!securityQuestion || !securityAnswer) {
    res.status(400);
    throw new Error("Please choose a security question and answer (used if you forget your password)");
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
    securityQuestion,
    securityAnswer, // hashed too
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

  res.json({
    message: "Logged in",
    token: generateToken(student._id, "student"),
    user: studentData(student),
  });
});

// @route  POST /api/auth/student/forgot-password/question
// @access Public
// Step 1 of "Forgot password": shows the student's security question
const getSecurityQuestion = asyncHandler(async (req, res) => {
  const roll = String(req.body.rollNumber || "").trim().toUpperCase();
  if (!roll) {
    res.status(400);
    throw new Error("Roll number is required");
  }

  const student = await Student.findOne({ rollNumber: roll });
  if (!student) {
    res.status(404);
    throw new Error("No account found with this roll number");
  }
  if (!student.securityQuestion) {
    res.status(400);
    throw new Error("This account has no security question yet. Ask the librarian to reset your password.");
  }

  res.json({ question: student.securityQuestion });
});

// @route  POST /api/auth/student/forgot-password/reset
// @access Public
// Step 2: correct answer -> new password, and the student is logged in
const resetPasswordWithAnswer = asyncHandler(async (req, res) => {
  const { rollNumber, answer, newPassword } = req.body;
  if (!rollNumber || !answer || !newPassword) {
    res.status(400);
    throw new Error("Roll number, answer and new password are required");
  }
  if (String(newPassword).length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const student = await Student.findOne({ rollNumber: String(rollNumber).trim().toUpperCase() }).select("+securityAnswer");
  if (!student || !student.securityQuestion) {
    res.status(400);
    throw new Error("Cannot reset the password for this account");
  }

  if (student.resetLockedUntil && student.resetLockedUntil > new Date()) {
    res.status(429);
    throw new Error("Too many wrong answers. Try again in 15 minutes.");
  }

  if (!(await student.matchAnswer(answer))) {
    student.resetFailCount += 1;
    if (student.resetFailCount >= 5) {
      student.resetFailCount = 0;
      student.resetLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await student.save();
    res.status(400);
    throw new Error("Wrong answer");
  }

  student.password = newPassword; // hashed by the model
  student.resetFailCount = 0;
  student.resetLockedUntil = null;
  await student.save();

  res.json({
    message: "Password changed",
    token: generateToken(student._id, "student"),
    user: studentData(student),
  });
});

// @route  PUT /api/auth/security-question
// @access Student
// Set or change the security question (needs the current password)
const updateSecurityQuestion = asyncHandler(async (req, res) => {
  const { currentPassword, question, answer } = req.body;
  if (!currentPassword || !question || !answer) {
    res.status(400);
    throw new Error("Current password, question and answer are required");
  }

  const student = await Student.findById(req.user._id);
  if (!(await student.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error("Current password is wrong");
  }

  student.securityQuestion = question;
  student.securityAnswer = answer; // hashed by the model
  await student.save();
  res.json({ message: "Security question saved", user: studentData(student) });
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
  getSecurityQuestion,
  resetPasswordWithAnswer,
  updateSecurityQuestion,
  loginAdmin,
  getMe,
  updateProfile,
  changePassword,
};
