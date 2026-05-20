const express = require("express");
const router = express.Router();

const Employee = require("../models/Employee");

// ================= GET =================

router.get("/", async (req, res) => {

  try {

    const employees =
      await Employee.find({
        companyId: req.user.companyId
      });

    res.json({
      success: true,
      employees
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ================= CREATE =================

router.post("/", async (req, res) => {

  try {

    console.log("BODY:", req.body);

    const {
      name,
      email,
      phone,
      role
    } = req.body;

    if (!name || !email) {

      return res.status(400).json({
        success: false,
        message: "Name and Email Required"
      });

    }

    const employee =
      await Employee.create({

        name,
        email,
        phone,
        role,

        companyId:
          req.user.companyId

      });

    res.json({
      success: true,
      employee
    });

  } catch (err) {

    console.log("EMPLOYEE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ================= DELETE =================

router.delete("/:id", async (req, res) => {

  try {

    await Employee.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      success: false
    });

  }

});

module.exports = router;