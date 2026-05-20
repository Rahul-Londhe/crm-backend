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
    match: [/^\S+@\S+\.\S+$/, "Please use valid email"]
  },

  phone: { 
    type: String,
    required: true,
    trim: true,
    minlength: 10
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


// ================= 🔥 FIXED PRE SAVE =================
leadSchema.pre("save", async function () {
  
  // ===== AI SCORE =====
  let score = 0;

  if (this.priority === "High") score += 40;
  if (this.status === "Interested") score += 30;
  if (this.value > 10000) score += 20;
  if (this.source === "Website") score += 10;

  this.score = Math.min(score, 100);

  // ===== DUPLICATE CHECK =====
  if (this.isModified("phone")) {
    const existing = await mongoose.models.Lead.findOne({
      phone: this.phone,
      companyId: this.companyId,
      _id: { $ne: this._id }
    });

    if (existing) {
      throw new Error("DUPLICATE_PHONE"); // ❗ IMPORTANT
    }
  }
});


// ✅ UPDATE FIX
leadSchema.pre(
  "findOneAndUpdate",
  async function () {

    const update =
      this.getUpdate();

    // ================= STATUS =================

    if (update.status) {

      update.lastContacted =
        new Date();

    }

    // ================= DUPLICATE CHECK =================

    if (update.phone) {

      const current =
        await this.model.findOne(
          this.getQuery()
        );

      const existing =
        await mongoose.models.Lead.findOne({

          phone: update.phone,

          companyId:
            current.companyId,

          _id: {
            $ne: current._id
          }

        });

      if (existing) {

        throw new Error(
          "DUPLICATE_PHONE"
        );

      }

    }

    // ================= AI SCORE =================

    let score = 0;

    const priority =
      update.priority ||
      "Medium";

    const status =
      update.status ||
      "New";

    const value =
      Number(update.value || 0);

    const source =
      update.source ||
      "Manual";

    if (priority === "High") {
      score += 40;
    }

    if (status === "Interested") {
  score += 30;
}

// ================= TEMPERATURE =================

if (status === "Interested") {
  update.temperature = "Hot";
}
else if (status === "Contacted") {
  update.temperature = "Warm";
}
else {
  update.temperature = "Cold";
}

    if (value > 10000) {
      score += 20;
    }

    if (source === "Website") {
      score += 10;
    }

    update.score =
      Math.min(score, 100);

    this.setUpdate(update);

});


// ✅ SAFE JSON
leadSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Lead", leadSchema);