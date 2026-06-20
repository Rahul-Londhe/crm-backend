const Lead = require("../models/Lead");
const Task = require("../models/Task");

const sendEmail = require("../utils/sendEmail");
const sendWhatsApp = require("../utils/sendWhatsApp");

const Settings = require("../models/Settings");

const autoFollowup = async () => {

  try {

    const settingsList =
      await Settings.find({
        autoFollowupEnabled: true
      });

    for (const settings of settingsList) {

      const leads =
        await Lead.find({
          companyId: settings.companyId,
          autoFollowed: false
        });

      for (const lead of leads) {

        const score = lead.score || 0;

        // ================= HOT =================

        if (score >= 80) {

          if (
            lead.phone &&
            settings.whatsappAuto
          ) {

            let msg =
              settings.hotLeadWhatsappTemplate ||
              "Hi {{name}}, Thank you for contacting us.";

   msg = msg
  .replace(/{{name}}/g, lead.name || "Customer")
  .replace(/{{company}}/g, settings.companyName || "Company")
  .replace(/{{phone}}/g, settings.companyPhone || "")
  .replace(/{{email}}/g, settings.companyEmail || "");


            await sendWhatsApp(
              lead.phone,
              msg
            );
          }
        }

        // ================= WARM =================

        else if (score >= 40) {

          if (
            lead.phone &&
            settings.whatsappAuto
          ) {

            let msg =
              settings.warmLeadWhatsappTemplate ||
              "Hi {{name}}, Thank you for your enquiry.";

            msg = msg
  .replace(/{{name}}/g, lead.name || "Customer")
  .replace(/{{company}}/g, settings.companyName || "Company")
  .replace(/{{phone}}/g, settings.companyPhone || "")
  .replace(/{{email}}/g, settings.companyEmail || "");

            await sendWhatsApp(
              lead.phone,
              msg
            );
          }

          await Task.create({

            title:
              `Follow up with ${lead.name}`,

            lead: lead._id,

            user:
              lead.assignedTo || null,

            status: "Pending"

          });
        }

        // ================= COLD =================

        else {

          if (
            lead.email &&
            settings.emailAuto
          ) {

            let subject =
(settings.coldLeadEmailSubject || "Thank You")
.replace(
  /{{company}}/g,
  settings.companyName || "Company"
);
            let body =
              settings.coldLeadEmailTemplate ||
              "Thank you for contacting us";

            body = body
  .replace(
    /{{name}}/g,
    lead.name || "Customer"
  )
  .replace(
    /{{company}}/g,
    settings.companyName || "Company"
  )
  .replace(
    /{{phone}}/g,
    settings.companyPhone || ""
  )
  .replace(
    /{{email}}/g,
    settings.companyEmail || ""
  );

            await sendEmail(
              lead.email,
              subject,
              body
            );
          }
        }

        lead.autoFollowed = true;

        await lead.save();

      }
    }

    console.log(
      "✅ Auto Followup Completed"
    );

  } catch (err) {

    console.log(
      "❌ Auto Followup Error:",
      err.message
    );
  }
};

module.exports = autoFollowup;