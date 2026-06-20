const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, message) => {

  try {

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text: message
    });

    console.log("✅ Email Sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (err) {

    console.log("❌ FULL EMAIL ERROR:", err);

    return {
      success: false,
      error: err.message
    };

  }

};

module.exports = sendEmail;