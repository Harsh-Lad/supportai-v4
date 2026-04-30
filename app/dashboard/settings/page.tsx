'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Settings, Copy, Check, Bot, Key, Mail, Globe,
  Eye, EyeOff, Zap, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const AI_PROVIDERS = [
  { id: 'groq', name: 'Groq', desc: 'Free tier, fast inference', free: true },
  { id: 'openai', name: 'OpenAI', desc: 'GPT models', free: false },
  { id: 'claude', name: 'Claude (Anthropic)', desc: 'Claude models', free: false },
  { id: 'gemini', name: 'Google Gemini', desc: 'Free tier available', free: true },
  { id: 'openrouter', name: 'OpenRouter', desc: 'Multi-model gateway, free models', free: true },
]

const MODELS: Record<string, { id: string; name: string; free?: boolean }[]> = {
  groq: [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)', free: true },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', free: true },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', free: true },
  ],
  openai: [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4o', name: 'GPT-4o' },
  ],
  claude: [
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', free: true },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', free: true },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', free: true },
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  ],
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [org, setOrg] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showImapPass, setShowImapPass] = useState(false)

  // General settings
  const [settings, setSettings] = useState({
    maxRetries: 3,
    welcomeMessage: 'Hi! How can I help you today?',
    widgetColor: '#6366f1',
    widgetPosition: 'bottom-right',
    enableVoice: true,
    enableEmail: false,
  })

  // AI Provider settings
  const [aiProvider, setAiProvider] = useState({
    provider: 'none' as string,
    apiKey: '',
    model: '',
    enabled: false,
  })

  // Custom system prompt
  const [customPrompt, setCustomPrompt] = useState('')

  // Email channel settings
  const [emailChannel, setEmailChannel] = useState({
    enabled: false,
    method: 'none' as string,
    webhookSecret: '',
    imapHost: '',
    imapPort: 993,
    imapUser: '',
    imapPassword: '',
    imapTls: true,
    forwardingAddress: '',
    replyFromName: 'Support',
    replyFromEmail: '',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setOrg(data)
        if (data?.settings) setSettings(data.settings)
        if (data?.aiProvider) setAiProvider(data.aiProvider)
        if (data?.customPrompt) setCustomPrompt(data.customPrompt)
        if (data?.emailChannel) setEmailChannel(prev => ({ ...prev, ...data.emailChannel }))
      })
      .catch(() => {})
  }, [])

  const saveAll = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, aiProvider, emailChannel, customPrompt }),
      })
      toast.success('All settings saved!')
    } catch {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  const embedCode = org
    ? `<!-- SupportAI Widget -->\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/widget?orgId=${org._id}';\n    iframe.style.cssText = 'position:fixed;${settings.widgetPosition === 'bottom-right' ? 'right:20px' : 'left:20px'};bottom:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9999;';\n    document.body.appendChild(iframe);\n  })();\n</script>`
    : ''

  const webhookUrl = org
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/email/inbound?orgId=${org._id}${emailChannel.webhookSecret ? `&secret=${emailChannel.webhookSecret}` : ''}`
    : ''

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedModels = MODELS[aiProvider.provider] || []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your AI support platform</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="ai" className="max-w-4xl">
        <TabsList className="mb-6">
          <TabsTrigger value="ai" className="gap-1"><Bot className="h-3.5 w-3.5" /> AI Provider</TabsTrigger>
          <TabsTrigger value="general" className="gap-1"><Settings className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="email" className="gap-1"><Mail className="h-3.5 w-3.5" /> Email</TabsTrigger>
          <TabsTrigger value="widget" className="gap-1"><Globe className="h-3.5 w-3.5" /> Widget</TabsTrigger>
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
        </TabsList>

        {/* AI Provider Tab */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" /> AI Provider (BYOK)
              </CardTitle>
              <CardDescription>
                Bring Your Own Key — configure which AI model powers your support responses.
                By default, your platform uses Gemini 1.5 Flash. Add your own key to use a different provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable AI Provider</Label>
                  <p className="text-xs text-muted-foreground">Use an LLM to generate responses from RAG context</p>
                </div>
                <Switch
                  checked={aiProvider.enabled}
                  onCheckedChange={v => setAiProvider({ ...aiProvider, enabled: v })}
                />
              </div>

              {aiProvider.enabled && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <Label>Select Provider</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {AI_PROVIDERS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setAiProvider({ ...aiProvider, provider: p.id, model: '' })}
                          className={`text-left p-3 border rounded-lg transition-colors ${
                            aiProvider.provider === p.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{p.name}</span>
                            {p.free && <Badge variant="success" className="text-xs">Free Tier</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {aiProvider.provider !== 'none' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <div className="relative">
                          <Input
                            id="apiKey"
                            type={showApiKey ? 'text' : 'password'}
                            value={aiProvider.apiKey}
                            onChange={e => setAiProvider({ ...aiProvider, apiKey: e.target.value })}
                            placeholder={`Enter your ${AI_PROVIDERS.find(p => p.id === aiProvider.provider)?.name} API key`}
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your API key is stored encrypted. It&apos;s only used server-side to generate responses.
                        </p>
                      </div>

                      {selectedModels.length > 0 && (
                        <div className="space-y-2">
                          <Label>Model</Label>
                          <div className="space-y-1">
                            {selectedModels.map(m => (
                              <button
                                key={m.id}
                                onClick={() => setAiProvider({ ...aiProvider, model: m.id })}
                                className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                                  aiProvider.model === m.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                }`}
                              >
                                <span className="font-medium">{m.name}</span>
                                {m.free && <Badge variant="success" className="text-xs ml-2">Free</Badge>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <Separator />

              {/* System Prompt Customization */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Custom System Prompt</Label>
                <p className="text-xs text-muted-foreground">
                  Add custom instructions for the AI. This is appended to the default support prompt.
                  Use it to define tone, product-specific rules, or response format.
                </p>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  rows={5}
                  placeholder="e.g. Always greet the customer by name. Never mention competitor products. If asked about pricing, direct them to /pricing page."
                  className="font-mono text-sm"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>This applies to all AI responses regardless of provider.</span>
                  <span>{customPrompt.length} / 2000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>AI Behavior</CardTitle>
              <CardDescription>Configure how the AI handles customer queries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Human Handoff Threshold (retries)</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxRetries}
                  onChange={e => setSettings({ ...settings, maxRetries: parseInt(e.target.value) || 3 })}
                />
                <p className="text-xs text-muted-foreground">
                  After this many low-confidence or unhelpful responses, escalate to human.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Textarea
                  id="welcome"
                  value={settings.welcomeMessage}
                  onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Voice Support</Label>
                  <p className="text-xs text-muted-foreground">Enable voice call mode in widget</p>
                </div>
                <Switch
                  checked={settings.enableVoice}
                  onCheckedChange={v => setSettings({ ...settings, enableVoice: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Email Channel
              </CardTitle>
              <CardDescription>
                Configure inbound email processing. Emails are processed through the same RAG + AI pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Email Channel</Label>
                  <p className="text-xs text-muted-foreground">Process inbound emails through AI</p>
                </div>
                <Switch
                  checked={emailChannel.enabled}
                  onCheckedChange={v => setEmailChannel({ ...emailChannel, enabled: v })}
                />
              </div>

              {emailChannel.enabled && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <Label>Email Integration Method</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[
                        { id: 'webhook', name: 'Webhook', desc: 'SendGrid/Mailgun forwards emails to your webhook URL' },
                        { id: 'imap', name: 'IMAP Polling', desc: 'Connect directly to an email inbox via IMAP' },
                        { id: 'forwarding', name: 'Manual Forward', desc: 'Agents paste email content into the dashboard' },
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setEmailChannel({ ...emailChannel, method: m.id })}
                          className={`text-left p-3 border rounded-lg transition-colors ${
                            emailChannel.method === m.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <span className="font-medium text-sm">{m.name}</span>
                          <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {emailChannel.method === 'webhook' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <div className="flex gap-2">
                          <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={() => copyText(webhookUrl)}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Set this URL as your inbound parse webhook in SendGrid or Mailgun.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Webhook Secret (optional)</Label>
                        <Input
                          value={emailChannel.webhookSecret}
                          onChange={e => setEmailChannel({ ...emailChannel, webhookSecret: e.target.value })}
                          placeholder="A secret to verify incoming webhooks"
                        />
                      </div>
                    </div>
                  )}

                  {emailChannel.method === 'imap' && (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                          IMAP polling requires the <code>imapflow</code> package for production use.
                          For the demo, use webhook or manual forwarding instead.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>IMAP Host</Label>
                          <Input
                            value={emailChannel.imapHost}
                            onChange={e => setEmailChannel({ ...emailChannel, imapHost: e.target.value })}
                            placeholder="imap.gmail.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>IMAP Port</Label>
                          <Input
                            type="number"
                            value={emailChannel.imapPort}
                            onChange={e => setEmailChannel({ ...emailChannel, imapPort: parseInt(e.target.value) || 993 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>IMAP Username</Label>
                        <Input
                          value={emailChannel.imapUser}
                          onChange={e => setEmailChannel({ ...emailChannel, imapUser: e.target.value })}
                          placeholder="support@yourcompany.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IMAP Password</Label>
                        <div className="relative">
                          <Input
                            type={showImapPass ? 'text' : 'password'}
                            value={emailChannel.imapPassword}
                            onChange={e => setEmailChannel({ ...emailChannel, imapPassword: e.target.value })}
                            placeholder="App password"
                          />
                          <button
                            onClick={() => setShowImapPass(!showImapPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showImapPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {emailChannel.method === 'forwarding' && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm">
                        With manual forwarding, your agents can forward customer emails by going to
                        <strong> Tickets → Forward Email</strong> and pasting the email content.
                        The AI will process it and create a ticket automatically.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widget Tab */}
        <TabsContent value="widget">
          <Card>
            <CardHeader>
              <CardTitle>Widget Appearance</CardTitle>
              <CardDescription>Customize how the chat widget looks on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={settings.widgetColor}
                    onChange={e => setSettings({ ...settings, widgetColor: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.widgetColor}
                    onChange={e => setSettings({ ...settings, widgetColor: e.target.value })}
                    className="w-32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Widget Position</Label>
                <div className="flex gap-2">
                  {['bottom-right', 'bottom-left'].map(pos => (
                    <Button
                      key={pos}
                      variant={settings.widgetPosition === pos ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettings({ ...settings, widgetPosition: pos })}
                    >
                      {pos.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Tab */}
        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Copy and paste before the closing &lt;/body&gt; tag</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{embedCode || 'Loading...'}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-1"
                  onClick={() => copyText(embedCode)}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Organization ID: <code className="bg-muted px-1 rounded">{org?._id || '...'}</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
