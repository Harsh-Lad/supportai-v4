import mongoose, { Schema, models } from 'mongoose'

const TicketSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  reason: { type: String, default: 'Customer requested human support after multiple attempts' },
  customerName: { type: String, default: 'Anonymous' },
  customerEmail: { type: String, default: '' },
  channel: { type: String, enum: ['chat', 'voice', 'email'], default: 'chat' },
}, { timestamps: true })

TicketSchema.index({ organizationId: 1, status: 1 })
TicketSchema.index({ organizationId: 1, createdAt: -1 })

export default models.Ticket || mongoose.model('Ticket', TicketSchema)
