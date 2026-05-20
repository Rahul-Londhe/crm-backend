const mongoose =
require("mongoose");

const payrollSchema =
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

  month: {
    type: String,
    required: true
  },

  basicSalary: {
    type: Number,
    default: 0
  },

  bonus: {
    type: Number,
    default: 0
  },

  deduction: {
    type: Number,
    default: 0
  },

  finalSalary: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: [
      "Pending",
      "Paid"
    ],
    default: "Pending"
  }

}, {
  timestamps: true
});

module.exports =
mongoose.model(
  "Payroll",
  payrollSchema
);