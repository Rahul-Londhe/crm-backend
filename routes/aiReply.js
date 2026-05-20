const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");

// WhatsApp Auto Reply Route
router.post("/send-reply/:id", async (req, res) => {
  const { message } = req.body;

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    if (!lead.phone) return res.status(400).json({ message: "Lead has no phone" });

    let phone = lead.phone.replace(/\D/g, "");
    if (!phone.startsWith("91")) phone = "91" + phone;

    const waURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    res.json({ url: waURL, message: "WhatsApp reply ready" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;