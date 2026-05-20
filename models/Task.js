const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true
  },

  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true,
    minlength: 2
  },

  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    default: null,
    validate: {
      validator: function (v) {
        return !v || mongoose.Types.ObjectId.isValid(v);
      },
      message: "Invalid Lead ID"
    }
  },

  description: {
    type: String,
    default: ""
  },

  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium"
  },

  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending"
  },

  dueDate: {
    type: Date,
    default: null
  },

  // ✅ NEW: Assigned User Name (optional but useful)
  assignedTo: {
    type: String,
    default: ""
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  }

}, { timestamps: true });


// ✅ INDEX (PERFORMANCE)
taskSchema.index({ companyId: 1, user: 1 });




module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);