const express = require("express")
const router = express.Router()
const Lead = require("../models/Lead")

// GET TODAY FOLLOWUPS
router.get("/today", async (req, res) => {
  try {

    const today = new Date()
    today.setHours(0,0,0,0)

    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const leads = await Lead.find({
      nextFollowUp: {
        $gte: today,
        $lt: tomorrow
      }
    })

    res.json({
      success: true,
      notifications: leads
    })

  } catch (err) {
    res.json({ success: false })
  }
})

module.exports = router