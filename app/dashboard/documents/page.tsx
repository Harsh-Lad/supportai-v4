'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface Doc {
  _id: string
  name: string
  originalName: string
  type: string
  status: string
  processingStage?: string
  processingProgress?: number
  totalChunks?: number
  processedChunks?: number
  errorMessage?: string
  createdAt: string
}

const STAGE_LABELS: Record<string, string> = {
  uploading: 'Uploading file...',
  extracting: 'Extracting text from document...',
  chunking: 'Splitting into chunks...',
  embedding: 'Generating embeddings...',
  done: 'Ready',
  error: 'Failed',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      if (Array.isArray(data)) setDocuments(data)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchDocs() }, [])

  // Poll for processing docs
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing')
    if (hasProcessing) {
      pollRef.current = setInterval(async () => {
        await fetchDocs()
      }, 2000)
    } else if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [documents.map(d => d.status).join(',')])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setUploading(true)
      setUploadProgress(5)
      setUploadStage('Uploading file...')

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/documents', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) {
          toast.success(`${file.name} processed successfully!`)
          fetchDocs()
        } else {
          toast.error(data.error || 'Upload failed')
        }
      } catch {
        toast.error('Upload failed')
      } finally {
        setUploading(false)
        setUploadProgress(0)
        setUploadStage('')
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
  })

  const deleteDoc = async (id: string) => {
    try {
      await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
      toast.success('Document deleted')
      fetchDocs()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">Upload and manage your knowledge base documents</p>
      </div>

      {/* Upload zone */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center max-w-md mx-auto">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium mb-1">Processing document...</p>
                <p className="text-xs text-muted-foreground mb-3">
                  This may take a moment depending on document size
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, DOCX, TXT, and MD files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploaded Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents yet</p>
              <p className="text-xs mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type.toUpperCase()} &middot; {new Date(doc.createdAt).toLocaleDateString()}
                      </p>

                      {/* Processing progress bar */}
                      {doc.status === 'processing' && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {STAGE_LABELS[doc.processingStage || 'uploading'] || 'Processing...'}
                            </span>
                            <span className="text-xs font-medium text-primary">
                              {doc.processingProgress || 0}%
                            </span>
                          </div>
                          <Progress value={doc.processingProgress || 0} className="h-1.5" />
                          {doc.processingStage === 'embedding' && doc.totalChunks ? (
                            <p className="text-xs text-muted-foreground">
                              Embedding chunk {doc.processedChunks || 0} of {doc.totalChunks}
                            </p>
                          ) : null}
                        </div>
                      )}

                      {/* Error message */}
                      {doc.status === 'error' && doc.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">{doc.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge variant={
                      doc.status === 'ready' ? 'success' :
                      doc.status === 'processing' ? 'warning' : 'destructive'
                    }>
                      {doc.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {doc.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {doc.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc._id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
