const express = require("express");
const router = express.Router();

const Company = require("../models/Company");

// ================= CREATE COMPANY =================

router.post("/", async (req, res) => {
try {

const {
  name,
  email,
  phone,
  address,
  plan
} = req.body;

if (!name) {
  return res.status(400).json({
    success: false,
    message: "Company name required"
  });
}

const company = await Company.create({
  name,
  email,
  phone,
  address,
  plan: plan || "Free"
});

res.json({
  success: true,
  company
});


} catch (err) {


console.error(err);

res.status(500).json({
  success: false,
  message: err.message
});


}
});

// ================= GET ALL =================

router.get("/", async (req, res) => {

try {


const companies =
  await Company.find()
  .populate("owner");

res.json({
  success: true,
  companies
});


} catch (err) {


res.status(500).json({
  success: false,
  message: err.message
});


}

});

module.exports = router;
