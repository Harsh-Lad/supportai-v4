import mongoose, { Schema, models } from 'mongoose'

const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  razorpayCustomerId: { type: String },
  razorpaySubscriptionId: { type: String },
  allowedDomains: [{ type: String }],
  customPrompt: { type: String, default: '' },
  settings: {
    maxRetries: { type: Number, default: 3 },
    welcomeMessage: { type: String, default: 'Hi! How can I help you today?' },
    widgetColor: { type: String, default: '#6366f1' },
    widgetPosition: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
    enableEmail: { type: Boolean, default: false },
  },
  // BYOK AI Provider configuration
  aiProvider: {
    provider: { type: String, enum: ['groq', 'openai', 'claude', 'gemini', 'openrouter', 'none'], default: 'none' },
    apiKey: { type: String, default: '' },
    model: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
  },
  // Email channel configuration
  emailChannel: {
    enabled: { type: Boolean, default: false },
    method: { type: String, enum: ['webhook', 'imap', 'forwarding', 'none'], default: 'none' },
    // Webhook settings
    webhookSecret: { type: String, default: '' },
    // IMAP settings
    imapHost: { type: String, default: '' },
    imapPort: { type: Number, default: 993 },
    imapUser: { type: String, default: '' },
    imapPassword: { type: String, default: '' },
    imapTls: { type: Boolean, default: true },
    // Forwarding address (generated)
    forwardingAddress: { type: String, default: '' },
    // Reply-from address
    replyFromName: { type: String, default: 'Support' },
    replyFromEmail: { type: String, default: '' },
    notifyOnEscalation: { type: Boolean, default: true },
  },
}, { timestamps: true })

export default models.Organization || mongoose.model('Organization', OrganizationSchema)
