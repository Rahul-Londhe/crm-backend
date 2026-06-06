const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
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

  logo: {
    type: String,
    default: ""
  },

  businessType: {
    type: String,
    default: ""
  },

  plan: {
    type: String,
    enum: ["Free", "Pro", "Enterprise"],
    default: "Free"
  },

  leadLimit: {
    type: Number,
    default: 100
  },

  userLimit: {
    type: Number,
    default: 5
  },

  isActive: {
    type: Boolean,
    default: true
  }
},
{
  timestamps: true
}
);

companySchema.methods.toJSON = function () {

  const obj = this.toObject();

  delete obj.__v;

  return obj;
};

module.exports =
mongoose.models.Company ||
mongoose.model("Company", companySchema);