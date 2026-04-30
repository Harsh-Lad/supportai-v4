# SupportAI - AI-Powered Customer Support SaaS

A multi-tenant B2B customer support platform that uses RAG (Retrieval-Augmented Generation) to answer customer questions from your documentation. Built with Next.js, MongoDB, and shadcn/ui.

## Features

- **Document-based RAG** — Upload PDFs, DOCX, TXT, or MD files. The AI chunks and indexes them using TF-IDF for zero-cost retrieval.
- **BYOK AI Provider** — Bring Your Own Key. Support for Groq (free), OpenAI, Claude, Gemini, and OpenRouter. Each tenant configures their own key.
- **Multi-channel support** — Chat widget, full voice calls (browser Speech API), and inbound email processing.
- **Human handoff** — Configurable retry threshold. After N unsatisfactory responses, conversations auto-escalate to human agents.
- **Unified ticket system** — Every interaction (chat, voice, email) creates a ticket with a full chat window view for agents.
- **Analytics dashboard** — Conversation trends, channel breakdown, AI resolution rate, confidence metrics, top document sources.
- **Super Admin panel** — Platform-level monitoring of all organizations, users, and activity.
- **Embeddable widget** — One-line embed code to add AI support to any website.
- **Email channel** — Webhook (SendGrid/Mailgun), IMAP polling, or manual forwarding options.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + shadcn/ui + Tailwind CSS |
| Database | MongoDB (Mongoose ODM) |
| Auth | NextAuth.js (credentials + JWT) |
| RAG Engine | Custom TF-IDF + cosine similarity (zero API cost) |
| AI Providers | Groq, OpenAI, Claude, Gemini, OpenRouter |
| Voice | Web Speech API (browser-native STT + TTS) |
| File Parsing | pdf-parse + mammoth |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or free MongoDB Atlas cluster)

### Setup

1. Clone and install:
   ```bash
   cd supportai
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   - `MONGODB_URI` — Your MongoDB connection string (free at [MongoDB Atlas](https://www.mongodb.com/atlas))
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and register.

### Quick Start

1. **Register** — Creates your account and organization.
2. **Upload docs** — Go to Documents, drag & drop your support PDFs/DOCX/TXT files.
3. **Configure AI** — Go to Settings → AI Provider, select Groq (free), paste your API key.
4. **Test the widget** — Go to Settings → Embed Code, copy your org ID, visit `/widget?orgId=YOUR_ID`.
5. **Set up email** — Go to Settings → Email, configure webhook or forwarding.
6. **Monitor** — Use Analytics for metrics and Tickets for managing escalations.

### Making a Super Admin

To access the platform-wide admin panel, update a user's role in MongoDB:

```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "super_admin" } }
)
```

Then visit `/admin` from the sidebar.

## Architecture

```
app/
  api/
    auth/           # NextAuth + registration
    chat/           # RAG + AI chat endpoint + feedback
    documents/      # Upload, process, delete docs
    email/          # Inbound webhook, IMAP poll, manual forward
    tickets/        # Ticket CRUD + agent replies
    conversations/  # Conversation history
    settings/       # Org settings (BYOK, email, widget)
    analytics/      # Platform analytics
    admin/          # Super admin data
    widget/         # Public widget config
  auth/             # Login & register pages
  dashboard/        # Admin dashboard
    analytics/      # Charts and metrics
    conversations/  # Conversation viewer
    documents/      # Document management
    settings/       # BYOK + email + widget config
    tickets/        # Unified ticket view with chat window
  admin/            # Super admin platform panel
  widget/           # Embeddable chat + voice widget
lib/
  ai-providers.ts   # Unified AI layer (Groq, OpenAI, Claude, Gemini, OpenRouter)
  auth.ts           # NextAuth configuration
  db.ts             # MongoDB connection
  email-processor.ts # Email → RAG → AI pipeline
  rag.ts            # TF-IDF engine (chunking, vectorize, search)
models/             # Mongoose schemas
```

## RAG + AI Pipeline

1. **Upload** → Text extracted from PDF/DOCX/TXT
2. **Chunk** → Split into ~500 char overlapping chunks
3. **Index** → TF-IDF vectors computed per chunk
4. **Query** → User question vectorized, cosine similarity search, top-K=5 retrieved
5. **Generate** → Top chunks passed as context to configured LLM (or template fallback)
6. **Feedback** → User rates response, retry count tracks toward handoff threshold
7. **Escalate** → After N failures, ticket created, agent notified

## Cost

The RAG layer is free. The AI response generation cost depends on the tenant's chosen provider:

| Provider | Free Tier? | Notes |
|----------|-----------|-------|
| Groq | Yes (generous) | Llama 3.1, Mixtral — fast and free |
| Gemini | Yes (limited) | Gemini Flash 1.5 |
| OpenRouter | Yes (some models) | Meta Llama free tier |
| OpenAI | No | Pay-per-token |
| Claude | No | Pay-per-token |

MongoDB Atlas free tier handles college project loads easily.

## License

MIT — Built as a college project.
