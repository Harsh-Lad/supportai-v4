import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Document from '@/models/Document'
import { chunkText, generateEmbedding } from '@/lib/rag'

// GET - list documents for current org
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const docs = await Document.find({
      organizationId: (session.user as any).organizationId,
    })
      .select('-chunks -content')
      .sort({ createdAt: -1 })

    return NextResponse.json(docs)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - upload and process a document
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).userId

    // Determine file type
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, DOCX, TXT, or MD.' }, { status: 400 })
    }

    await connectDB()

    // Create document record
    const doc = await Document.create({
      organizationId: orgId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      originalName: file.name,
      type: ext,
      status: 'processing',
      processingStage: 'extracting',
      processingProgress: 10,
      uploadedBy: userId,
    })

    // Return immediately with the doc ID so the UI can start polling
    // Process in the background using a non-blocking pattern
    const docId = doc._id

    // Extract text content based on file type
    let content = ''
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      await Document.findByIdAndUpdate(docId, {
        processingStage: 'extracting',
        processingProgress: 15,
      })

      if (ext === 'txt' || ext === 'md') {
        content = buffer.toString('utf-8')
      } else if (ext === 'pdf') {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)
        content = pdfData.text
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        content = result.value
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError)
      await Document.findByIdAndUpdate(docId, {
        status: 'error',
        processingStage: 'error',
        processingProgress: 0,
        errorMessage: 'Failed to parse file. Make sure the file is not corrupted.',
      })
      return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 })
    }

    if (!content.trim()) {
      await Document.findByIdAndUpdate(docId, {
        status: 'error',
        processingStage: 'error',
        processingProgress: 0,
        errorMessage: 'No text content found in the file.',
      })
      return NextResponse.json({ error: 'No text content found in file' }, { status: 400 })
    }

    // Chunking stage
    await Document.findByIdAndUpdate(docId, {
      processingStage: 'chunking',
      processingProgress: 25,
    })

    const textChunks = chunkText(content)

    await Document.findByIdAndUpdate(docId, {
      processingStage: 'embedding',
      processingProgress: 30,
      totalChunks: textChunks.length,
      processedChunks: 0,
    })

    // Generate embeddings one batch at a time with progress updates
    const BATCH_SIZE = 5
    const allEmbeddings: number[][] = []

    for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
      const batch = textChunks.slice(i, i + BATCH_SIZE)

      try {
        const batchEmbeddings = await Promise.all(
          batch.map(text => generateEmbedding(text))
        )
        allEmbeddings.push(...batchEmbeddings)
      } catch (embError: any) {
        console.error(`Embedding error at chunk ${i}:`, embError.message)
        await Document.findByIdAndUpdate(docId, {
          status: 'error',
          processingStage: 'error',
          processingProgress: 0,
          errorMessage: `Failed to generate embeddings: ${embError.message}`,
        })
        return NextResponse.json({ error: 'Failed to generate embeddings' }, { status: 500 })
      }

      // Update progress: embedding stage goes from 30% to 95%
      const processedSoFar = Math.min(i + BATCH_SIZE, textChunks.length)
      const embeddingProgress = 30 + Math.round((processedSoFar / textChunks.length) * 65)

      await Document.findByIdAndUpdate(docId, {
        processingProgress: embeddingProgress,
        processedChunks: processedSoFar,
      })
    }

    // Build final chunks array
    const chunks = textChunks.map((text, i) => ({
      text,
      documentId: docId,
      embedding: allEmbeddings[i] || [],
    }))

    // Save final result
    await Document.findByIdAndUpdate(docId, {
      content,
      chunks,
      status: 'ready',
      processingStage: 'done',
      processingProgress: 100,
      processedChunks: textChunks.length,
    })

    return NextResponse.json({
      message: 'Document processed successfully',
      documentId: docId,
      chunksCount: chunks.length,
    })
  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - remove a document
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const docId = searchParams.get('id')

    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    await connectDB()
    await Document.findOneAndDelete({
      _id: docId,
      organizationId: (session.user as any).organizationId,
    })

    return NextResponse.json({ message: 'Document deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
