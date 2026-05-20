const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({

  // ✅ COMPANY NAME
  name: {
    type: String,
    required: true,
    trim: true
  },

  // ✅ OWNER (OPTIONAL INIT, SET LATER)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // ✅ CONTACT INFO
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ""
  },

  phone: {
    type: String,
    trim: true,
    default: ""
  },

  address: {
    type: String,
    default: ""
  },

  // ✅ SaaS PLAN SYSTEM 🔥
  plan: {
    type: String,
    enum: ["Free", "Pro", "Enterprise"],
    default: "Free"
  },

  // ✅ LIMITS (IMPORTANT FOR SaaS)
  leadLimit: {
    type: Number,
    default: 100
  },

  userLimit: {
    type: Number,
    default: 5
  },

  // ✅ ACTIVE / BLOCK
  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });


// ✅ UNIQUE COMPANY NAME (OPTIONAL SAFE)
companySchema.index({ name: 1 }, { unique: false });


// ✅ SAFE RESPONSE
companySchema.methods.toJSON = function () {
  const obj = this.toObject();

  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;

  return obj;
};


// ✅ EXPORT SAFE
module.exports = mongoose.models.Company || mongoose.model("Company", companySchema);