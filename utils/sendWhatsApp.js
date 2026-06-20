const twilio = require("twilio");

console.log("SID:", process.env.TWILIO_SID);
console.log("FROM:", process.env.TWILIO_WHATSAPP_NUMBER);

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsApp = async (phone, message) => {
  try {

    if (!phone || !message) {
      throw new Error("Phone or message missing");
    }

    let formattedPhone = phone.toString().replace(/\D/g, "");

    if (formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+${formattedPhone}`,
      body: message
    });

    console.log("✅ WhatsApp Sent:", result.sid);

    return {
      success: true,
      sid: result.sid
    };

  } catch (error) {

    console.log("❌ WhatsApp Error:", error.message);

    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = sendWhatsApp;