const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: String,

  role: {
    type: String,
    default: "Employee"
  },

  department: {
    type: String,
    default: "Sales"
  },

  salary: {
    type: Number,
    default: 0
  },

  joiningDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  }

}, { timestamps: true });

module.exports =
mongoose.model("Employee", employeeSchema);