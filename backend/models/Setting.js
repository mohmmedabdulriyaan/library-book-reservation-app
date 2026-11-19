// Setting model: library rules the admin can change from the app.
// There is only ONE document in this collection (name: "library").
const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    name: { type: String, default: "library", unique: true },
    // How many books a student can hold at once (reserved + issued)
    defaultLimit: { type: Number, default: 3, min: 1 },
    // Different limit for some batches, e.g. [{ batch: 4, limit: 5 }]
    batchLimits: [
      {
        _id: false,
        batch: { type: Number, required: true, min: 1 },
        limit: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
