const mongoose =
require("mongoose");

const leaveSchema =
new mongoose.Schema({

  companyId: {
    type:
      mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  employee: {
    type:
      mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  reason: {
    type: String,
    required: true
  },

  fromDate: {
    type: String,
    required: true
  },

  toDate: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: [
      "Pending",
      "Approved",
      "Rejected"
    ],
    default: "Pending"
  }

}, {
  timestamps: true
});

module.exports =
mongoose.model(
  "Leave",
  leaveSchema
);