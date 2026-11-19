// Checks the JWT sent in the "Authorization: Bearer <token>" header
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

// Any logged-in user (student or admin)
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not logged in. Please log in first.");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Session expired or invalid. Please log in again.");
  }

  // Find the user in the right collection (never return the password)
  const Model = decoded.role === "admin" ? Admin : Student;
  const user = await Model.findById(decoded.id).select("-password");

  if (!user) {
    res.status(401);
    throw new Error("Account not found. Please log in again.");
  }

  req.user = user;
  req.role = decoded.role;
  next();
});

// Only students can continue
const studentOnly = (req, res, next) => {
  if (req.role !== "student") {
    res.status(403);
    return next(new Error("Only students can do this."));
  }
  next();
};

// Only admins can continue
const adminOnly = (req, res, next) => {
  if (req.role !== "admin") {
    res.status(403);
    return next(new Error("Only admins can do this."));
  }
  next();
};

module.exports = { protect, studentOnly, adminOnly };
