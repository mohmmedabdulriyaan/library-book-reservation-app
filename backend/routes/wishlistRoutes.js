const express = require("express");
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");
const { protect, studentOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, studentOnly);

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:bookId", removeFromWishlist);

module.exports = router;
