// ================= BASIC =================
require("dotenv").config();
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
const helmet = require("helmet");
const compression = require("compression");
//const mongoSanitize = require("express-mongo-sanitize");
const admin = require("./middleware/admin");
const allowRoles = require("./middleware/roles");
const app = express();
app.set("trust proxy", 1);
const notificationRoutes =
require("./routes/notification");
const followupRoutes =
require("./routes/followupRoutes");
const generatePDF = require("./utils/generateInvoice");
const http = require("http");
const server = http.createServer(app);
const auth = require("./middleware/auth");

const { initSocket, getIO } = require("./socket");


// ================= MIDDLEWARE =================

app.use(helmet());

app.use(compression());

//app.use(mongoSanitize());



app.use(express.json());
const allowedOrigins = [
  "http://localhost:8080",
  "https://easygoing-caring-production-9f2c.up.railway.app"
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
};
app.use(cors(corsOptions));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 1000,                // 1000 requests
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later."
    }
  })
);
const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);
const loginLimiter =
rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,

  message: {
    success: false,
    message:
      "Too many login attempts. Try again after 15 minutes."
  }
});
// ================= ENV VALIDATION =================

if (!process.env.JWT_SECRET) {
  console.error(
    "JWT_SECRET Missing"
  );
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error(
    "MONGO_URI Missing"
  );
  process.exit(1);
}
// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("DB Error:", err.message);
    process.exit(1);
  });
initSocket(server);

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

    const io = getIO();

io.to(companyId.toString()).emit(
  "activity",
  {
    action,
    user,
    time: new Date()
  }
);

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

const notification =
await Notification.create({
user,
message,
type,
companyId
});

const io = getIO();

io.to(companyId.toString())
.emit(
"notification",
notification
);

} catch(err){
console.log(err.message);
}

};
// ================= AUTH =================

// ✅ AFTER AUTH ADD THIS
const leadsRoutes = require("./routes/leads");
// ================= FILE UPLOAD =================
const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  }
});
const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf"
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid File Type"));
    }
  }
});
app.use("/uploads", express.static(uploadPath));

