const express =
require("express");

const router =
express.Router();

const Leave =
require("../models/Leave");

// ================= GET =================

router.get(
  "/",
  async (req, res) => {

    try {

      const leaves =
        await Leave.find({
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
        leaves
      });

    } catch (err) {

      res.status(500).json({
        success: false
      });

    }

});

// ================= APPLY =================

router.post(
  "/",
  async (req, res) => {

    try {

      const leave =
        await Leave.create({

          employee:
            req.body.employee,

          reason:
            req.body.reason,

          fromDate:
            req.body.fromDate,

          toDate:
            req.body.toDate,

          companyId:
            req.user.companyId

        });

      res.json({
        success: true,
        leave
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

      const leave =
        await Leave.findByIdAndUpdate(

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
        leave
      });

    } catch (err) {

      res.status(500).json({
        success: false
      });

    }

});

module.exports =
router;