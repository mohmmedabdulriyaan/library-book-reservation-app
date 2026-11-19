// Creates a JWT that the app sends back with every request
const jwt = require("jsonwebtoken");

// role is "student" or "admin"
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = generateToken;
