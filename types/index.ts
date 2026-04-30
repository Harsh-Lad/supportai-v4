export interface IUser {
  _id: string
  name: string
  email: string
  password: string
  organizationId: string
  role: 'admin' | 'agent' | 'viewer'
  createdAt: Date
}

export interface IOrganization {
  _id: string
  name: string
  slug: string
  settings: {
    maxRetries: number          // retries before human handoff
    welcomeMessage: string
    widgetColor: string
    widgetPosition: 'bottom-right' | 'bottom-left'
    enableVoice: boolean
    enableEmail: boolean
  }
  createdAt: Date
}

export interface IDocument {
  _id: string
  organizationId: string
  name: string
  originalName: string
  type: 'pdf' | 'docx' | 'txt' | 'md'
  content: string              // extracted text content
  chunks: IChunk[]             // text chunks for RAG
  status: 'processing' | 'ready' | 'error'
  uploadedBy: string
  createdAt: Date
}

export interface IChunk {
  id: string
  text: string
  documentId: string
  tfidfVector?: number[]       // stored TF-IDF vector for similarity search
}

export interface IConversation {
  _id: string
  organizationId: string
  channel: 'chat' | 'voice' | 'email'
  customerName: string
  customerEmail?: string
  status: 'active' | 'resolved' | 'escalated'
  retryCount: number
  messages: IMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface IMessage {
  _id: string
  role: 'customer' | 'ai' | 'agent'
  content: string
  sources?: string[]           // document names used for response
  confidence?: number          // RAG confidence score
  helpful?: boolean | null     // customer feedback
  createdAt: Date
}

export interface ITicket {
  _id: string
  organizationId: string
  conversationId: string
  assignedTo?: string
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  reason: string
  customerName: string
  createdAt: Date
  updatedAt: Date
}
