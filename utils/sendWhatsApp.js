const express = require("express")
const router = express.Router()
const twilio = require("twilio")

const client = twilio(
process.env.TWILIO_SID,
process.env.TWILIO_AUTH_TOKEN
)

router.post("/", async (req,res)=>{

try{

const {phone,message} = req.body

if(!phone || !message){

return res.status(400).json({
success:false,
message:"Phone and message required"
})

}

await client.messages.create({

from: process.env.TWILIO_WHATSAPP_NUMBER,

to: `whatsapp:+${phone}`,

body: message

})

res.json({
success:true,
message:"WhatsApp sent successfully"
})

}catch(err){

console.log(err)

res.status(500).json({
success:false,
error:err.message
})

}

})

module.exports = router