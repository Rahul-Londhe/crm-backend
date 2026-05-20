const Task = require("../models/Task");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");

async function runLeadAutomation(
  lead,
  user,
  io
) {

  try {
    console.log("AUTOMATION STARTED");

// ================= AI SCORE =================
let score = 0;

// SOURCE SCORE
if (lead.source === "Website") {
  score += 30;
}

if (lead.source === "Facebook") {
  score += 20;
}

// VALUE SCORE
if (lead.value > 50000) {
  score += 40;
}

// EMAIL EXISTS
if (lead.email) {
  score += 10;
}

// PHONE EXISTS
if (lead.phone) {
  score += 10;
}

// SAVE SCORE
lead.score = score;

// TEMPERATURE
if (score >= 70) {
  lead.temperature = "Hot";
}
else if (score >= 40) {
  lead.temperature = "Warm";
}
else {
  lead.temperature = "Cold";
}

await lead.save();
console.log("AI SCORE:", score);

    // ================= AUTO TASK =================
    const task = await Task.create({

      title:
        `Follow-up ${lead.name}`,

      description:
        `Call ${lead.name} (${lead.phone})`,

      priority: "High",

      status: "Pending",

      dueDate: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),

      lead: lead._id,

      user: user.id,

      companyId: user.companyId

    });

    // ================= ACTIVITY =================
    await Activity.create({

      action:
        `New Lead Added: ${lead.name}`,

      user:
        user.name || "Unknown",

      companyId:
        user.companyId

    });

    // ================= NOTIFICATION =================
    const notification =
      await Notification.create({

        user:
          user.name || "Unknown",

        message:
          `New Lead Assigned: ${lead.name}`,

        type: "lead",

        companyId:
          user.companyId

      });

    // ================= SOCKET =================
    if (io) {

      io.to(
        user.companyId.toString()
      ).emit(
        "notification",
        notification
      );

      io.to(
        user.companyId.toString()
      ).emit(
        "taskCreated",
        task
      );

    }

    console.log(
      "✅ Lead Automation Done"
    );

  } catch (err) {

    console.log(
      "AUTOMATION ERROR:",
      err.message
    );

  }

}

module.exports =
  runLeadAutomation;