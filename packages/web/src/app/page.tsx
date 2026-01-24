import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

type UserProfile = {
  email: string
}

async function getUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  // getSession() reads from cookie - ZERO network requests
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null
  return {
    email: session.user.email ?? '',
  }
}

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen flex flex-col font-mono text-foreground bg-background selection:bg-accent selection:text-white">
      {/* Header */}
      <header className="border-b border-neutral-200 px-6 py-4 bg-background sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight uppercase flex items-center gap-3">
            <div className="logo-bar text-foreground">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            LMMs-Lab Writer
          </Link>
          {user ? (
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="text-sm text-muted group-hover:text-black transition-colors hidden sm:block">
                {user.email}
              </span>
              <div className="size-8 bg-black text-white flex items-center justify-center">
                <span className="text-sm font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-muted hover:text-black transition-colors hidden sm:block"
              >
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 active:bg-black/60 transition-colors">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero - Single focused message */}
        <section className="py-20 md:py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-fade-in-up inline-block mb-6 px-3 py-1 bg-black text-white text-xs uppercase tracking-widest">
              Local-First
            </div>
            <h1 className="animate-fade-in-up delay-100 text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              Simple Agentic Writing
            </h1>
            <p className="animate-fade-in-up delay-200 text-lg text-muted mb-10 max-w-xl mx-auto">
              Your files stay on your machine. Claude Code, Cursor, and other AI tools edit directly. You compile and commit locally.
            </p>
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="px-8 py-4 bg-black text-white font-medium hover:bg-black/80 active:bg-black/60 active:scale-[0.98] transition-all">
                Start Writing
              </Link>
              <Link href="https://github.com/Luodian/latex-writer" className="px-8 py-4 border border-black font-medium hover:bg-black hover:text-white active:scale-[0.98] transition-all">
                View on GitHub
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works - Combined with tool info */}
        <section className="border-t border-neutral-200 py-20 px-6 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center text-sm uppercase tracking-widest text-muted mb-12">How It Works</h2>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-16">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-black flex items-center justify-center text-xl font-bold">1</div>
                <h3 className="font-bold mb-2">Install CLI</h3>
                <p className="text-sm text-muted">
                  One command
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-black flex items-center justify-center text-xl font-bold">2</div>
                <h3 className="font-bold mb-2">Open Project</h3>
                <p className="text-sm text-muted">
                  Pick your folder
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-black flex items-center justify-center text-xl font-bold">3</div>
                <h3 className="font-bold mb-2">Write & Compile</h3>
                <p className="text-sm text-muted">
                  AI helps, you control
                </p>
              </div>
            </div>

            {/* Supported tools - compact */}
            <div className="text-center">
              <p className="text-sm text-muted mb-4">Works with</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">Claude Code</span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">Cursor</span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">Codex</span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">OpenCode</span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono text-muted">Any AI Editor</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-neutral-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <div className="logo-bar text-foreground">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <span>LMMs-Lab Writer</span>
          </div>
          <div className="flex gap-6">
            <Link href="https://github.com/Luodian/latex-writer" className="hover:text-black transition-colors">
              GitHub
            </Link>
            <Link href="/docs" className="hover:text-black transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
