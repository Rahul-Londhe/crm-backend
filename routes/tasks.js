const express = require("express");
const router = express.Router();

const Task = require("../models/Task");
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");

const auth = require("../middleware/auth");

// ================= GET ALL TASKS =================
router.get("/", auth, async (req, res) => {
  try {

    const tasks = await Task.find({
      companyId: req.user.companyId
    })
      .populate("lead", "name email phone")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks
    });

  } catch (err) {

    console.error("TASK FETCH ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

// ================= CREATE TASK =================
router.post("/", auth, async (req, res) => {
  try {

    const { title, leadId, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task title required"
      });
    }

    const task = await Task.create({
      title,
      lead: leadId || null,
      companyId: req.user.companyId,
      user: req.user.id,
      status: "Pending",
      dueDate: dueDate || null
    });

    // Activity Log
    await Activity.create({
      action: `Task Created: ${title}`,
      user: req.user.name,
      companyId: req.user.companyId
    });

    const populatedTask =
      await Task.findById(task._id)
        .populate("lead", "name email phone")
        .populate("user", "name email");

    res.status(201).json({
      success: true,
      task: populatedTask
    });

  } catch (err) {

    console.error("TASK CREATE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

module.exports = router;