const express = require("express");
const router = express.Router();
const axios = require("axios");

// Import Lead Model
const Lead = require("../models/Lead");

// ------------------
// Meta Webhook Verify
// ------------------

router.get("/webhook", (req,res)=>{

const VERIFY_TOKEN = "crm_verify_token";

const mode = req.query["hub.mode"];
const token = req.query["hub.verify_token"];
const challenge = req.query["hub.challenge"];

if(mode && token){

if(mode === "subscribe" && token === VERIFY_TOKEN){

console.log("Webhook verified");

res.status(200).send(challenge);

}else{

res.sendStatus(403);

}

}

});


// ------------------
// Receive Lead Data
// ------------------

router.post("/webhook", async(req,res)=>{

try{

const entry = req.body.entry;

if(!entry){
return res.status(200).send("No entry");
}

for(const item of entry){

const changes = item.changes;

if(!changes) continue;

for(const change of changes){

if(change.field === "leadgen"){

const leadgen_id = change.value.leadgen_id;

const access_token = process.env.META_ACCESS_TOKEN;

const url = `https://graph.facebook.com/v18.0/${leadgen_id}?access_token=${access_token}`;

const response = await axios.get(url);

const data = response.data;

let name = "";
let email = "";
let phone = "";

data.field_data.forEach(field=>{

if(field.name === "full_name"){
name = field.values[0];
}

if(field.name === "email"){
email = field.values[0];
}

if(field.name === "phone_number"){
phone = field.values[0];
}

});

// Save Lead in MongoDB
const newLead = new Lead({
name:name || "Facebook Lead",
email:email || "",
phone:phone || "",
status:"New",
stage:"New",
source:"Facebook",
note:"Facebook / Instagram Lead"
});

await newLead.save();

console.log("New Meta Lead Saved");

}

}

}

res.status(200).send("EVENT_RECEIVED");

}catch(err){

console.log("Webhook error:",err);

res.sendStatus(500);

}

});

module.exports = router;