// Main entry point of the backend
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { startMaintenance } = require("./services/library");

// Load variables from .env
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Copy .env.example to .env first.");
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors()); // allow the React app to call this API
app.use(express.json({ limit: "2mb" })); // read JSON request bodies (2mb for CSV imports)

// Health check route: GET /api/health
app.get("/api/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    message: "Library API is running",
    database: dbStates[mongoose.connection.readyState] || "unknown",
    time: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/reservations", require("./routes/reservationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/waitlist", require("./routes/waitlistRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/requests", require("./routes/bookRequestRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));

// The React app (after "npm run build" in frontend).
// Then ONE address serves everything: http://localhost:5000 opens the app,
// and the desktop .exe, the phone and the deployed website all use it.
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(path.join(frontendDist, "index.html"))) {
  app.use(express.static(frontendDist));
  // Any page that is not an API route (e.g. /home, /admin/books) gets the React app
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(frontendDist, "index.html")));
  console.log("Serving the frontend from frontend/dist");
}

// Unknown routes and errors (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (fs.existsSync(path.join(frontendDist, "index.html"))) {
    console.log(`Open the app at http://localhost:${PORT}`);
  }
  // Expires uncollected books and sends due-date alerts every 10 minutes
  startMaintenance();
});
