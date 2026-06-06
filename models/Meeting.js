const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true
  },

  client: {
    type: String,
    default: "",
    trim: true
  },

  notes: {
    type: String,
    default: ""
  },

  start: {
    type: Date,
    required: true
  },

  end: {
    type: Date,
    required: true
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{
  timestamps: true
});

module.exports = mongoose.model(
  "Meeting",
  meetingSchema
);