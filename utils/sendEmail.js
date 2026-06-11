const nodemailer = require("nodemailer");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS
}
});

const sendEmail = async (to, subject, message) => {
  try {
    const info = await transporter.sendMail({
      from: "rahul007londhe@gmail.com", // ✅ FIXED
      to,
      subject,
      text: message
    });

    console.log("Email Sent:", info.response);
    return true;

  } catch (error) {
    console.log("Email Error:", error);
    return false;
  }
};

module.exports = sendEmail;
