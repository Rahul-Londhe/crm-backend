const PDFDocument = require("pdfkit");

const generatePDF = (invoice, res) => {

  const doc = new PDFDocument({
    margin: 50,
    size: "A4"
  });

  // ================= HEADERS =================

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    `inline; filename=invoice_${invoice._id}.pdf`
  );

  doc.pipe(res);

  // ================= COLORS =================

  const primary = "#2563eb";
  const dark = "#111827";
  const gray = "#6b7280";
  const light = "#f3f4f6";
  const green = "#16a34a";
  const red = "#dc2626";
const orange = "#f59e0b";
  // ================= COMPANY HEADER =================

  doc
    .rect(0, 0, 700, 120)
    .fill(primary);

  doc
    .fillColor("white")
    .fontSize(24)
    .text(
      "SHAMBHU DIGITAL MARKETING",
      50,
      40,
      {
        align: "center"
      }
    );

  doc
    .fontSize(11)
    .text(
      "Grow Your Business Digitally",
      {
        align: "center"
      }
    );

  // ================= COMPANY DETAILS =================

  doc
    .fillColor(dark)
    .fontSize(10)
    .text(
      "67 Bhagat Singh Colony, Deopur, Dhule",
      50,
      140
    );

  doc.text(
    "Email: shambhudigital18@gmail.com",
    50,
    155
  );

  doc.text(
    "Phone: 7020382130",
    50,
    170
  );

  doc.text(
    "GST No: 27ABCDE1234F1Z5",
    50,
    185
  );

  // ================= INVOICE TITLE =================

  doc
    .fontSize(26)
    .fillColor(primary)
    .text(
      "INVOICE",
      400,
      140
    );

  // ================= DATE FORMAT =================

  const formatDate = (date) => {

    if (!date) return "N/A";

    return new Date(date)
      .toLocaleDateString("en-IN");

  };
const formatCurrency = (num) => {

  return new Intl.NumberFormat(
    "en-IN"
  ).format(Number(num || 0));

};
  // ================= STATUS =================

  const total =
    Number(invoice.amount || 0);

  const payments =
    Array.isArray(invoice.payments)
      ? invoice.payments
      : [];

  const paid =
    payments.reduce(
      (sum, p) =>
        sum + Number(p.amount || 0),
      0
    );

  const remaining =
    total - paid;

  let status = "Pending";

  if (paid >= total) {

    status = "Paid";

  } else if (paid > 0) {

    status = "Partial";

  }

  // ================= STATUS BADGE =================

  doc
    .roundedRect(
      400,
      180,
      120,
      30,
      5
    )
    .fill(
  status === "Paid"
    ? green
    : status === "Partial"
    ? orange
    : red
);

  doc
    .fillColor("white")
    .fontSize(14)
    .text(
      status.toUpperCase(),
      430,
      188
    );

  // ================= INVOICE DETAILS =================

  doc
    .fillColor(dark)
    .fontSize(12);

  doc.text(
    `Invoice No: ${invoice.invoiceNumber || "N/A"}`,
    50,
    240
  );

  doc.text(
    `Invoice Date: ${formatDate(invoice.createdAt)}`,
    50,
    260
  );

  doc.text(
    `Due Date: ${formatDate(invoice.dueDate)}`,
    50,
    280
  );

  // ================= CLIENT DETAILS =================

  doc
    .fontSize(16)
    .fillColor(primary)
    .text(
      "Bill To",
      50,
      330
    );

  doc
    .moveTo(50, 350)
    .lineTo(250, 350)
    .strokeColor(primary)
    .stroke();

  doc
    .fillColor(dark)
    .fontSize(12);

  doc.text(
    `Client Name: ${invoice.lead?.name || "N/A"}`,
    50,
    370
  );

  doc.text(
    `Mobile: ${invoice.lead?.phone || "N/A"}`,
    50,
    390
  );

  doc.text(
    `Email: ${invoice.lead?.email || "N/A"}`,
    50,
    410
  );

  doc.text(
    `Company: ${invoice.lead?.company || "N/A"}`,
    50,
    430
  );
doc.text(
  `Company: ${invoice.lead?.company || "N/A"}`,
  50,
  430
);
doc.text(
  `Address: ${invoice.lead?.address || "N/A"}`,
  50,
  450
);

doc.text(
  `City: ${invoice.lead?.city || "N/A"}`,
  50,
  470
);

doc.text(
  `State: ${invoice.lead?.state || "N/A"}`,
  50,
  490
);

doc.text(
  `GST No: ${invoice.lead?.gstNumber || "N/A"}`,
  50,
  510
);
  // ================= TABLE HEADER =================

const tableTop = 540;

  doc
    .rect(
      50,
      tableTop,
      500,
      30
    )
    .fill(primary);

  doc
    .fillColor("white")
    .fontSize(12);

  doc.text(
    "Service",
    60,
    tableTop + 8
  );

  doc.text(
    "Amount",
    450,
    tableTop + 8
  );

  // ================= TABLE ROW =================

  doc
    .rect(
      50,
      tableTop + 30,
      500,
      40
    )
    .fill(light);

  doc
    .fillColor(dark);

  doc.text(
    invoice.service || "Digital Marketing Service",
    60,
    tableTop + 45
  );

  doc.text(
  `Rs. ${formatCurrency(total)}`,
  450,
  tableTop + 45
);

  // ================= SUMMARY =================

  const summaryTop = tableTop + 120;
  doc
    .fontSize(13)
    .fillColor(dark);

  doc.text(
  `Total Amount: Rs.${formatCurrency(total)}`,
  350,
  summaryTop
);

  doc.text(
  `Paid Amount: Rs. ${formatCurrency(paid)}`,
  350,
  summaryTop + 25
);

  doc.text(
  `Remaining: Rs. ${formatCurrency(remaining)}`,
  350,
  summaryTop + 50
);
  // ================= PAYMENT HISTORY =================

  doc
    .fontSize(16)
    .fillColor(primary)
    .text(
      "Payment History",
      50,
      summaryTop + 100
    );

  if (payments.length > 0) {

    payments.forEach(
      (p, index) => {

        doc
          .fillColor(dark)
          .fontSize(11)
          .text(
            `${index + 1}. Rs.${formatCurrency(p.amount)} | ${p.method || "Online"} | ${formatDate(p.date)}`,
            60,
            summaryTop + 130 + (index * 20)
          );

      }
    );

  } else {

    doc
      .fillColor(gray)
      .text(
        "No payment history available",
        60,
        summaryTop + 130
      );

  }
// ================= NOTES =================

doc
  .fontSize(12)
  .fillColor(primary)
  .text(
    "Notes",
    50,
    650
  );

doc
  .fillColor(gray)
  .fontSize(10)
  .text(
    "Payment once made is non-refundable. Please contact us for any invoice queries.",
    50,
    670,
    {
      width: 400
    }
  );
  doc
  .fillColor(dark)
  .fontSize(11)
  .text(
    "UPI: shambhudigital@upi",
    400,
    690
);
  // ================= FOOTER =================

  doc
    .moveTo(50, 780)
    .lineTo(550, 760)
    .strokeColor("#d1d5db")
    .stroke();

  doc
    .fontSize(10)
    .fillColor(gray)
    .text(
      "Thank you for your business!",
      50,
      800,
      {
        align: "center"
      }
    );

  doc
    .text(
      "Powered By Shambhu Digital Marketing",
      {
        align: "center"
      }
    );

  // ================= SIGNATURE =================

  doc
    .fillColor(dark)
    .fontSize(11)
    .text(
      "Authorized Signature",
      420,
      720
    );

  doc.end();

};

module.exports = generatePDF;