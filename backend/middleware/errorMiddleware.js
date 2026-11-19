// Unknown route -> 404
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Sends every error back as JSON: { message: "..." }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  let message = err.message || "Something went wrong";

  // Mongoose: required field missing, value too short, etc.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Mongoose: bad id like /api/books/123
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB: unique value already used (roll number, ISBN, username)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    const names = { rollNumber: "Roll number", isbn: "ISBN", username: "Username" };
    message = `${names[field] || field} already exists`;
  }

  // Bad JSON in the request body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  // Multer: file upload problems (file too big, etc.)
  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File is too big (max 15 MB)" : err.message;
  }

  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({ message });
};

module.exports = { notFound, errorHandler };
