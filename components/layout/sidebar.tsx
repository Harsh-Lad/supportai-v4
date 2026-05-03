'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Bot, LayoutDashboard, FileText, MessageSquare, Ticket,
  Settings, LogOut, Shield, PlayCircle, Users2,
  ExternalLink, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
  { href: '/dashboard/tickets', icon: Ticket, label: 'Tickets' },
  { href: '/dashboard/conversations', icon: MessageSquare, label: 'Conversations' },
  { href: '/dashboard/playground', icon: PlayCircle, label: 'Sandbox' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { href: '/dashboard/team', icon: Users2, label: 'Team' },
  // { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === 'super_admin'
  const orgId = (session?.user as any)?.organizationId

  const handleNavClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <aside className="w-64 bg-background border-r flex flex-col h-screen">
      <div className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">SupportAI</span>
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        {orgId && (
          <>
            <Separator className="my-3" />
            <a
              href={`/landing-demo?orgId=${orgId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Globe className="h-4 w-4" />
              <span className="flex-1">View Demo</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </>
        )}

        {isSuperAdmin && (
          <>
            <Separator className="my-3" />
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === '/admin'
                  ? 'bg-red-500 text-white'
                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
              )}
            >
              <Shield className="h-4 w-4" />
              Super Admin
            </Link>
          </>
        )}
      </nav>
      <div className="p-4 space-y-1">
        <div className="px-3 py-1">
          <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
