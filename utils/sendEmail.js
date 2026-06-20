const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },

  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (
  to,
  subject,
  message
) => {

  try {

    const info =
      await transporter.sendMail({

        from: process.env.SMTP_USER,

        to,

        subject,

        text: message

      });

    console.log(
      "✅ Email Sent:",
      info.messageId
    );

    return true;

  }

  catch (err) {

    console.log(
      "EMAIL FULL ERROR:",
      err
    );

    return false;

  }

};

module.exports = sendEmail;