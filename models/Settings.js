const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  whatsappAuto: {
    type: Boolean,
    default: true
  },

  emailAuto: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);