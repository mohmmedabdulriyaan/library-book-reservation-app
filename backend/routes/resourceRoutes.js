const express = require("express");
const {
  getResources,
  openResourceFile,
  createResource,
  deleteResource,
} = require("../controllers/resourceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { uploadPdf } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", protect, getResources);
router.get("/:id/file", openResourceFile); // opens the PDF (in a new tab)
router.post("/", protect, adminOnly, uploadPdf.single("file"), createResource);
router.delete("/:id", protect, adminOnly, deleteResource);

module.exports = router;
