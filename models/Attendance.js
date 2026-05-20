const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  date: {
    type: String,
    required: true
  },

  checkIn: String,

  checkOut: String,

  status: {
    type: String,
    enum: ["Present", "Absent", "Leave"],
    default: "Present"
  }

}, { timestamps: true });

module.exports =
mongoose.model("Attendance", attendanceSchema);