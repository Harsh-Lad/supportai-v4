import mongoose, { Schema, models } from 'mongoose'

const UsageLogSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  month: { type: String, required: true }, // Format: "2024-01"
  conversations: { type: Number, default: 0 },
  messages: { type: Number, default: 0 },
  tokensUsed: { type: Number, default: 0 },
  documentsUploaded: { type: Number, default: 0 },
  emailsProcessed: { type: Number, default: 0 },
}, { timestamps: true })

UsageLogSchema.index({ organizationId: 1, month: 1 }, { unique: true })
UsageLogSchema.index({ organizationId: 1 })

export default models.UsageLog || mongoose.model('UsageLog', UsageLogSchema)
