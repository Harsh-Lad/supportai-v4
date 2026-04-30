'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Bot, User, ThumbsUp, ThumbsDown, Mic, MicOff, Phone, PhoneOff } from 'lucide-react'

interface Message {
  role: 'customer' | 'ai' | 'system'
  content: string
  confidence?: number
  sources?: string[]
}

export default function WidgetPage() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')

  const [config, setConfig] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [started, setStarted] = useState(false)
  const [escalated, setEscalated] = useState(false)

  // Voice state
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')

  // Refs to avoid stale closures
  const conversationIdRef = useRef<string | null>(null)
  const isVoiceModeRef = useRef(false)
  const loadingRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Keep refs in sync
  useEffect(() => { conversationIdRef.current = conversationId }, [conversationId])
  useEffect(() => { isVoiceModeRef.current = isVoiceMode }, [isVoiceMode])
  useEffect(() => { loadingRef.current = loading }, [loading])

  // Load widget config
  useEffect(() => {
    if (!orgId) return
    fetch(`/api/widget?orgId=${orgId}`)
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {})
  }, [orgId])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Core message sender ────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, isVoice = false) => {
    if (!text.trim() || loadingRef.current) return

    setInput('')
    setTranscript('')
    setMessages(prev => [...prev, { role: 'customer', content: text }])
    setLoading(true)
    loadingRef.current = true

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationIdRef.current,
          orgId,
          customerName,
          channel: isVoiceModeRef.current ? 'voice' : 'chat',
        }),
      })

      const data = await res.json()

      if (data.conversationId) {
        setConversationId(data.conversationId)
        conversationIdRef.current = data.conversationId
      }

      const aiMsg: Message = {
        role: 'ai',
        content: data.response || 'Sorry, something went wrong.',
        confidence: data.confidence,
        sources: data.sources,
      }
      setMessages(prev => [...prev, aiMsg])

      if (data.escalated) {
        setEscalated(true)
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'This conversation has been escalated to a human agent. Someone from our team will follow up with you shortly.',
        }])
      }

      // Speak in voice mode
      if (isVoiceModeRef.current && data.response) {
        speakText(data.response)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    }

    setLoading(false)
    loadingRef.current = false
  }, [orgId, customerName])

  // ── Speech synthesis ───────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.lang = 'en-US'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      // Resume listening after speaking
      if (isVoiceModeRef.current) {
        setTimeout(() => startListening(), 500)
      }
    }
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  // ── Speech recognition setup ───────────────────────────────────
  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return null

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        setTranscript('')
        setIsListening(false)
        sendMessage(finalText, true)
      } else if (interimText) {
        setTranscript(interimText)
      }
    }

    recognition.onerror = (event: any) => {
      console.log('Speech recognition error:', event.error)
      setIsListening(false)
      // Auto-restart on 'no-speech' if still in voice mode
      if (event.error === 'no-speech' && isVoiceModeRef.current) {
        setTimeout(() => startListening(), 1000)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return recognition
  }, [sendMessage])

  const startListening = useCallback(() => {
    // Stop any existing recognition first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    const recognition = initRecognition()
    if (!recognition) return

    recognitionRef.current = recognition

    try {
      recognition.start()
      setIsListening(true)
      setTranscript('')
    } catch (e) {
      console.log('Failed to start recognition:', e)
    }
  }, [initRecognition])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setTranscript('')
  }, [])

  // ── Conversation start ─────────────────────────────────────────
  const startConversation = () => {
    if (!customerName.trim()) return
    setStarted(true)
    const welcome = config?.welcomeMessage || 'Hi! How can I help you today?'
    setMessages([{ role: 'ai', content: welcome }])
    if (isVoiceMode) {
      setTimeout(() => speakText(welcome), 300)
    }
  }

  // ── Feedback ───────────────────────────────────────────────────
  const sendFeedback = async (messageIndex: number, helpful: boolean) => {
    if (!conversationId) return
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, messageIndex, helpful }),
      })
    } catch {}
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [stopListening])

  const brandColor = config?.widgetColor || '#6366f1'

  if (!orgId) {
    return (
      <div className="h-screen flex items-center justify-center p-4 text-center text-gray-500">
        <p>Widget misconfigured. Missing orgId parameter.</p>
      </div>
    )
  }

  // ── Pre-chat form ──────────────────────────────────────────────
  if (!started) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="p-4 text-white text-center" style={{ backgroundColor: brandColor }}>
          <Bot className="h-8 w-8 mx-auto mb-2" />
          <h2 className="font-semibold">{config?.orgName || 'Support'}</h2>
          <p className="text-sm opacity-90">AI-Powered Support</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                onKeyDown={e => e.key === 'Enter' && startConversation()}
              />
            </div>

            {config?.enableVoice && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="voiceMode"
                  checked={isVoiceMode}
                  onChange={e => setIsVoiceMode(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="voiceMode" className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Enable voice call mode
                </label>
              </div>
            )}

            <button
              onClick={startConversation}
              disabled={!customerName.trim()}
              className="w-full py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: brandColor }}
            >
              Start Conversation
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Chat interface ─────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 text-white flex items-center justify-between" style={{ backgroundColor: brandColor }}>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold text-sm">{config?.orgName || 'Support'}</span>
        </div>
        <div className="flex items-center gap-2">
          {isVoiceMode && (
            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              {isListening ? (
                <><Mic className="h-3 w-3 animate-pulse text-red-300" /> Listening...</>
              ) : isSpeaking ? (
                <><span className="animate-pulse">🔊</span> Speaking...</>
              ) : (
                <><MicOff className="h-3 w-3" /> Voice Mode</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'system' ? (
              <div className="text-center">
                <span className="inline-block bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-full">
                  {msg.content}
                </span>
              </div>
            ) : (
              <div className={`flex gap-2 ${msg.role === 'customer' ? 'flex-row-reverse' : ''}`}>
                <div
                  className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center"
                  style={msg.role === 'ai' ? { backgroundColor: brandColor + '20' } : { backgroundColor: '#e5e7eb' }}
                >
                  {msg.role === 'customer'
                    ? <User className="h-3.5 w-3.5 text-gray-600" />
                    : <Bot className="h-3.5 w-3.5" style={{ color: brandColor }} />}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === 'customer' ? 'text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                  style={msg.role === 'customer' ? { backgroundColor: brandColor } : {}}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'ai' && msg.confidence !== undefined && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-400">
                        {Math.round(msg.confidence * 100)}% confident
                      </span>
                      <div className="flex gap-1 ml-auto">
                        <button onClick={() => sendFeedback(i, true)} className="p-1 hover:bg-green-100 rounded" title="Helpful">
                          <ThumbsUp className="h-3 w-3 text-gray-400 hover:text-green-600" />
                        </button>
                        <button onClick={() => sendFeedback(i, false)} className="p-1 hover:bg-red-100 rounded" title="Not helpful">
                          <ThumbsDown className="h-3 w-3 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor + '20' }}>
              <Bot className="h-3.5 w-3.5" style={{ color: brandColor }} />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {transcript && (
          <div className="text-center">
            <span className="text-xs text-gray-400 italic">🎤 {transcript}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!escalated ? (
        <div className="p-3 border-t">
          {isVoiceMode ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={loading || isSpeaking}
                  className={`h-14 w-14 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 ${
                    isListening ? 'animate-pulse ring-4 ring-red-200' : ''
                  }`}
                  style={{ backgroundColor: isListening ? '#ef4444' : brandColor }}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                <button
                  onClick={() => {
                    setIsVoiceMode(false)
                    stopListening()
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
                  }}
                  className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {isListening ? 'Speak now...' : isSpeaking ? 'AI is responding...' : 'Tap mic to speak'}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
                style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
              />
              {config?.enableVoice && (
                <button
                  onClick={() => setIsVoiceMode(true)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Switch to voice mode"
                >
                  <Mic className="h-4 w-4 text-gray-600" />
                </button>
              )}
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="p-2 text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 border-t text-center">
          <p className="text-sm text-gray-500">Conversation escalated to human support</p>
        </div>
      )}
    </div>
  )
}
