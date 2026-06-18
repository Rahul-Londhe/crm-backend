const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/send", async (req, res) => {

  try {

    const { email, subject, message } = req.body;

    const transporter =
      nodemailer.createTransport({

        service: "gmail",

        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }

      });

    await transporter.sendMail({

      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: message

    });

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

module.exports = router;