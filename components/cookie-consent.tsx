'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const STORAGE_KEY = 'supportai-cookie-consent'

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasConsented = localStorage.getItem(STORAGE_KEY)
    if (!hasConsented) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-foreground">
            We use essential cookies to make our service work. These cookies are necessary for basic functionality and cannot be disabled.{' '}
            <a
              href="/privacy"
              className="underline hover:opacity-80 transition-opacity font-medium"
            >
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleAccept}
            size="sm"
            className="whitespace-nowrap"
          >
            Accept
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
