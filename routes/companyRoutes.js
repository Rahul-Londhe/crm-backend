const express = require("express");
const router = express.Router();

const Company = require("../models/Company");

// CREATE COMPANY
router.post("/", async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.json({ success: true, company });
  } catch {
    res.status(500).json({ success: false });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  const companies = await Company.find().populate("owner");
  res.json({ success: true, companies });
});

module.exports = router;