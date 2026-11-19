// Book requests: students ask the library to buy books it does not have
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");
const BookRequest = require("../models/BookRequest");
const { notifyStudent, notifyAdmin } = require("../services/notify");

// Turns a request into JSON for the app (with vote count and "did I vote")
const toClient = (r, userId) => {
  const obj = r.toObject();
  obj.voteCount = r.votes.length;
  obj.myVote = userId ? r.votes.some((v) => String(v._id || v) === String(userId)) : false;
  delete obj.votes;
  return obj;
};

// @route  GET /api/requests
// @access Logged in
// Students see all requests (so they can +1 them). Optional ?status=pending
const getRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const requests = await BookRequest.find(filter).populate("requestedBy", "name rollNumber batch");
  const userId = req.role === "student" ? req.user._id : null;
  const list = requests
    .map((r) => toClient(r, userId))
    .sort((a, b) => b.voteCount - a.voteCount || new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ count: list.length, requests: list });
});

// @route  POST /api/requests
// @access Student
// Body: { "title": "...", "author": "...", "reason": "..." }
// If the same book was already requested, the student's vote is added to it.
const createRequest = asyncHandler(async (req, res) => {
  const { title, author, reason } = req.body;
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error("Book title is required");
  }

  const existing = await BookRequest.findOne({
    title: new RegExp(`^${escapeRegex(title.trim())}$`, "i"),
    status: { $in: ["pending", "approved"] },
  });

  if (existing) {
    if (!existing.votes.some((v) => String(v) === String(req.user._id))) {
      existing.votes.push(req.user._id);
      await existing.save();
    }
    return res.json({ message: "This book was already requested, so your vote was added", request: toClient(existing, req.user._id) });
  }

  const request = await BookRequest.create({
    title: title.trim(),
    author: (author || "").trim(),
    reason: (reason || "").trim(),
    requestedBy: req.user._id,
    votes: [req.user._id],
  });

  await notifyAdmin(
    "request",
    "New book request",
    `${req.user.name} (${req.user.rollNumber}) asked for "${request.title}".`,
    "/admin/requests"
  );

  res.status(201).json({ message: "Request sent to the library", request: toClient(request, req.user._id) });
});

// @route  PUT /api/requests/:id/vote
// @access Student (adds or removes the student's +1)
const toggleVote = asyncHandler(async (req, res) => {
  const request = await BookRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }

  const index = request.votes.findIndex((v) => String(v) === String(req.user._id));
  if (index >= 0) request.votes.splice(index, 1);
  else request.votes.push(req.user._id);
  await request.save();

  res.json({ message: index >= 0 ? "Vote removed" : "Vote added", request: toClient(request, req.user._id) });
});

// @route  PUT /api/requests/:id/status
// @access Admin
// Body: { "status": "approved" | "added" | "rejected" | "pending", "adminNote": "..." }
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  if (!["pending", "approved", "added", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Status must be pending, approved, added or rejected");
  }

  const request = await BookRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }

  request.status = status;
  if (adminNote !== undefined) request.adminNote = String(adminNote).trim();
  await request.save();

  // Tell every student who wanted this book
  const texts = {
    approved: `Good news! The library will buy "${request.title}".`,
    added: `"${request.title}" is now in the library. You can reserve it.`,
    rejected: `The library will not buy "${request.title}" right now.`,
  };
  if (texts[status]) {
    const note = request.adminNote ? ` Note: ${request.adminNote}` : "";
    for (const studentId of request.votes) {
      await notifyStudent(studentId, "request", "Book request update", texts[status] + note, "/requests");
    }
  }

  res.json({ message: `Request marked as ${status}`, request: toClient(request) });
});

// @route  DELETE /api/requests/:id
// @access Admin
const deleteRequest = asyncHandler(async (req, res) => {
  await BookRequest.findByIdAndDelete(req.params.id);
  res.json({ message: "Request deleted" });
});

module.exports = { getRequests, createRequest, toggleVote, updateRequestStatus, deleteRequest };
