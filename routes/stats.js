const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");

// GET stats
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find({}); // user filtering लागल्यास auth वापरा
    const stats = {
      total: leads.length,
      newLeads: leads.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
      contacted: leads.filter(l => l.status === "Contacted").length,
      closed: leads.filter(l => l.status === "Closed").length
    };
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error("Stats API Error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;