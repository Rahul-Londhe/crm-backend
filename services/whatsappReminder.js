const cron = require("node-cron");
const Invoice = require("../models/Invoice");
const axios = require("axios");

cron.schedule("0 10 * * *", async () => {
  const pendingInvoices = await Invoice.find({ status: "Pending" });

  for (let inv of pendingInvoices) {
    await axios.post("https://api.whatsapp.com/send", {
      phone: inv.phone,
      message: `Reminder: Please pay ₹${inv.amount}`,
    });
  }
});