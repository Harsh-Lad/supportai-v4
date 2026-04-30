/**
 * RAG Engine — Google Embeddings (gemini-embedding-001)
 * Uses Gemini embedding API for document vectorization and semantic search.
 * Requires GEMINI_API_KEY env var.
 */

const EMBEDDING_MODEL = 'gemini-embedding-001'
const EMBEDDING_API = 'https://generativelanguage.googleapis.com/v1beta'

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

// ── Google Embeddings ─────────────────────────────────────────────
function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set. Required for embeddings.')
  }
  return key
}

/**
 * Generate embedding for a single text using Google gemini-embedding-001.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getGeminiKey()
  const url = `${EMBEDDING_API}/models/${EMBEDDING_MODEL}:embedContent`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.embedding?.values || []
}

/**
 * Generate embedding for a query (uses RETRIEVAL_QUERY task type for better results).
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = getGeminiKey()
  const url = `${EMBEDDING_API}/models/${EMBEDDING_MODEL}:embedContent`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.embedding?.values || []
}

/**
 * Batch embed multiple texts (calls sequentially to respect rate limits).
 * Returns array of embedding vectors in the same order.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = []

  // Process in batches of 5 to avoid rate limits
  const BATCH_SIZE = 5
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(t => generateEmbedding(t)))
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
