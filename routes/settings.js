const express = require("express");
const router = express.Router();

const Settings =
require("../models/Settings");

const auth =
require("../middleware/auth");

router.get("/", auth, async (req, res) => {

try {

let settings =
await Settings.findOne({
companyId: req.user.companyId
});

if (!settings) {

settings =
await Settings.create({

companyId:
req.user.companyId

});

}

res.json({
success: true,
settings
});

} catch (err) {

console.log(err);

res.status(500).json({
success: false
});

}

});

router.put("/", auth, async (req, res) => {

try {

let settings =
await Settings.findOne({
companyId: req.user.companyId
});

if (!settings) {

settings =
await Settings.create({
companyId:
req.user.companyId
});

}

Object.assign(
settings,
req.body
);

await settings.save();

res.json({
success: true,
settings
});

} catch (err) {

console.log(err);

res.status(500).json({
success: false
});

}

});

module.exports = router;