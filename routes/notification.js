const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { getIO } = require("../socket");

// GET NOTIFICATIONS
router.get("/", auth, async (req, res) => {
  const data = await Notification.find({
    companyId: req.user.companyId
  }).sort({ createdAt: -1 });

  res.json(data);
});

// CREATE NOTIFICATION + SOCKET EMIT
router.post("/", auth, async (req, res) => {
  try {
    const notif = await Notification.create({
      user: req.user.name,
      message: req.body.message,
      type: req.body.type,
      companyId: req.user.companyId
    });

    // REAL-TIME PUSH
    const io = getIO();
    io.emit("notification", notif);

    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;