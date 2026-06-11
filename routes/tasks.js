const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Lead = require("../models/Lead");

// ---------------- GET ALL TASKS ----------------
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().populate("lead", "name email phone");
    res.json({ success: true, tasks });
  } catch (err) {
    console.error("Tasks API Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ---------------- CREATE TASK ----------------
router.post("/", async (req, res) => {
  try {
    const { title, leadId, status, dueDate } = req.body;

    const task = new Task({
  title,
  lead: leadId,
  companyId: req.user.companyId,
  user: req.user.id,
  status: "Pending",
  dueDate: dueDate || null
});

    await task.save();

    // 🔥 ADD ACTIVITY IN LEAD
    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        await Activity.create({
  action: `Task Created: ${title}`,
  user: req.user.name,
  companyId: req.user.companyId
});
      }
    }

    res.json({ success: true, task });

  } catch (err) {
    console.error("Create Task Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;