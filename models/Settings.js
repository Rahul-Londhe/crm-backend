const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
{
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  companyName: {
    type: String,
    default: ""
  },

  companyEmail: {
    type: String,
    default: ""
  },

  companyPhone: {
    type: String,
    default: ""
  },

  whatsappNumber: {
    type: String,
    default: ""
  },

  smtpEmail: {
    type: String,
    default: ""
  },

  smtpPassword: {
    type: String,
    default: ""
  },

  logo: {
    type: String,
    default: ""
  },

  whatsappAuto: {
    type: Boolean,
    default: true
  },

  emailAuto: {
    type: Boolean,
    default: false
  },

  autoFollowupEnabled: {
    type: Boolean,
    default: true
  },

  // ==========================
  // WhatsApp Templates
  // ==========================

  hotLeadWhatsappTemplate: {
    type: String,
    default:
`Hello {{name}},

Thank you for your interest.

Company: {{company}}
Mobile: {{phone}}
Email: {{email}}

Our team will contact you shortly.

Regards,
{{company}}`
  },

  warmLeadWhatsappTemplate: {
    type: String,
    default:
`Hello {{name}},

Thank you for connecting with us.

Company: {{company}}
Mobile: {{phone}}
Email: {{email}}

Regards,
{{company}}`
  },

  // ==========================
  // Email Templates
  // ==========================

  coldLeadEmailSubject: {
    type: String,
    default: "Thank You For Contacting Us"
  },

  coldLeadEmailTemplate: {
    type: String,
    default:
`Hello {{name}},

Thank you for contacting us.

Company: {{company}}
Mobile: {{phone}}
Email: {{email}}

Our team will get back to you shortly.

Regards,
{{company}}`
  }
},
{
  timestamps: true
}
);

module.exports =
mongoose.models.Settings ||
mongoose.model("Settings", settingsSchema);