const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!to || !message) {
      throw new Error("Phone or message missing");
    }

    // ✅ FORMAT FIX (+91)
    let phone = to.toString().replace(/\D/g, "");

    if (phone.length === 10) {
      phone = "91" + phone;
    }

    const res = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // e.g. whatsapp:+14155238886
      to: `whatsapp:+${phone}`,                 // ✅ FIX
      body: message,
    });

    console.log("✅ WhatsApp Sent:", res.sid);

    return { success: true, sid: res.sid };

  } catch (error) {
    console.error("❌ WhatsApp Error:", error.message);

    return { success: false, message: error.message };
  }
};

module.exports = { sendWhatsAppMessage };