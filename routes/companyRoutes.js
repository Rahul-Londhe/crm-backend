const express = require("express");
const router = express.Router();

const multer = require("multer");

const Company = require("../models/Company");

// ================= MULTER =================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

// ================= CREATE COMPANY =================

router.post(
  "/",
  upload.single("logo"),
  async (req, res) => {

    try {

      // ================= CHECK BODY =================

      if (!req.body) {
        return res.status(400).json({
          success: false,
          message: "Form data missing",
        });
      }

      // ================= GET DATA =================

      const {
        name,
        email,
        phone,
        companyName,
        businessType,
        username,
        password,
      } = req.body;

      // ================= VALIDATION =================

      if (
        !name ||
        !email ||
        !phone ||
        !companyName ||
        !businessType ||
        !username ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // ================= CREATE =================

      const company = await Company.create({
        name,
        email,
        phone,
        companyName,
        businessType,
        username,
        password,

        logo:
          req.file
            ? req.file.originalname
            : "",
      });

      // ================= SUCCESS =================

      res.json({
        success: true,
        message: "Company created successfully",
        company,
      });

    } catch (err) {

      console.error("CREATE COMPANY ERROR:", err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ================= GET ALL =================

router.get("/", async (req, res) => {

  try {

    const companies =
      await Company.find().populate("owner");

    res.json({
      success: true,
      companies,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;