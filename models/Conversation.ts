import mongoose, { Schema, models } from 'mongoose'

const MessageSchema = new Schema({
  role: { type: String, enum: ['customer', 'ai', 'agent'], required: true },
  content: { type: String, required: true },
  sources: [String],
  confidence: Number,
  helpful: { type: Boolean, default: null },
}, { timestamps: true })

const ConversationSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  channel: { type: String, enum: ['chat', 'voice', 'email','playground'], default: 'chat' },
  customerName: { type: String, default: 'Anonymous' },
  customerEmail: String,
  status: { type: String, enum: ['active', 'resolved', 'escalated'], default: 'active' },
  retryCount: { type: Number, default: 0 },
  messages: [MessageSchema],
}, { timestamps: true })

ConversationSchema.index({ organizationId: 1, status: 1 })

export default models.Conversation || mongoose.model('Conversation', ConversationSchema)
