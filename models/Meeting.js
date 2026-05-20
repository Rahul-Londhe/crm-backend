const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  date: {
    type: String,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  client: {
    type: String,
    default: ""
  },

  notes: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    default: "Pending"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model(
    "Meeting",
    meetingSchema
  );