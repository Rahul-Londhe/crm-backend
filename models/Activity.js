const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true
    },

    user: {
      type: String,
      required: true,
      trim: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Auto Delete After 90 Days
activitySchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90
  }
);

module.exports = mongoose.model(
  "Activity",
  activitySchema
);