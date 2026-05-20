const express = require("express");

const router = express.Router();

const Meeting =
  require("../models/Meeting");

// ================= CREATE =================

router.post("/", async (req, res) => {

  try {

    const meeting =
      await Meeting.create(req.body);

    res.json({
      success: true,
      meeting
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ================= GET =================

router.get("/", async (req, res) => {

  try {

    const meetings =
      await Meeting.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      meetings
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ================= DELETE =================

router.delete("/:id", async (req, res) => {

  try {

    await Meeting.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      success: false
    });

  }

});

module.exports = router;