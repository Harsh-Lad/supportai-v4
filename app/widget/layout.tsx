import { Suspense } from 'react'

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>{children}</Suspense>
}
