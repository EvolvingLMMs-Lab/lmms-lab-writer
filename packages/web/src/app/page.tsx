import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

type UserProfile = {
  email: string
}

async function getUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return {
    email: user.email ?? '',
  }
}

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen flex flex-col font-mono text-foreground bg-background selection:bg-accent selection:text-white">
      <header className="border-b border-neutral-800 px-6 py-4 bg-background sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-bold tracking-tighter uppercase flex items-center gap-3">
            <div className="logo-bar text-foreground">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            LMMs-Lab Writer
          </Link>
          {user ? (
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm uppercase tracking-wide hover:text-accent active:text-accent/70 transition-colors duration-75 hidden sm:block"
              >
                Dashboard
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="size-8 bg-surface text-white flex items-center justify-center group-hover:bg-accent transition-colors duration-75">
                  <span className="text-sm font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm hidden md:block">{user.email}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-sm uppercase tracking-wide hover:text-accent active:text-accent/70 transition-colors duration-75 hidden sm:block"
              >
                Login
              </Link>
              <Link href="/signup" className="btn btn-primary px-4 py-2 text-xs md:text-sm">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <section className="border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
            <div className="inline-block mb-8 px-3 py-1 bg-surface text-white text-xs uppercase tracking-widest">
              Local-First LaTeX
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-accent leading-[0.9] mb-8 uppercase">
              Write with AI
            </h1>
            <p className="text-lg md:text-xl text-muted font-mono leading-relaxed max-w-2xl mb-12">
              <span className="text-accent mr-2">&gt;</span>Local-first LaTeX editor for AI-assisted writing.
              <br />
              <span className="text-accent mr-2">&gt;</span>Works with Claude Code, OpenCode, Codex.
              <br />
              <span className="text-accent mr-2">&gt;</span>Your files, your machine, your git.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="btn btn-primary text-base px-8 py-4">
                Start Writing
              </Link>
              <Link href="/docs" className="btn btn-secondary text-base px-8 py-4">
                Documentation
              </Link>
            </div>
          </div>
        </section>

        <div className="border-b border-neutral-800 bg-neutral-50 overflow-hidden whitespace-nowrap py-3 hidden md:block">
          <div className="flex justify-between max-w-7xl mx-auto px-6 text-xs font-mono uppercase tracking-widest text-muted">
             <span>Claude Code Ready</span>
             <span>OpenCode Compatible</span>
             <span>Codex Supported</span>
             <span>Git Native</span>
             <span>Local Compile</span>
          </div>
        </div>

        <section className="border-b border-neutral-800 bg-background">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
            <div className="p-8 md:p-12 hover:bg-neutral-50 transition-colors duration-75 group">
              <div className="mb-6 text-accent">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-accent transition-colors duration-75">One-Time Setup</h3>
              <p className="text-sm md:text-base text-muted leading-relaxed font-mono">
                Install once, works forever. Background service runs automatically. No commands to remember.
              </p>
            </div>
            <div className="p-8 md:p-12 hover:bg-neutral-50 transition-colors duration-75 group">
              <div className="mb-6 text-accent">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-accent transition-colors duration-75">Agentic Coding</h3>
              <p className="text-sm md:text-base text-muted leading-relaxed font-mono">
                Let AI write your LaTeX. Claude Code, OpenCode, and Codex can edit your files directly while you watch.
              </p>
            </div>
            <div className="p-8 md:p-12 hover:bg-neutral-50 transition-colors duration-75 group">
              <div className="mb-6 text-accent">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-accent transition-colors duration-75">Git Native</h3>
              <p className="text-sm md:text-base text-muted leading-relaxed font-mono">
                Use git for version control. See branch, status, and commits right in the editor. No proprietary sync.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-8">
               <span className="w-3 h-3 bg-accent"></span>
               <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">How It Works</h2>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
               <div className="space-y-4">
                 <div className="w-12 h-12 border-2 border-black flex items-center justify-center text-2xl font-bold">1</div>
                 <h3 className="font-bold text-lg">Install</h3>
                 <p className="text-muted text-sm">
                   First time only. One command installs a background service that runs automatically.
                 </p>
               </div>
               <div className="space-y-4">
                 <div className="w-12 h-12 border-2 border-black flex items-center justify-center text-2xl font-bold">2</div>
                 <h3 className="font-bold text-lg">Open Folder</h3>
                 <p className="text-muted text-sm">
                   Click &quot;Open Folder&quot; in the editor and select your LaTeX project. That&apos;s it.
                 </p>
               </div>
               <div className="space-y-4">
                 <div className="w-12 h-12 border-2 border-black flex items-center justify-center text-2xl font-bold">3</div>
                 <h3 className="font-bold text-lg">Write</h3>
                 <p className="text-muted text-sm">
                   Edit in browser, compile with one click, commit changes. Or let AI do it all.
                 </p>
               </div>
             </div>

             <div className="mt-12 text-center">
               <Link href="/signup" className="btn btn-primary px-8 py-4 text-base">
                 Get Started Free
               </Link>
             </div>
          </div>
        </section>

        <section className="border-t border-neutral-800 py-24 px-6 bg-neutral-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight mb-6">
              AI Writes, You Review
            </h2>
            <p className="text-muted font-mono text-lg mb-8 max-w-2xl mx-auto">
              Point Claude Code at your .tex files. Watch edits appear in real-time.
              Compile locally. Commit when ready.
            </p>
            <div className="inline-flex gap-4 flex-wrap justify-center">
              <span className="px-4 py-2 border border-border text-sm font-mono">Claude Code</span>
              <span className="px-4 py-2 border border-border text-sm font-mono">OpenCode</span>
              <span className="px-4 py-2 border border-border text-sm font-mono">Codex</span>
              <span className="px-4 py-2 border border-border text-sm font-mono">Cursor</span>
              <span className="px-4 py-2 border border-border text-sm font-mono">Any AI Editor</span>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 border-t border-neutral-800">
          <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-8">
               <span className="w-3 h-3 bg-accent"></span>
               <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Requirements</h2>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
               <div className="border border-border p-6">
                 <h3 className="font-bold mb-3">Node.js 20+</h3>
                 <p className="text-sm text-muted mb-3">Required for the background service</p>
                 <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-sm underline hover:text-accent">
                   Download from nodejs.org
                 </a>
               </div>
               <div className="border border-border p-6">
                 <h3 className="font-bold mb-3">LaTeX Distribution</h3>
                 <p className="text-sm text-muted mb-3">Required for compilation</p>
                 <div className="text-sm space-y-1">
                   <p><span className="text-muted">macOS:</span> <code className="bg-neutral-100 px-1">brew install --cask mactex</code></p>
                   <p><span className="text-muted">Linux:</span> <code className="bg-neutral-100 px-1">apt install texlive-full</code></p>
                   <p><span className="text-muted">Windows:</span> <a href="https://miktex.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">MiKTeX</a></p>
                 </div>
               </div>
             </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 py-12 px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="logo-bar text-foreground">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <span className="font-bold tracking-tight uppercase">LMMs-Lab Writer</span>
          </div>

          <div className="text-xs text-muted font-mono uppercase tracking-widest text-center md:text-left">
            Local-First LaTeX
          </div>

          <div className="flex gap-8">
            <Link href="https://github.com/Luodian/latex-writer" className="uppercase tracking-widest text-sm hover:text-accent active:text-accent/70 transition-colors duration-75">
              GitHub
            </Link>
            <Link href="/docs" className="uppercase tracking-widest text-sm hover:text-accent active:text-accent/70 transition-colors duration-75">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
