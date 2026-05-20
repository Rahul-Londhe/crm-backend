const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },

  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },

  password: { 
    type: String, 
    required: true 
  },

  // 🔐 ADVANCED ROLE SYSTEM
  role: { 
    type: String, 
    enum: [
  "admin",
  "hr",
  "manager",
  "employee"
],
    default: "employee"
  },

  // 🏢 MULTI COMPANY SUPPORT
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null
  },

  // 📱 PROFILE INFO
  phone: {
    type: String,
    default: ""
  },

  avatar: {
    type: String,
    default: ""
  },

  // ✅ ACCOUNT STATUS
  isActive: {
    type: Boolean,
    default: true
  },

  // 🕒 LAST LOGIN
  lastLogin: {
    type: Date,
    default: null
  },
// 🌙 DARK MODE
darkMode: {
  type: Boolean,
  default: false
},

// 🏢 DEPARTMENT
department: {
  type: String,
  default: "General"
},

}, { timestamps: true });


// ✅ PASSWORD HASH (SAFE)
userSchema.pre("save", async function () {

  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});


// ✅ COMPARE PASSWORD (LOGIN SAFE)
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


// ✅ SAFE JSON RESPONSE
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.__v;

  return obj;
};


// ✅ EXPORT SAFE
module.exports = mongoose.models.User || mongoose.model("User", userSchema);