/**
 * RAG Engine — OpenAI Embeddings (text-embedding-3-small)
 * Uses OpenAI embedding API for document vectorization and semantic search.
 * Requires OPENAI_API_KEY env var.
 */

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_API = 'https://api.openai.com/v1/embeddings'

// ── Text Chunking ──────────────────────────────────────────────────
export function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const sentences = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      // Keep overlap by taking the last few words
      const words = currentChunk.split(' ')
      const overlapWords = words.slice(-Math.floor(overlap / 5))
      currentChunk = overlapWords.join(' ') + ' ' + sentence
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter(c => c.length > 20)
}

// ── OpenAI Embeddings ─────────────────────────────────────────────
function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set. Required for embeddings.')
  }
  return key
}

async function callOpenAIEmbeddings(input: string | string[]): Promise<number[][]> {
  const apiKey = getOpenAIKey()

  const res = await fetch(EMBEDDING_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return (data.data || []).map((d: { embedding: number[] }) => d.embedding)
}

/**
 * Generate embedding for a single text using OpenAI text-embedding-3-small.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await callOpenAIEmbeddings(text)
  return embedding || []
}

/**
 * Generate embedding for a query (same model as documents — cosine compares apples to apples).
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  return generateEmbedding(text)
}

/**
 * Batch embed multiple texts. OpenAI supports array input natively, so we
 * send them in one request per batch instead of N parallel calls.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = []

  // OpenAI accepts up to 2048 inputs per request; keep batches modest to bound payload size.
  const BATCH_SIZE = 64
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const results = await callOpenAIEmbeddings(batch)
    embeddings.push(...results)
  }

  return embeddings
}

// ── Cosine Similarity ──────────────────────────────────────────────
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

// ── Search & Retrieve ──────────────────────────────────────────────
export interface SearchResult {
  text: string
  score: number
  documentId: string
  documentName: string
  chunkId: string
}

/**
 * Search chunks using embedding similarity.
 * Expects chunks to already have embedding vectors stored.
 */
export async function searchChunks(
  query: string,
  chunks: Array<{ id: string; text: string; documentId: string; documentName: string; embedding?: number[] }>,
  topK = 5
): Promise<SearchResult[]> {
  // Get query embedding
  const queryEmbedding = await generateQueryEmbedding(query)

  // Score all chunks that have embeddings
  const scored = chunks
    .filter(c => c.embedding && c.embedding.length > 0)
    .map(chunk => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding!),
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      chunkId: chunk.id,
    }))
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, topK)
}

// ── Response Generation (template fallback) ────────────────────────
export function generateResponse(query: string, results: SearchResult[]): {
  response: string
  confidence: number
  sources: string[]
} {
  if (results.length === 0 || results[0].score < 0.3) {
    return {
      response: "I'm sorry, I couldn't find relevant information in our knowledge base to answer your question. Would you like me to connect you with a human agent?",
      confidence: 0,
      sources: [],
    }
  }

  const topScore = results[0].score
  const relevantResults = results.filter(r => r.score > 0.3)

  const context = relevantResults
    .map(r => r.text)
    .join('\n\n')

  const confidence = Math.min(topScore, 1)

  let response: string

  if (confidence > 0.7) {
    response = `Based on our documentation, here's what I found:\n\n${context}\n\nIs there anything else I can help you with?`
  } else if (confidence > 0.5) {
    response = `I found some potentially relevant information:\n\n${context}\n\nThis might not fully answer your question. Would you like me to search for something more specific, or would you prefer to speak with a human agent?`
  } else {
    response = `I found some related information, but I'm not very confident it addresses your question directly:\n\n${context}\n\nWould you like to be connected with a human agent for more accurate help?`
  }

  return {
    response,
    confidence,
    sources: [...new Set(relevantResults.map(r => r.documentName))],
  }
}
