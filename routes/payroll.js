const express =
require("express");

const router =
express.Router();

const Payroll =
require("../models/Payroll");

// ================= GET =================

router.get(
  "/",
  async (req, res) => {

    try {

      const payrolls =
        await Payroll.find({
          companyId:
            req.user.companyId
        })
        .populate(
          "employee",
          "name email"
        )
        .sort({
          createdAt: -1
        });

      res.json({
        success: true,
        payrolls
      });

    } catch (err) {

      res.status(500).json({
        success: false
      });

    }

});

// ================= CREATE =================

router.post(
  "/",
  async (req, res) => {

    try {

      const finalSalary =

        Number(
          req.body.basicSalary || 0
        )

        +

        Number(
          req.body.bonus || 0
        )

        -

        Number(
          req.body.deduction || 0
        );

      const payroll =
        await Payroll.create({

          employee:
            req.body.employee,

          month:
            req.body.month,

          basicSalary:
            req.body.basicSalary,

          bonus:
            req.body.bonus,

          deduction:
            req.body.deduction,

          finalSalary,

          companyId:
            req.user.companyId

        });

      res.json({
        success: true,
        payroll
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

});

// ================= STATUS =================

router.put(
  "/:id",
  async (req, res) => {

    try {

      const payroll =
        await Payroll.findByIdAndUpdate(

          req.params.id,

          {
            status:
              req.body.status
          },

          {
            new: true
          }

        );

      res.json({
        success: true,
        payroll
      });

    } catch (err) {

      res.status(500).json({
        success: false
      });

    }

});

module.exports =
router;