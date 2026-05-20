const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Lead = require("../models/Lead");
const LeadNote = require("../models/LeadNote");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const runLeadAutomation =
require("../automation/leadAutomation");
// ================= UPLOAD PATH =================
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ================= MULTER =================
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
      cb(null, Date.now() + path.extname(file.originalname))
  })
});

// ================= SAFE USER =================
const getUser = (req) => {
  if (!req.user || !req.user.companyId) {
    throw new Error("UNAUTHORIZED");
  }
  return req.user;
};

// ================= COMPANY FILTER =================
const getCompanyFilter = (req) => {
  const user = getUser(req);
  return {
    companyId: new mongoose.Types.ObjectId(user.companyId)
  };
};

// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find(getCompanyFilter(req))
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, leads });

  } catch (err) {
    console.error("GET ERROR:", err);

    if (err.message === "UNAUTHORIZED") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= CREATE =================
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const user = getUser(req);

    const lead = await Lead.create({
      ...req.body,
      value: req.body.value ? Number(req.body.value) : 0,
      user: user.id,
      companyId: new mongoose.Types.ObjectId(user.companyId),
      file: req.file ? req.file.filename : ""
    });
await runLeadAutomation(
  lead,
  req.user,
  req.app.get("io")
);
    const populated = await Lead.findById(lead._id)
      .populate("assignedTo", "name email");

    res.json({ success: true, lead: populated });

  } catch (err) {
    console.error("CREATE ERROR:", err);

    if (err.message === "DUPLICATE_PHONE") {
      return res.status(400).json({
        success: false,
        message: "Phone already exists"
      });
    }

    if (err.message === "UNAUTHORIZED") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ================= UPDATE =================
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const user = getUser(req);

    const updateData = {
      ...req.body,
      user: user.id
    };

    if (req.body.value) {
      updateData.value = Number(req.body.value);
    }

    if (req.file) {
      updateData.file = req.file.filename;
    }

    const lead = await Lead.findOneAndUpdate(
      {
        _id: req.params.id,
        ...getCompanyFilter(req)
      },
      updateData,
      { new: true }
    ).populate("assignedTo", "name email");

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    res.json({ success: true, lead });

  } catch (err) {
    console.error("UPDATE ERROR:", err);

    if (err.message === "DUPLICATE_PHONE") {
      return res.status(400).json({
        success: false,
        message: "Phone already exists"
      });
    }

    if (err.message === "UNAUTHORIZED") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
});
// ================= STATUS UPDATE =================
router.put("/:id/status", async (req, res) => {
  try {
    const user = getUser(req);
const lead = await Lead.findOneAndUpdate(
  {
    _id: req.params.id,
    ...getCompanyFilter(req)
  },

  (() => {

    let temperature = "Cold";

    if (req.body.status === "Interested") {
      temperature = "Hot";
    }
    else if (req.body.status === "Contacted") {
      temperature = "Warm";
    }

    return {
      status: req.body.status,
      temperature,
      lastContacted: new Date()
    };

  })(),

  { new: true }
).populate("assignedTo", "name email");

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    res.json({ success: true, lead });

  } catch (err) {
    console.error("STATUS ERROR:", err);

    if (err.message === "UNAUTHORIZED") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ================= ASSIGN USER =================
router.put("/:id/assign", async (req, res) => {
  try {
    const user = getUser(req);

    const lead = await Lead.findOneAndUpdate(
      {
        _id: req.params.id,
        ...getCompanyFilter(req)
      },
      {
        assignedTo: req.body.userId || null
      },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    res.json({ success: true, lead });

  } catch (err) {
    console.error("ASSIGN ERROR:", err);

    if (err.message === "UNAUTHORIZED") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Lead.findOneAndDelete({
      _id: req.params.id,
      ...getCompanyFilter(req)
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE ERROR:", err);

    if (err.message === "UNAUTHORIZED") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
});
// ================= FILE PREVIEW =================
router.get("/file/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.sendFile(filePath);
});

// ================= FILE DOWNLOAD =================
router.get("/file/:filename/download", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.download(filePath);
});
// ================= EXPORT EXCEL =================
router.get("/export", async (req, res) => {
  try {
    const user = getUser(req); // ✅ IMPORTANT

    const leads = await Lead.find({
      companyId: new mongoose.Types.ObjectId(user.companyId)
    });

    const fields = ["name", "email", "phone", "status", "createdAt"];

    const rows = leads.map(l => ({
      name: l.name || "",
      email: l.email || "",
      phone: l.phone || "",
      status: l.status || "",
      createdAt: l.createdAt
        ? new Date(l.createdAt).toLocaleDateString()
        : ""
    }));

    const csv = [
      fields.join(","),
      ...rows.map(r => fields.map(f => `"${r[f]}"`).join(","))
    ].join("\n");

    res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
    res.setHeader("Content-Type", "text/csv");

    res.send(csv);

  } catch (err) {
    console.error("EXPORT ERROR:", err);

    if (err.message === "UNAUTHORIZED") {
      return res.status(401).json({
        success: false,
        message: "No token"
      });
    }

    res.status(500).json({ success: false });
  }
});
// ================= ADD NOTE =================
router.post("/:id/notes", async (req, res) => {

  try {

    const user = getUser(req);

    if (!req.body.note) {
      return res.status(400).json({
        success: false,
        message: "Note required"
      });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req)
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    const newNote = await LeadNote.create({

      lead: lead._id,
      companyId: user.companyId,
      user: user.id,
      note: req.body.note

    });

    const populated =
      await LeadNote.findById(newNote._id)
      .populate("user", "name email");

    res.json({
      success: true,
      note: populated
    });

  } catch (err) {

    console.log("NOTE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ================= GET NOTES =================
router.get("/:id/notes", async (req, res) => {

  try {

    const notes = await LeadNote.find({

      lead: req.params.id,
      ...getCompanyFilter(req)

    })
    .populate("user", "name")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

});
module.exports = router;