// ================= BASIC =================
require("dotenv").config();
require('dns').setDefaultResultOrder('ipv4first');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { sendWhatsAppMessage } = require("./services/whatsappService");
const Activity = require("./models/Activity");
const Notification = require("./models/Notification");
const rateLimit = require("express-rate-limit");
const admin = require("./middleware/admin");
const allowRoles = require("./middleware/roles");
const app = express();

const generatePDF = require("./utils/generateInvoice");
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// app set io
app.set("io", io);

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("joinCompany", (companyId) => {
    socket.join(companyId);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});
// ================= MIDDLEWARE =================
app.use(express.json());
app.use((req, res, next) => {
  console.log("API HIT:", req.method, req.url);
  next();
});
app.use(morgan("dev"));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // increase limit
  standardHeaders: true,
  legacyHeaders: false
}));
const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);
// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("DB Error:", err.message);
    process.exit(1);
  });

// ================= MODELS =================
const Company = require("./models/Company");
const Lead = require("./models/Lead");
const Task = require("./models/Task");
const Invoice = require("./models/Invoice");
const Settings = require("./models/Settings");
// ================= EMPLOYEE + ATTENDANCE =================
const employeeRoutes = require("./routes/employees");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes =
require("./routes/leaves");
const payrollRoutes =
require("./routes/payroll");
const User = require("./models/User");
const logActivity = async (action, user, companyId) => {
  try {

    if (!companyId) return;

    await Activity.create({
      action,
      user,
      companyId
    });

    io.to(companyId.toString()).emit("activity", {
      action,
      user,
      time: new Date()
    });

  } catch (err) {
    console.log("Activity Error:", err.message);
  }
};
const createNotification = async (
  user,
  message,
  type,
  companyId
) => {

  try {

    const notification = await Notification.create({
      user,
      message,
      type,
      companyId
    });

    io.to(companyId.toString()).emit(
      "notification",
      notification
    );

  } catch (err) {
    console.log(err.message);
  }
};
// ================= AUTH =================
function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    console.log("TOKEN:", token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED:", decoded);

    if (!decoded?.id || !decoded?.companyId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    req.user = decoded;

    next(); // ✅ ONLY HERE

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
}
// ✅ AFTER AUTH ADD THIS
const leadsRoutes = require("./routes/leads");
// ================= FILE UPLOAD =================
const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

app.use("/uploads", express.static(uploadPath));

// ✅ PREVIEW
app.get("/api/leads/file/:filename", (req, res) => {
  const filePath = path.join(uploadPath, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.sendFile(filePath);
});

// ✅ DOWNLOAD
app.get("/api/leads/file/:filename/download", (req, res) => {
  const filePath = path.join(uploadPath, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.download(filePath);
});



const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) =>
      cb(null, Date.now() + path.extname(file.originalname))
  })
});

// ================= RAZORPAY =================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});
// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("CRM API Running ✅");
});
// ================= ROUTER =================
const router = express.Router();
app.use("/api/leads", auth, leadsRoutes);
const meetingRoutes =
require("./routes/meetingRoutes");

app.use(
  "/api/meetings",
  meetingRoutes
);
// ================= EMPLOYEE ROUTES =================
app.use(
  "/api/employees",
  auth,
  employeeRoutes
);

