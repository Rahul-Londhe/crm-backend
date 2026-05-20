const express = require("express");
const router = express.Router();

const Lead = require("../models/Lead");
const Invoice = require("../models/Invoice");

// ---------------- LEADS STATS ----------------
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find({});

    const stats = {
      total: leads.length,
      newLeads: leads.filter(
        l => new Date(l.createdAt).toDateString() === new Date().toDateString()
      ).length,
      contacted: leads.filter(l => l.status === "Contacted").length,
      closed: leads.filter(l => l.status === "Closed").length
    };

    res.json({ success: true, ...stats });

  } catch (err) {
    console.error("Stats API Error:", err);
    res.status(500).json({ success: false });
  }
});

// ---------------- REVENUE STATS ----------------
router.get("/revenue", async (req, res) => {
  try {
    const invoices = await Invoice.find();

    let total = 0;
    let paid = 0;
    let pending = 0;

    invoices.forEach(inv => {
      total += inv.amount;

      if (inv.status === "Paid") {
        paid += inv.amount;
      } else {
        pending += inv.amount;
      }
    });

    res.json({ total, paid, pending });

  } catch (err) {
    console.error("Revenue Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;