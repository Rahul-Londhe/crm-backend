const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true,
    index: true
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  name: { 
    type: String, 
    required: true,
    trim: true
  },

  email: {
type: String,
trim: true,
lowercase: true,
default: "",
match: [/^\S+@\S+\.\S+$/, "Please use valid email"]
},

  phone: { 
    type: String,
    required: true,
    trim: true,
    minlength: 10,
maxlength: 15
  },
company: {
  type: String,
  default: ""
},

address: {
  type: String,
  default: ""
},

city: {
  type: String,
  default: ""
},

state: {
  type: String,
  default: ""
},

pincode: {
  type: String,
  default: ""
},

gstNumber: {
  type: String,
  default: ""
},
  status: { 
    type: String, 
    enum: ["New", "Contacted", "Interested", "Closed"],
    default: "New"
  },

  priority: { 
    type: String, 
    enum: ["High", "Medium", "Low"],
    default: "Medium"
  },

  value: { 
    type: Number, 
    default: 0 
  },

  source: { 
    type: String, 
    default: "Manual" 
  },

  nextFollowUp: { 
    type: Date, 
    default: null 
  },

  lastContacted: {
    type: Date,
    default: null
  },

  file: { 
    type: String, 
    default: "" 
  },

  score: {
  type: Number,
  default: 0
},

temperature: {
  type: String,
  enum: ["Hot", "Warm", "Cold"],
  default: "Cold"
}

}, { timestamps: true });


// ================= PRE UPDATE MIDDLEWARE =================


// ✅ SAFE JSON
leadSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Lead", leadSchema);