import mongoose, { Schema, models } from 'mongoose'

const InviteSchema = new Schema({
  email: { type: String, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  role: { type: String, enum: ['admin', 'agent', 'viewer'], default: 'agent' },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  token: { type: String, unique: true, required: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
}, { timestamps: true })

InviteSchema.index({ organizationId: 1 })
// token index already created by `unique: true` on the field
InviteSchema.index({ expiresAt: 1 })

export default models.Invite || mongoose.model('Invite', InviteSchema)
