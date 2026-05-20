const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Invoice = require("../models/Invoice");
const Lead = require("../models/Lead");
const auth = require("../middleware/auth");
const generatePDF = require("../utils/generateInvoice");

// ================= GET ALL =================
router.get("/", auth, async (req, res) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    const invoices = await Invoice.find({ companyId })
      .populate("lead", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, invoices });

  } catch (err) {
    console.error("GET INVOICE ERROR:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ================= CREATE =================
router.post("/", auth, async (req, res) => {
  try {
    const { invoiceNumber, lead, amount, dueDate } = req.body;

    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    if (!req.user?.companyId) {
      return res.status(401).json({ message: "Company not found in token" });
    }

    if (!invoiceNumber || !lead || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(lead)) {
      return res.status(400).json({ message: "Invalid Lead ID" });
    }

    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    const leadData = await Lead.findOne({
      _id: lead,
      companyId
    });

    if (!leadData) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      lead,
      amount: Number(amount),
      dueDate: dueDate || null,
      user: req.user.id || req.user._id,
      companyId
    });

    res.json({ success: true, invoice });

  } catch (err) {
    console.error("INVOICE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ================= PAYMENT =================
router.post("/:id/payment", auth, async (req, res) => {
  try {
    const { amount, method } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount"
      });
    }

    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      companyId
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    invoice.payments.push({
      amount: Number(amount),
      method: method || "Cash"
    });

    await invoice.save();

    res.json({ success: true, invoice });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= PDF =================
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      companyId
    }).populate(
  "lead",
  "name email phone company"
);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    generatePDF(invoice, res);

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({
      success: false,
      message: "PDF Error"
    });
  }
});

module.exports = router;