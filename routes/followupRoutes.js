const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");

// GET TODAY FOLLOWUPS
router.get("/today", async (req, res) => {

console.log("FOLLOWUP USER:", req.user);


  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const leads = await Lead.find({
  companyId: req.user.companyId,

  nextFollowUp: {
    $gte: today,
    $lt: tomorrow
  }
});

   res.json({
  success: true,
  leads
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