'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload, ChevronRight, ChevronLeft, CheckCircle2, Palette, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface OrgSettings {
  _id: string
  name: string
  settings: {
    maxRetries: number
    welcomeMessage: string
    widgetColor: string
    widgetPosition: string
  }
  aiProvider: {
    provider: string
    model: string
    enabled: boolean
  }
}

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [orgData, setOrgData] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Step 2 state
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Step 3 state
  const [aiProvider, setAiProvider] = useState('none')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [savingAI, setSavingAI] = useState(false)

  // Step 4 state
  const [widgetColor, setWidgetColor] = useState('#6366f1')
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?')
  const [savingWidget, setSavingWidget] = useState(false)

  // Step 5 state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const orgId = (session?.user as any)?.organizationId

  // Fetch org settings on mount
  useEffect(() => {
    async function fetchSettings() {
      if (!orgId) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('Failed to fetch settings')
        const data = await res.json()
        setOrgData(data)
        setWidgetColor(data.settings?.widgetColor || '#6366f1')
        setWelcomeMessage(data.settings?.welcomeMessage || 'Hi! How can I help you today?')
        setAiProvider(data.aiProvider?.provider || 'none')
        setModel(data.aiProvider?.model || '')
      } catch (err) {
        console.error('Error fetching settings:', err)
        setError('Failed to load organization data')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [orgId])

  // Fetch uploaded documents
  useEffect(() => {
    if (currentStep === 2) {
      async function fetchDocs() {
        try {
          const res = await fetch('/api/documents')
          if (!res.ok) throw new Error('Failed to fetch documents')
          const docs = await res.json()
          setUploadedDocs(docs || [])
        } catch (err) {
          console.error('Error fetching documents:', err)
        }
      }
      fetchDocs()
    }
  }, [currentStep])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    for (const file of Array.from(files)) {
      setUploading(true)
      setUploadError(null)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Upload failed')
        }
        // Refresh docs list
        const docsRes = await fetch('/api/documents')
        const docs = await docsRes.json()
        setUploadedDocs(docs || [])
      } catch (err: any) {
        console.error('Upload error:', err)
        setUploadError(err.message || 'Failed to upload file')
      } finally {
        setUploading(false)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveAI = async () => {
    if (aiProvider !== 'none' && !apiKey) {
      setError('API key is required when using an AI provider')
      return
    }

    setSavingAI(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiProvider: {
            provider: aiProvider,
            apiKey: aiProvider !== 'none' ? apiKey : '',
            model: aiProvider !== 'none' ? model : '',
            enabled: aiProvider !== 'none',
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to save AI settings')
      setCurrentStep(4)
    } catch (err: any) {
      console.error('Error saving AI settings:', err)
      setError(err.message || 'Failed to save settings')
    } finally {
      setSavingAI(false)
    }
  }

  const handleSkipAI = () => {
    setCurrentStep(4)
  }

  const handleSaveWidget = async () => {
    setSavingWidget(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...orgData?.settings,
            widgetColor,
            welcomeMessage,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to save widget settings')
      setCurrentStep(5)
    } catch (err: any) {
      console.error('Error saving widget settings:', err)
      setError(err.message || 'Failed to save settings')
    } finally {
      setSavingWidget(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !orgId) return

    const userMessage = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setSendingMessage(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          orgId,
          channel: 'onboarding',
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to send message')
      }

      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'ai', content: data.response }])
    } catch (err: any) {
      console.error('Chat error:', err)
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFinish = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading your organization...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to SupportAI</h1>
          <p className="text-muted-foreground">
            Let's set up your support platform in just 5 steps
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of 5
              </span>
              <span className="text-sm font-medium">{Math.round((currentStep / 5) * 100)}%</span>
            </div>
            <Progress value={(currentStep / 5) * 100} className="h-2" />
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Welcome!
              </CardTitle>
              <CardDescription>
                Let's get your organization ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-lg">
                <p className="font-semibold mb-2">Organization: {orgData?.name}</p>
                <p className="text-sm text-muted-foreground">
                  You're about to configure SupportAI for your team. This setup wizard will help you:
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Upload your support documents
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Configure AI provider (optional)
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Customize your chat widget
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Test the system
                  </li>
                </ul>
              </div>
            </CardContent>
            <Separator />
            <div className="px-6 py-4 flex justify-end">
              <Button onClick={() => setCurrentStep(2)}>
                Let's Get Started <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Upload Documents */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
              <CardDescription>
                Add your support docs, FAQs, or knowledge base content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload area */}
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, TXT, or Markdown files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              {uploading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Uploading...</span>
                </div>
              )}

              {uploadError && (
                <div className="bg-destructive/5 p-3 rounded-lg text-sm text-destructive">
                  {uploadError}
                </div>
              )}

              {/* Uploaded docs list */}
              {uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Documents ({uploadedDocs.length})</p>
                  {uploadedDocs.map((doc: any) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          doc.status === 'ready' ? 'default' :
                          doc.status === 'processing' ? 'secondary' :
                          'destructive'
                        }>
                          {doc.status}
                        </Badge>
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      {doc.status === 'ready' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <Separator />
            <div className="px-6 py-4 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} disabled={uploadedDocs.length === 0}>
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Configure AI */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configure AI (Optional)
              </CardTitle>
              <CardDescription>
                Use your own AI provider or our built-in RAG
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="provider">AI Provider</Label>
                <select
                  id="provider"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="none">Built-in RAG (Recommended)</option>
                  <option value="openai">OpenAI</option>
                  <option value="groq">Groq</option>
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              {aiProvider !== 'none' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apikey">API Key</Label>
                    <Input
                      id="apikey"
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="e.g., gpt-4, claude-3-sonnet, groq-mixtral"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  </div>
                </>
              )}

              {aiProvider === 'none' && (
                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <p className="font-medium text-blue-900 mb-1">Using Built-in RAG</p>
                  <p className="text-blue-700">
                    We'll use TF-IDF based retrieval with your documents. No API key needed!
                  </p>
                </div>
              )}
            </CardContent>
            <Separator />
            <div className="px-6 py-4 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                {aiProvider !== 'none' && (
                  <Button
                    variant="outline"
                    onClick={handleSkipAI}
                    disabled={savingAI}
                  >
                    Use Built-in RAG
                  </Button>
                )}
                <Button onClick={handleSaveAI} disabled={savingAI}>
                  {savingAI ? 'Saving...' : 'Continue'} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Customize Widget */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Customize Widget
              </CardTitle>
              <CardDescription>
                Make it match your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="color">Widget Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color"
                    type="color"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="h-10 w-16 rounded cursor-pointer border"
                  />
                  <Input
                    type="text"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="flex-1"
                    placeholder="#6366f1"
                  />
                </div>
                <div className="mt-3 p-4 rounded-lg border" style={{ borderColor: widgetColor }}>
                  <div
                    className="w-12 h-12 rounded-full cursor-pointer flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: widgetColor }}
                  >
                    💬
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Welcome Message</Label>
                <Textarea
                  id="message"
                  placeholder="Hi! How can I help you today?"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="min-h-24"
                />
              </div>
            </CardContent>
            <Separator />
            <div className="px-6 py-4 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSaveWidget} disabled={savingWidget}>
                {savingWidget ? 'Saving...' : 'Continue'} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Test It Out */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Test It Out
              </CardTitle>
              <CardDescription>
                Try chatting with your AI support assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 h-80 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Start a conversation to test your setup
                        </p>
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white text-foreground border'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !sendingMessage) {
                        handleSendMessage()
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || sendingMessage}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
            <Separator />
            <div className="px-6 py-4 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                All Done! <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
