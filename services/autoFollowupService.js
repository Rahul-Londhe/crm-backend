const Lead = require("../models/Lead");
const Task = require("../models/Task");

// ✅ FIXED PATH
const sendEmail = require("../utils/sendEmail.js");
const sendWhatsApp = require("../utils/sendWhatsApp.js");

const Settings = require("../models/Settings");

const autoFollowup = async () => {
  try {

    const settings = await Settings.findOne();

    // ✅ Safe check
    if (!settings || !settings.autoFollowupEnabled) {
      console.log("⛔ Auto Follow-up OFF");
      return;
    }

    // ✅ Only unprocessed leads
    const leads = await Lead.find({ autoFollowed: false });

    for (let lead of leads) {

      const score = lead.score || 0;

      // ---------------- HIGH ----------------
      if (score >= 80) {
        try {
          if (lead.phone) {
            await sendWhatsApp(
              lead.phone,
              `Hi ${lead.name}, we would like to connect with you!`
            );
          }
        } catch (err) {
          console.log("WhatsApp Error:", err.message);
        }
      }

      // ---------------- MEDIUM ----------------
      else if (score >= 40) {
        try {
          await Task.create({
            title: `Follow up with ${lead.name}`,
            lead: lead._id,

            // 🔥 IMPORTANT FIX
            user: lead.assignedTo || null,

            // ✅ FIXED STATUS
            status: "Pending"
          });
        } catch (err) {
          console.log("Task Error:", err.message);
        }
      }

      // ---------------- LOW ----------------
      else {
        try {
          if (lead.email) {
            await sendEmail(
              lead.email,
              "We will contact you soon",
              "Thanks for your interest"
            );
          }
        } catch (err) {
          console.log("Email Error:", err.message);
        }
      }

      // ✅ Mark processed
      lead.autoFollowed = true;
      await lead.save();
    }

    console.log("✅ Auto Follow-up Done");

  } catch (err) {
    console.log("❌ AutoFollowup Error:", err.message);
  }
};

module.exports = autoFollowup;