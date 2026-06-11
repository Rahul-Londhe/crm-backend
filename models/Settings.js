const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  companyName: {
    type: String,
    default: ""
  },

  companyEmail: {
    type: String,
    default: ""
  },

  companyPhone: {
    type: String,
    default: ""
  },

  whatsappNumber: {
    type: String,
    default: ""
  },

  smtpEmail: {
    type: String,
    default: ""
  },

  smtpPassword: {
    type: String,
    default: ""
  },

  logo: {
    type: String,
    default: ""
  },

  whatsappAuto: {
    type: Boolean,
    default: true
  },

  emailAuto: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

module.exports =
mongoose.models.Settings ||
mongoose.model("Settings", settingsSchema);