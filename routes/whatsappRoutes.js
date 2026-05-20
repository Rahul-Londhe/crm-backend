const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage } = require("../services/whatsappService");

router.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;

    await sendWhatsAppMessage(phone, message || "Hello from CRM");

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;