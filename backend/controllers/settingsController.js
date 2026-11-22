// Library settings the admin can change: borrowing limit for each batch
const asyncHandler = require("../utils/asyncHandler");
const { getSettings } = require("../services/limits");
const { isEmailOn } = require("../services/email");

// @route  GET /api/admin/settings
// @access Admin
const getLibrarySettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({
    defaultLimit: settings.defaultLimit,
    batchLimits: [...settings.batchLimits].sort((a, b) => a.batch - b.batch),
    emailEnabled: isEmailOn(), // true when BREVO_API_KEY and EMAIL_FROM are set
  });
});

// @route  PUT /api/admin/settings
// @access Admin
// Body: { "defaultLimit": 3, "batchLimits": [ { "batch": 4, "limit": 5 } ] }
const updateLibrarySettings = asyncHandler(async (req, res) => {
  const { defaultLimit, batchLimits } = req.body;
  const settings = await getSettings();

  if (defaultLimit !== undefined) {
    const value = Number(defaultLimit);
    if (!Number.isInteger(value) || value < 1 || value > 20) {
      res.status(400);
      throw new Error("Default limit must be a whole number from 1 to 20");
    }
    settings.defaultLimit = value;
  }

  if (batchLimits !== undefined) {
    if (!Array.isArray(batchLimits)) {
      res.status(400);
      throw new Error("batchLimits must be a list");
    }
    const seen = new Set();
    const clean = [];
    for (const item of batchLimits) {
      const batch = Number(item.batch);
      const limit = Number(item.limit);
      if (!Number.isInteger(batch) || batch < 1) {
        res.status(400);
        throw new Error("Each batch must be a whole number (1 or more)");
      }
      if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
        res.status(400);
        throw new Error(`Limit for batch ${batch} must be from 1 to 20`);
      }
      if (seen.has(batch)) {
        res.status(400);
        throw new Error(`Batch ${batch} is listed twice`);
      }
      seen.add(batch);
      clean.push({ batch, limit });
    }
    settings.batchLimits = clean;
  }

  await settings.save();
  res.json({
    message: "Borrowing limits saved",
    defaultLimit: settings.defaultLimit,
    batchLimits: [...settings.batchLimits].sort((a, b) => a.batch - b.batch),
  });
});

module.exports = { getLibrarySettings, updateLibrarySettings };