// ================= ATTENDANCE ROUTES =================
app.use(
  "/api/attendance",
  auth,
  attendanceRoutes
);
app.use(
  "/api/leaves",
  auth,
  leaveRoutes
);
app.use(
  "/api/payroll",
  auth,
  allowRoles("admin", "hr"),
  payrollRoutes
);
// ================= WHATSAPP =================
router.post("/whatsapp/send", auth, async (req, res) => {
  try {
    await sendWhatsAppMessage(req.body.phone, req.body.message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 👉 ADD NEW ROUTE HERE (better naming)
router.post("/whatsapp/send-message", auth, async (req, res) => {
  try {
    const { phone, message } = req.body;

    await sendWhatsAppMessage(phone, message);

    res.json({ success: true, message: "WhatsApp sent" });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});
// ================= EMAIL =================
const sendEmail = require("./services/emailService");

router.post("/email/send", auth, async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    const success = await sendEmail(email, subject, message);

    if (success) {
      return res.json({
        success: true,
        message: "Email sent successfully"
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Email failed"
      });
    }

  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({ 
  success: false, 
  message: err.message 
});
  }
});
// ================= AUTH =================
router.post("/auth/register", async (req, res) => {
  try {
    let { name, email, password, companyId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    email = email.toLowerCase().trim();

    const exist = await User.findOne({ email });
    
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);
console.log("REGISTER PASSWORD:", password);
console.log("HASHED PASSWORD:", hashed);
    let finalCompanyId = companyId;

    if (!finalCompanyId) {
      const newCompany = await Company.create({
  name: name + " Company",   // ✅ FIX
  owner: null
});

      finalCompanyId = newCompany._id;
    }

    // Check if company already has users
const existingUsers = await User.find({ companyId: finalCompanyId });

// First user = Admin
const role = existingUsers.length === 0 ? "admin" : "employee";

const user = await User.create({
  name,
  email,
  password: hashed,
  role: role,   // ✅ FIX
  companyId: finalCompanyId
});
    await Company.findByIdAndUpdate(finalCompanyId, {
      owner: user._id
    });
const token = jwt.sign(
  { 
  id: user._id,
  name: user.name,
  companyId: user.companyId.toString(),
  role: user.role 
},
  process.env.JWT_SECRET
);
    res.json({
      success: true,
      user,
      token
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
router.post("/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/password missing"
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    console.log("USER FOUND:", user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", match);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Wrong password"
      });
    }

    const token = jwt.sign({
      id: user._id,
      companyId: user.companyId.toString(),
      role: user.role
    }, process.env.JWT_SECRET);

    return res.json({
      success: true,
      user,
      token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
// ================= USERS =================
router.get("/users", auth, admin, async (req, res) => {
  const users = await User.find({ companyId: new mongoose.Types.ObjectId(req.user.companyId) });
  res.json({ success: true, users });
});

// ================= UPDATE USER ROLE =================
router.put(
  "/users/:id/role",
  auth,
  admin,
  async (req, res) => {

    try {

      const user =
        await User.findByIdAndUpdate(

          req.params.id,

          {
            role: req.body.role
          },

          {
            new: true
          }

        );

      res.json({
        success: true,
        user
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);
router.put(
  "/make-admin/:id",
  async (req, res) => {

    try {

      const user =
        await User.findByIdAndUpdate(

          req.params.id,

          {
            role: "admin"
          },

          {
            new: true
          }

        );

      res.json({
        success: true,
        user
      });

    } catch (err) {

      res.status(500).json({
        success: false
      });

    }

});
// ================= ACTIVITY =================
router.get("/activity", auth, async (req, res) => {
  try {
    const logs = await Activity.find({
  companyId: req.user.companyId
})
.sort({ createdAt: -1 })
.limit(50);

    res.json({ success: true, logs });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});
// ================= COMPANY =================
router.post("/company", auth, upload.single("logo"), async (req, res) => {
    try {

      const {
        name,
        email,
        phone,
        businessType,
        username,
        password
      } = req.body;

      // ✅ REQUIRED VALIDATION
      if (
        !name ||
        !email ||
        !phone ||
        !businessType ||
        !username ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields required"
        });
      }

      // ✅ CHECK EXISTING USER
      const existing = await User.findOne({
        email
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }

      // ✅ HASH PASSWORD
      const hashed =
        await bcrypt.hash(password, 10);

      // ✅ CREATE COMPANY
      const company =
        await Company.create({
          name,
          email,
          phone,
          businessType,
          logo: req.file
            ? req.file.filename
            : null
        });

      // ✅ CREATE ADMIN USER
      const user =
        await User.create({
          name,
          email,
          password: hashed,
          username,
          role: "admin",
          companyId: company._id
        });

      // ✅ UPDATE OWNER
      company.owner = user._id;

      await company.save();

      // ✅ TOKEN
      const token = jwt.sign(
        {
          id: user._id,
          companyId: company._id,
          role: user.role
        },
        process.env.JWT_SECRET
      );

      res.json({
        success: true,
        company,
        user,
        token
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

});

router.get("/company", auth, async (req, res) => {
  const companies = await Company.find({ owner: req.user.id });
  res.json({ success: true, companies });
});

// ================= LEADS =================

// ================= TASKS =================
router.get("/tasks", auth, async (req, res) => {

  try {

    let tasks = [];

    // ✅ EMPLOYEE ONLY OWN TASKS
    if (req.user.role === "employee") {

      tasks = await Task.find({
        user: req.user.id,
        companyId: new mongoose.Types.ObjectId(req.user.companyId)
      })
      .populate("lead", "name email phone")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    }

    // ✅ ADMIN / HR / MANAGER
    else {

      tasks = await Task.find({
        companyId: new mongoose.Types.ObjectId(req.user.companyId)
      })
      .populate("lead", "name email phone")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    }

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
router.post("/tasks", auth, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title required"
      });
    }

  const task = await Task.create({
  title: req.body.title,
  description: req.body.description || "",
  priority: req.body.priority || "Medium",
  status: req.body.status || "Pending",
  dueDate: req.body.dueDate || null,
  lead: req.body.lead || null,
  user: req.user.id,
  companyId: req.user.companyId
});

// ACTIVITY
await logActivity(
  "Task Created: " + task.title,
  req.user.name || "Unknown User",
  req.user.companyId
);
await createNotification(
  req.user.name,
  "New Task Created: " + task.title,
  "task",
  req.user.companyId
);
// SOCKET
io.to(req.user.companyId.toString()).emit("taskCreated", task);

res.status(201).json({ success: true, task });

  } catch (err) {
    console.error("TASK ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.put("/tasks/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Task ID"
    });
  }

  const task = await Task.findOneAndUpdate(
    {
      _id: id,
      companyId: new mongoose.Types.ObjectId(req.user.companyId)
    },
    req.body,
    { new: true }
  );
if (task) {
  await logActivity(
    "Task Updated: " + task.title,
    req.user.name || "Unknown User",
    req.user.companyId
  );
await createNotification(
  req.user.name,
  "Task Updated: " + task.title,
  "task",
  req.user.companyId
);
  io.to(req.user.companyId.toString()).emit("taskUpdated", task);
}

res.json({ success: true, task });
});
router.put("/tasks/:id/complete", auth, async (req, res) => {

  try {

    const task = await Task.findOne({
      _id: req.params.id,
      companyId: new mongoose.Types.ObjectId(req.user.companyId)
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    task.completed = !task.completed;

    await task.save();

    await logActivity(
      "Task Completed: " + task.title,
      req.user.name || "Unknown User",
      req.user.companyId
    );

    io.to(req.user.companyId.toString()).emit(
      "taskUpdated",
      task
    );

    res.json({
      success: true,
      task
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});
router.delete("/tasks/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Task ID"
    });
  }

  const task = await Task.findOneAndDelete({
    _id: id,
    companyId: new mongoose.Types.ObjectId(req.user.companyId)
  });
if (task) {
  await logActivity(
  "Task Deleted: " + task.title,
  req.user.name || "Unknown User",
  req.user.companyId
);

  io.to(req.user.companyId.toString()).emit("taskDeleted", task);
}
  res.json({ success: true });
});
router.get("/leads/export", auth, async (req, res) => {
  try {
    const XLSX = require("xlsx");

    const leads = await Lead.find({
      companyId: new mongoose.Types.ObjectId(req.user.companyId)
    });

    const data = leads.map(l => ({
      Name: l.name,
      Phone: l.phone,
      Email: l.email,
      Status: l.status,
      Date: l.createdAt
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, "Leads");

    const filePath = "./leads.xlsx";
    XLSX.writeFile(wb, filePath);

    res.download(filePath, () => {
  fs.unlinkSync(filePath);
});

  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ success: false });
  }
});
// ================= FOLLOWUPS =================
router.get("/followups", auth, async (req, res) => {
  const leads = await Lead.find({
    companyId: new mongoose.Types.ObjectId(req.user.companyId),
    nextFollowUp: { $ne: null }
  });
  res.json({ success: true, leads });
});

// ================= CALENDAR =================
router.get("/calendar", auth, async (req, res) => {
  const tasks = await Task.find({
  companyId: new mongoose.Types.ObjectId(req.user.companyId)
})
.populate("lead", "name phone email")
.populate("user", "name email")
.sort({ createdAt: -1 });
  const leads = await Lead.find({
    companyId: new mongoose.Types.ObjectId(req.user.companyId),
    nextFollowUp: { $ne: null }
  });

  res.json({ success: true, tasks, followups: leads });
});

// ================= ANALYTICS =================
router.get("/stats", auth, async (req, res) => {
  const total = await Lead.countDocuments({ companyId: new mongoose.Types.ObjectId(req.user.companyId) });
  const closed = await Lead.countDocuments({
    companyId: new mongoose.Types.ObjectId(req.user.companyId),
    status: "Closed"
  });

  res.json({ success: true, total, closed });
});
// ================= HOT LEADS =================
router.get(
  "/hot-leads",
  auth,
  async (req, res) => {

    try {

      const leads = await Lead.find({
        companyId: new mongoose.Types.ObjectId(
          req.user.companyId
        ),
        score: { $gte: 50 }
      })
      .sort({ score: -1 });

      res.json({
        success: true,
        leads
      });

    } catch (err) {

      console.log(
        "HOT LEADS ERROR:",
        err.message
      );

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);
// ================= LEAD TEMPERATURE =================
router.get(
  "/lead-temperature/:type",
  auth,
  async (req, res) => {

    try {

      const leads = await Lead.find({
        companyId: new mongoose.Types.ObjectId(
          req.user.companyId
        ),
        temperature: req.params.type
      }).sort({ score: -1 });

      res.json({
        success: true,
        leads
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);
// ================= ANALYTICS =================

// SOURCE ANALYTICS
router.get("/analytics/source", auth, async (req, res) => {
  try {
    const year = Number(req.query.year);

    const matchStage = {
      companyId: new mongoose.Types.ObjectId(req.user.companyId)
    };

    if (year) {
      matchStage.createdAt = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    const data = await Lead.aggregate([
      { $match: matchStage },   // ✅ FIX
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, data });

  } catch (err) {
    console.error("SOURCE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// DAILY ANALYTICS
router.get("/analytics/daily", auth, async (req, res) => {
  try {
    const data = await Lead.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(req.user.companyId)
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1, "_id.day": 1 } }
    ]);

    res.json({ success: true, data });

  } catch (err) {
    console.error("DAILY ERROR:", err);
    res.status(500).json({ success: false });
  }
});


// MONTHLY ANALYTICS
router.get("/analytics/monthly", auth, async (req, res) => {
  try {
    const data = await Lead.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(req.user.companyId)
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    res.json({ success: true, data });

  } catch (err) {
    console.error("MONTHLY ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ================= ADVANCED REPORT =================
router.get(
  "/reports",
  auth,
  allowRoles("admin", "manager"),
  async (req, res) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    const leads = await Lead.find({ companyId });
    const invoices = await Invoice.find({ companyId });

    // ===== DAILY REPORT =====
    const today = new Date().toISOString().slice(0, 10);

    const dailyLeads = leads.filter(l =>
      l.createdAt?.toISOString().slice(0, 10) === today
    );

    const dailyRevenue = invoices
      .filter(inv =>
        inv.createdAt?.toISOString().slice(0, 10) === today
      )
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    // ===== MONTHLY REPORT =====
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyLeads = leads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyRevenue = invoices
      .filter(inv => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    // ===== STATUS COUNT =====
    const statusCount = {
      New: 0,
      Contacted: 0,
      Interested: 0,
      Closed: 0
    };

    leads.forEach(l => {
      if (statusCount[l.status] !== undefined) {
        statusCount[l.status]++;
      }
    });

    res.json({
      success: true,
      report: {
        daily: {
          leads: dailyLeads.length,
          revenue: dailyRevenue
        },
        monthly: {
          leads: monthlyLeads.length,
          revenue: monthlyRevenue
        },
        totalLeads: leads.length,
        status: statusCount
      }
    });

  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ success: false });
  }
});
// ================= PERFORMANCE =================
router.get(
  "/performance",
  auth,
  allowRoles("admin"),
  async (req, res) => {

    try {

      const users = await User.find({
        companyId: req.user.companyId
      });

      const data = await Promise.all(

        users.map(async (u) => {

          const leads =
            await Lead.countDocuments({
              companyId: req.user.companyId,
              assignedTo: u._id
            });

          const tasks =
            await Task.countDocuments({
              user: u._id,
              companyId: req.user.companyId
            });

          const invoices =
            await Invoice.find({
              user: u._id,
              companyId: req.user.companyId
            });

          const revenue =
            invoices.reduce(
              (sum, i) =>
                sum + Number(i.amount || 0),
              0
            );

          return {

            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            leads,
            tasks,
            revenue

          };

        })

      );

      res.json({
        success: true,
        data
      });

    } catch (err) {

      console.log(
        "PERFORMANCE ERROR:",
        err
      );

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);
// ================= NOTIFICATIONS =================
router.get("/notifications/all", auth, async (req, res) => {

  try {

    const notifications = await Notification.find({
      companyId: req.user.companyId
    })
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      notifications
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});
router.get("/notifications", auth, async (req, res) => {
  const today = new Date();

  const tasks = await Task.find({
    companyId: new mongoose.Types.ObjectId(req.user.companyId),
    dueDate: { $lte: today }
  });

  const leads = await Lead.find({
    companyId: new mongoose.Types.ObjectId(req.user.companyId),
    nextFollowUp: { $lte: today }
  });

  res.json({ success: true, tasks, leads });
});
// ================= UNREAD COUNT =================
router.get(
  "/notifications/unread-count",
  auth,
  async (req, res) => {

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

// ================= MARK AS READ =================
router.put(
  "/notifications/:id/read",
  auth,
  async (req, res) => {

    try {

      const notification =
        await Notification.findOneAndUpdate(

          {
            _id: req.params.id,
            companyId: req.user.companyId
          },

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
// ================= INVOICES =================
router.get("/invoices", auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({
      companyId: req.user.companyId
    })
    .populate("lead", "name email phone")
    .sort({ createdAt: -1 });

    res.json({ success: true, invoices });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});
router.get("/invoices/:id/pdf", auth, async (req, res) => {
  try {

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      companyId: new mongoose.Types.ObjectId(req.user.companyId)
    }).populate(
      "lead",
      "name email phone company"
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    generatePDF(invoice, res);

  } catch (err) {

    console.error("PDF ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});
router.post("/invoices", auth, async (req, res) => {
  try {
    const { invoiceNumber, lead, amount, dueDate } = req.body;

    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    if (!invoiceNumber || !lead || !amount) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(lead)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Lead ID"
      });
    }

    const leadData = await Lead.findOne({
      _id: lead,
      companyId: req.user.companyId
    });

    if (!leadData) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      lead,
      amount: Number(amount),
      dueDate: dueDate || null,
      user: req.body.user || req.user.id,
      companyId: req.user.companyId
    });

    res.json({ success: true, invoice });

  } catch (err) {
    console.error("INVOICE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
router.post("/invoices/:id/payment", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      companyId: new mongoose.Types.ObjectId(req.user.companyId)
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    if (!req.body.amount) {
      return res.status(400).json({
        success: false,
        message: "Amount required"
      });
    }

    invoice.payments.push(req.body);
    await invoice.save();

    res.json({ success: true, invoice });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/invoices/:id", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, companyId: new mongoose.Types.ObjectId(req.user.companyId) },
      req.body,
      { new: true }
    );

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete("/invoices/:id", auth, async (req, res) => {
  try {
    await Invoice.deleteOne({
      _id: req.params.id,
      companyId: new mongoose.Types.ObjectId(req.user.companyId)
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
// ================= RAZORPAY =================
router.post("/payment/create-order", auth, async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: req.body.amount * 100,
      currency: "INR"
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/payment/verify", auth, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(sign)
    .digest("hex");

  if (expected === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});


// ================= AI =================
router.post("/ai/chat", auth, async (req, res) => {
  const { message } = req.body;
  res.json({ success: true, reply: `AI Reply: ${message}` });
});

// ================= SETTINGS =================
router.get("/settings", auth, async (req, res) => {
  let settings = await Settings.findOne({ user: req.user.id });
  if (!settings) settings = await Settings.create({ user: req.user.id });
  res.json({ success: true, settings });
});

router.put("/settings", auth, async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true, upsert: true }
  );
  res.json({ success: true, settings });
});
// ================= BACKUP =================
router.get("/backup", auth, async (req, res) => {
  try {
    const mongoose = require("mongoose");

const leads = await Lead.find({
  companyId: new mongoose.Types.ObjectId(req.user.companyId)
});
    const tasks = await Task.find({ companyId: new mongoose.Types.ObjectId(req.user.companyId) });

    res.json({ success: true, leads, tasks });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});
// ================= START =================
app.use("/api", router);
// ================= GLOBAL ERROR HANDLER IMPROVE =================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});
server.listen(process.env.PORT || 5000, () => {
  console.log("🚀 FULL CRM SERVER RUNNING");
});