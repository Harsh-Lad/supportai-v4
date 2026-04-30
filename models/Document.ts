import mongoose, { Schema, models } from 'mongoose'

const ChunkSchema = new Schema({
  text: { type: String, required: true },
  documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
  embedding: [Number],
  tfidfVector: [Number], // legacy, kept for backward compat
})

const DocumentSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'docx', 'txt', 'md'], required: true },
  content: { type: String, default: '' },
  chunks: [ChunkSchema],
  status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
  processingStage: { type: String, enum: ['uploading', 'extracting', 'chunking', 'embedding', 'done', 'error'], default: 'uploading' },
  processingProgress: { type: Number, default: 0 }, // 0-100
  totalChunks: { type: Number, default: 0 },
  processedChunks: { type: Number, default: 0 },
  errorMessage: { type: String, default: '' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

DocumentSchema.index({ organizationId: 1 })

export default models.Document || mongoose.model('Document', DocumentSchema)
