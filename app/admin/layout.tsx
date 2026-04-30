'use client'

import { SessionProvider } from 'next-auth/react'
import Link from 'next/link'
import { Shield, LayoutDashboard, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-lg font-bold">Super Admin</span>
              <Separator orientation="vertical" className="h-6" />
              <span className="text-sm text-muted-foreground">Platform Management</span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>
        {children}
      </div>
    </SessionProvider>
  )
}
