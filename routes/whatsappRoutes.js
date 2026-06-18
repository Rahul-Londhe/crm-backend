const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage } = require("../services/whatsappService");

router.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;

    const result =
await sendWhatsAppMessage(
phone,
message
);

if(!result.success){

return res.status(500).json({
success:false,
message:result.message
});

}

res.json({
success:true,
message:"WhatsApp sent"
});
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;