// ✅ PREVIEW
app.get(
"/api/leads/file/:filename",
auth,
(req,res)=>{
  const filename =
path.basename(req.params.filename);

const filePath =
path.join(uploadPath, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.sendFile(filePath);
});

// ✅ DOWNLOAD
app.get(
"/api/leads/file/:filename/download",
auth,
(req,res)=>{
  const filename =
path.basename(req.params.filename);

const filePath =
path.join(uploadPath, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.download(filePath);
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
auth,
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

app.use(
"/api/notifications",
auth,
notificationRoutes
);

app.use(
"/api/followups",
auth,
followupRoutes
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
router.get("/test-whatsapp", async (req,res)=>{

const result =
await sendWhatsAppMessage(
"7020382130",
"CRM Test Message"
);

res.json(result);

});
// ================= EMAIL =================
const sendEmail = require("./services/emailService");

router.post("/email/send", auth, async (req, res) => {
  try {

    const { email, subject, message } = req.body;

    const company =
      await Company.findById(
        req.user.companyId
      );

    const finalMessage = `

${company.name}

${message}

------------------------

Contact Number:
${company.phone}

Email:
${company.email}

Thank You

${company.name}

`;

    const success =
await sendEmail(
 email,
 subject,
 finalMessage,
 company.email
);

    if (success) {

      return res.json({
        success: true,
        message: "Email Sent"
      });

    }

    return res.status(500).json({
      success: false,
      message: "Email Failed"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});
router.get("/test-email", async (req, res) => {

  console.log("TEST EMAIL START");

  const result = await sendEmail(
    "rahulanillondhe@gmail.com",
    "CRM Test",
    "Email Working"
  );

  console.log("TEST EMAIL RESULT:", result);

  res.json({
    success: result
  });

});
// ================= AUTH =================
router.post(
"/auth/register",
upload.single("logo"),
async (req, res) => {

try {
console.log(
"REGISTER BODY:",
req.body
);
const {
name,
email,
password,
username,
companyName,
phone,
businessType
} = req.body;
if(
!name ||
!email ||
!password ||
!companyName
){
return res.status(400).json({
success:false,
message:"All fields required"
});
}

const existingUser =
await User.findOne({
email: email.toLowerCase().trim()
});

if(existingUser){
return res.status(400).json({
success:false,
message:"User already exists"
});
}

const company =
await Company.create({
name: companyName,
logo: req.file
? req.file.filename
: ""
});
console.log(
"COMPANY CREATED:",
company
);
const user =
await User.create({
name,
email,
username,
password,
role: "admin",
companyId: company._id
});

company.owner = user._id;

await company.save();

const token =
jwt.sign(
{
id:user._id,
name:user.name,
companyId:company._id,
role:user.role
},
process.env.JWT_SECRET,
{
expiresIn:"7d"
}
);

return res.status(201).json({
success:true,
token,
user,
company
});

}
catch(err){

console.log(
"REGISTER ERROR:",
err
);

return res.status(500).json({
success:false,
message:err.message
});

}

}
);

router.post(
  "/auth/login",
  loginLimiter,
  async (req, res) => {

    try {

      let { email, password } = req.body;

      console.log("=================================");
      console.log("LOGIN REQUEST RECEIVED");
      console.log("EMAIL FROM FRONTEND:", email);
      console.log("PASSWORD ENTERED:", password);
      console.log("=================================");

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and Password required"
        });
      }

      email = email.toLowerCase().trim();

      console.log("EMAIL AFTER FORMAT:", email);

      const user = await User.findOne({ email });

      console.log("USER FOUND:", user);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found"
        });
      }

      console.log("HASH FROM DB:", user.password);

      const match = await bcrypt.compare(
        password,
        user.password
      );

      console.log("MATCH RESULT:", match);

      if (!match) {
        return res.status(400).json({
          success: false,
          message: "Wrong password"
        });
      }

      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          companyId: user.companyId.toString(),
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      console.log("LOGIN SUCCESS");

      return res.status(200).json({
        success: true,
        token,
        user
      });

    } catch (err) {

      console.log("LOGIN ERROR:", err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);
// ================= USERS =================

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
auth,
admin,
async (req,res)=>{

 const user =
 await User.findOneAndUpdate(
 {
   _id:req.params.id,
   companyId:req.user.companyId
 },
 {
   role:"admin"
 },
 {
   new:true
 }
 );

 if(!user){
   return res.status(404).json({
     success:false,
     message:"User not found"
   });
 }

 res.json({
   success:true,
   user
 });

});
router.get(
  "/users",
  auth,
  async (req, res) => {

    try {

      const users =
      await User.find({
        companyId:
        req.user.companyId
      })
      .select(
        "name email role"
      );

      res.json({
        success: true,
        users
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);
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
console.log("COMPANY API HIT");
  console.log("BODY:", req.body);

      const {
name,
email,
phone,
businessType,
username,
password
} = req.body;
if(password.length < 8){
return res.status(400).json({
success:false,
message:
"Password must be minimum 8 characters"
});
}
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
     const emailExist =
await User.findOne({
email
});

if(emailExist){
return res.status(400).json({
success:false,
message:"Email already exists"
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

  try {

    const company =
      await Company.findById(
        req.user.companyId
      );

    res.json({
      success: true,
      company
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

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

  user:
    req.body.user ||
    req.body.assignedTo ||
    req.user.id,

  companyId: req.user.companyId
});

// ACTIVITY
await logActivity(
  "Task Created: " + task.title,
  req.user.name || "Unknown User",
  req.user.companyId
);
await createNotification(
  req.user.id,
  "New Task Created: " + task.title,
  "task",
  req.user.companyId
);

// Assigned User Notification

if (task.user) {

  await createNotification(
    task.user,
    `Task Assigned: ${task.title}`,
    "task",
    req.user.companyId
  );

}
// SOCKET
const io = getIO();

const populatedTask =
await Task.findById(task._id)
.populate("user", "name email")
.populate("lead", "name");

io.to(
  req.user.companyId.toString()
).emit(
  "taskCreated",
  populatedTask
);

res.status(201).json({
  success: true,
  task
});

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
  req.user._id,
  "Task Updated: " + task.title,
  "task",
  req.user.companyId
);
  const io = getIO();

io.to(
  req.user.companyId.toString()
).emit(
  "taskUpdated",
  task
);
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

    task.status =
task.status === "Completed"
? "Pending"
: "Completed";

    await task.save();

    await logActivity(
      "Task Completed: " + task.title,
      req.user.name || "Unknown User",
      req.user.companyId
    );
const io = getIO();
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

  const io = getIO();

  io.to(
    req.user.companyId.toString()
  ).emit(
    "taskDeleted",
    task._id
  );
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

    const filePath =
`./leads-${Date.now()}.xlsx`;
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

// ================= MARK AS READ =================

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

  try {

    let settings =
    await Settings.findOne({
      companyId: req.user.companyId
    });

    if (!settings) {

      settings =
      await Settings.create({

        companyId:
        req.user.companyId,

        companyName: "",

        companyEmail: "",

        companyPhone: "",

        whatsappNumber: ""

      });

    }

    res.json({
      success: true,
      settings
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

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
// ================= ACTIVITY CLEANUP =================

setInterval(async () => {

try {

const ninetyDaysAgo =
new Date();

ninetyDaysAgo.setDate(
ninetyDaysAgo.getDate() - 90
);

await Activity.deleteMany({
createdAt: {
$lt: ninetyDaysAgo
}
});

console.log(
"Old Activity Logs Deleted"
);

} catch(err){

console.log(
"Activity Cleanup Error:",
err.message
);

}

}, 24 * 60 * 60 * 1000);
server.listen(process.env.PORT || 5000, () => {
  console.log("🚀 FULL CRM SERVER RUNNING");
});