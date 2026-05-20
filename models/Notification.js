const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
{
  user: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["task", "lead", "invoice", "followup"],
    default: "task"
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  read: {
    type: Boolean,
    default: false
  }

},
{
  timestamps: true
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);