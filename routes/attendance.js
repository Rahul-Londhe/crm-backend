const express = require("express");
const router = express.Router();

const Attendance =
require("../models/Attendance");

// ================= GET =================

router.get("/", async (req, res) => {

  try {

    const data =
      await Attendance.find({
        companyId: req.user.companyId
      })
      .populate("employee", "name");

    res.json({
      success: true,
      attendance: data
    });

  } catch (err) {

    res.status(500).json({
      success: false
    });

  }

});

// ================= CHECK IN =================

router.post("/checkin", async (req, res) => {

  try {

    const today =
      new Date().toISOString().split("T")[0];

    const exists =
      await Attendance.findOne({

        employee: req.body.employeeId,
        date: today

      });

    if (exists) {

      return res.json({
        success: false,
        message: "Already Checked In"
      });

    }

    const attendance =
      await Attendance.create({

        employee: req.body.employeeId,

        companyId:
          req.user.companyId,

        date: today,

        checkIn:
          new Date().toLocaleTimeString(),

        status: "Present"

      });

    res.json({
      success: true,
      attendance
    });

  } catch (err) {

    res.status(500).json({
      success: false
    });

  }

});

// ================= CHECK OUT =================

router.put("/checkout/:id", async (req, res) => {

  try {

    const attendance =
      await Attendance.findByIdAndUpdate(

        req.params.id,

        {
          checkOut:
            new Date().toLocaleTimeString()
        },

        { new: true }

      );

    res.json({
      success: true,
      attendance
    });

  } catch (err) {

    res.status(500).json({
      success: false
    });

  }

});

module.exports = router;