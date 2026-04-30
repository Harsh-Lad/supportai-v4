import Link from 'next/link'
import { Bot, FileText, Headphones, Users, ArrowRight, Shield, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">SupportAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          AI-Powered Customer Support
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Resolve customer queries<br />
          <span className="text-primary">before they reach your team</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Upload your support docs, and our RAG-powered AI handles customer questions
          via chat, voice, and email. Escalates to humans only when needed.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline">Try Live Demo</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need for AI support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FileText,
              title: 'Document RAG',
              desc: 'Upload PDFs, DOCX, or text files. Our AI learns from your existing support documentation.',
            },
            {
              icon: Bot,
              title: 'Smart Chatbot',
              desc: 'Embeddable widget for your website. Answers questions using your knowledge base.',
            },
            {
              icon: Headphones,
              title: 'Voice Support',
              desc: 'Full voice call support with real-time speech recognition and AI-generated responses.',
            },
            {
              icon: Users,
              title: 'Human Handoff',
              desc: 'Configurable retry threshold. AI escalates to human agents when it can\'t help.',
            },
          ].map((feature, i) => (
            <div key={i} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Upload Documents', desc: 'Upload your support docs, FAQs, and knowledge base articles.' },
              { step: '2', title: 'Configure & Embed', desc: 'Set your handoff threshold, customize the widget, and embed it on your site.' },
              { step: '3', title: 'AI Handles Support', desc: 'Customers get instant answers. Complex queries get routed to your team.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span>SupportAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="pt-6 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SupportAI. AI-powered customer support.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
