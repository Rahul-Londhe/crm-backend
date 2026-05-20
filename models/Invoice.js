const mongoose = require("mongoose");

// ================= PAYMENT SCHEMA =================
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Payment amount required"],
    min: 1
  },
  method: {
    type: String,
    enum: ["Cash", "Online", "UPI", "Card"],
    default: "Cash"
  },
  transactionId: {
    type: String,
    default: ""
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// ================= INVOICE SCHEMA =================
const invoiceSchema = new mongoose.Schema({

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true
  },

  invoiceNumber: {
    type: String,
    required: [true, "Invoice number required"],
    trim: true,
    uppercase: true
  },

  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: [true, "Lead required"],
    index: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  amount: {
    type: Number,
    required: [true, "Amount required"],
    min: 1
  },

  paidAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["Pending", "Partial", "Paid"],
    default: "Pending"
  },

  payments: {
    type: [paymentSchema],
    default: []
  },

  dueDate: {
    type: Date,
    default: null
  }

}, { timestamps: true });

// ================= UNIQUE =================
invoiceSchema.index(
  { invoiceNumber: 1, companyId: 1 },
  { unique: true }
);

// ================= AUTO CALC (🔥 FINAL FIX) =================
invoiceSchema.pre("save", function () {

  const totalPaid = (this.payments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  // ❌ Overpayment stop
  if (totalPaid > this.amount) {
    throw new Error("Overpayment not allowed ❌");
  }

  // ✅ Update values
  this.paidAmount = totalPaid;

  if (totalPaid === 0) {
    this.status = "Pending";
  } else if (totalPaid < this.amount) {
    this.status = "Partial";
  } else {
    this.status = "Paid";
  }

});

// ================= SAFE JSON =================
invoiceSchema.methods.toJSON = function () {
  const obj = this.toObject();

  obj.id = obj._id;

  delete obj._id;
  delete obj.__v;

  return obj;
};

module.exports =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);