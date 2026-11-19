// Borrowing limits: how many books a student can hold at the same time.
// The admin can set a different limit for each batch from the app.
const Setting = require("../models/Setting");
const { MAX_ACTIVE_RESERVATIONS } = require("../config/constants");

// Gets the settings document (creates it the first time)
const getSettings = async () => {
  let settings = await Setting.findOne({ name: "library" });
  if (!settings) settings = await Setting.create({ name: "library", defaultLimit: MAX_ACTIVE_RESERVATIONS });
  return settings;
};

// Limit for one batch number
const getLimitForBatch = async (batch) => {
  const settings = await getSettings();
  const rule = settings.batchLimits.find((b) => b.batch === Number(batch));
  return rule ? rule.limit : settings.defaultLimit;
};

module.exports = { getSettings, getLimitForBatch };
