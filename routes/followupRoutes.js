const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead"); // make sure Lead model exists
const { auth } = require("../server"); // import your auth middleware

// GET followups
router.get("/", auth, async (req, res) => {
  try {
    const leads = await Lead.find({ nextFollowUp: { $exists: true, $ne: null } })
      .sort({ nextFollowUp: 1 })
      .limit(10); // limit to next 10 follow-ups

    res.json({ success: true, leads });
  } catch (err) {
    console.error("FollowUp Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;