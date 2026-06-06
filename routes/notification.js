const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { getIO } = require("../socket");

// =========================
// GET ALL NOTIFICATIONS
// =========================

router.get("/", auth, async (req, res) => {
  try {

    const notifications =
      await Notification.find({
        companyId: req.user.companyId
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

// =========================
// GET /all
// =========================

router.get("/all", auth, async (req, res) => {
  try {

    const notifications =
      await Notification.find({
        companyId: req.user.companyId
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

// =========================
// GET UNREAD COUNT
// =========================

router.get("/unread-count", auth, async (req, res) => {
  try {

    const count =
      await Notification.countDocuments({
        companyId: req.user.companyId,
        read: false
      });

    res.json({
      success: true,
      count
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

// =========================
// CREATE NOTIFICATION
// =========================

router.post("/", auth, async (req, res) => {
  try {

    const notification =
      await Notification.create({

        user: req.user._id,

        message: req.body.message,

        type:
          req.body.type || "task",

        companyId:
          req.user.companyId,

        read: false

      });

    try {

      const io = getIO();

      if (io) {

        io.to(
          req.user.companyId.toString()
        ).emit(
          "notification",
          notification
        );

      }

    } catch (socketErr) {

      console.log(
        "Socket Error:",
        socketErr.message
      );

    }

    res.json({
      success: true,
      notification
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

// =========================
// MARK AS READ
// =========================

router.put("/:id/read", auth, async (req, res) => {
  try {

    const notification =
      await Notification.findByIdAndUpdate(
        req.params.id,
        {
          read: true
        },
        {
          new: true
        }
      );

    res.json({
      success: true,
      notification
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

// =========================
// DELETE NOTIFICATION
// =========================

router.delete("/:id", auth, async (req, res) => {
  try {

    await Notification.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message:
        "Notification deleted"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

module.exports = router;