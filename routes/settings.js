const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// GET settings
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    console.error("Settings GET Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// UPDATE settings
router.put("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});

    settings.autoFollowupEnabled = req.body.autoFollowupEnabled;
    await settings.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Settings PUT Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;