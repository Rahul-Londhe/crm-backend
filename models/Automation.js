const mongoose = require("mongoose");

const automationSchema =
new mongoose.Schema({

companyId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Company",
required:true
},

name:{
type:String,
required:true
},

trigger:{
type:String,
required:true
},

action:{
type:String,
required:true
},

active:{
type:Boolean,
default:true
},

createdBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}

},{
timestamps:true
});

module.exports =
mongoose.model(
"Automation",
automationSchema
);