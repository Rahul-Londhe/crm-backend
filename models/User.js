const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

name: {
type: String,
required: true,
trim: true
},

email: {
type: String,
required: true,
unique: true,
lowercase: true,
trim: true
},
username: {
  type: String,
  unique: true,
  trim: true
},
password: {
type: String,
required: true
},

role: {
type: String,
enum: [
"admin",
"hr",
"manager",
"employee"
],
default: "employee"
},

companyId: {
type: mongoose.Schema.Types.ObjectId,
ref: "Company",
required: true
},

phone: {
type: String,
default: ""
},

avatar: {
type: String,
default: ""
},

isActive: {
type: Boolean,
default: true
},

lastLogin: {
type: Date,
default: null
},

darkMode: {
type: Boolean,
default: false
},

department: {
type: String,
default: "General"
}

}, {
timestamps: true
});

// Password Hash
userSchema.pre("save", async function(next) {

if (!this.isModified("password")) {
return next();
}

this.password = await bcrypt.hash(
this.password,
10
);

next();

});

// Compare Password
userSchema.methods.comparePassword =
async function(password) {

return await bcrypt.compare(
password,
this.password
);

};

// Hide Password
userSchema.methods.toJSON =
function() {

const obj = this.toObject();

delete obj.password;
delete obj.__v;

return obj;

};

module.exports =
mongoose.models.User ||
mongoose.model(
"User",
userSchema
);
