const nodemailer = require("nodemailer");

console.log("SMTP USER:", process.env.SMTP_USER);
console.log(
  "SMTP PASS:",
  process.env.SMTP_PASS ? "Loaded ✅" : "Missing ❌"
);

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }

});

const sendEmail = async (
  to,
  subject,
  message,
  replyTo = null
) => {

  try {

    const mailOptions = {

      from: `"CRM System" <${process.env.SMTP_USER}>`,

      to,

      subject,

      text: message,

      replyTo: replyTo || process.env.SMTP_USER

    };
await transporter.verify();
console.log("SMTP VERIFIED ✅");
    const info =
      await transporter.sendMail(mailOptions);

    console.log(
      "✅ EMAIL SENT:",
      info.messageId
    );

    return true;

  } catch (error) {

    console.log(
      "❌ EMAIL ERROR:",
      error.message
    );

    return false;
  }
};

module.exports = sendEmail;