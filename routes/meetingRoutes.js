const express = require("express");

const router = express.Router();

const Meeting =
require("../models/Meeting");

const auth = require("../middleware/auth");

// ================= CREATE =================


router.post("/", auth, async (req,res)=>{

try{

const meeting =
await Meeting.create({

title: req.body.title,

client: req.body.client,

notes: req.body.notes,

start: req.body.start,

end: req.body.end,

companyId: req.user.companyId,

createdBy: req.user.id

});

res.json({
success:true,
meeting
});

}
catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

});

// ================= GET =================

router.get("/", auth, async (req,res)=>{

try{

const meetings =
await Meeting.find({

companyId:
req.user.companyId

})
.populate(
"createdBy",
"name email"
)
.sort({
createdAt:-1
});

res.json({
success:true,
meetings
});

}
catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

});
router.put("/:id", auth, async (req,res)=>{

try{

const meeting =
await Meeting.findOneAndUpdate(

{
_id:req.params.id,
companyId:req.user.companyId
},

req.body,

{
new:true
}

);

res.json({
success:true,
meeting
});

}
catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

});
// ================= DELETE =================

router.delete(
"/:id",
auth,
async (req,res)=>{

try{

await Meeting.findOneAndDelete({

_id:req.params.id,

companyId:
req.user.companyId

});

res.json({
success:true
});

}
catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

});

module.exports = router;
