const nodemailer = require("nodemailer");

console.log("ENV USER:", process.env.SMTP_USER);
console.log("ENV PASS:", process.env.SMTP_PASS ? "Loaded ✅" : "Missing ❌");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

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

    console.log("✅ Email Sent:", info.response);
    return true;

  } catch (error) {
    console.log("❌ EMAIL ERROR:", error);
    return false;
  }
};

module.exports = sendEmail;