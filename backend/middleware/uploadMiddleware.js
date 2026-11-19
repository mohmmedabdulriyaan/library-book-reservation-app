// File upload (PDF only) using multer.
// The file is kept in memory and then saved inside MongoDB (see models/Resource.js).
const path = require("path");
const multer = require("multer");

const MAX_MB = 15; // MongoDB documents can be at most 16 MB

const pdfOnly = (req, file, cb) => {
  const isPdf = file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf";
  if (isPdf) cb(null, true);
  else {
    const error = new Error("Only PDF files can be uploaded");
    error.name = "MulterError";
    cb(error);
  }
};

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfOnly,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = { uploadPdf, MAX_MB };
