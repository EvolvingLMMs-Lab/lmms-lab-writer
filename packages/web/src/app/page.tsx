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
      {/* Header */}
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
                className="text-sm uppercase tracking-wide hover:text-accent transition-colors duration-75 hidden sm:block"
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
                className="text-sm uppercase tracking-wide hover:text-accent transition-colors duration-75 hidden sm:block"
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
        {/* Hero Section */}
        <section className="border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
            <div className="inline-block mb-8 px-3 py-1 bg-surface text-white text-xs uppercase tracking-widest">
              v1.0.0 Public Beta
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-accent leading-[0.9] mb-8 uppercase">
              LaTeX Writer
              <br />
              Collaborative
            </h1>
            <p className="text-lg md:text-xl text-muted font-mono leading-relaxed max-w-2xl mb-12">
              <span className="text-accent mr-2">&gt;</span>A modern real-time collaborative editor.
              <br />
              <span className="text-accent mr-2">&gt;</span>Local CLI compilation.
              <br />
              <span className="text-accent mr-2">&gt;</span>Cloud synchronization.
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

        {/* Stats/Data ticker styling */}
        <div className="border-b border-neutral-800 bg-neutral-50 overflow-hidden whitespace-nowrap py-3 hidden md:block">
          <div className="flex justify-between max-w-7xl mx-auto px-6 text-xs font-mono uppercase tracking-widest text-muted">
             <span>System Status: Online</span>
             <span>Latency: 24ms</span>
             <span>Active Nodes: 12</span>
             <span>Latest Build: 4a2f89</span>
             <span>Region: US-EAST-1</span>
          </div>
        </div>

        {/* Features Section */}
        <section className="border-b border-neutral-800 bg-background">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
            <div className="p-8 md:p-12 hover:bg-neutral-50 transition-colors duration-75 group">
              <div className="mb-6 text-accent">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-accent transition-colors duration-75">Local CLI</h3>
              <p className="text-sm md:text-base text-muted leading-relaxed font-mono">
                Compile LaTeX locally with XeLaTeX, pdfLaTeX, or LuaLaTeX. Watch mode enabled for instant feedback.
              </p>
            </div>
            <div className="p-8 md:p-12 hover:bg-neutral-50 transition-colors duration-75 group">
              <div className="mb-6 text-accent">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-accent transition-colors duration-75">Real-time Sync</h3>
              <p className="text-sm md:text-base text-muted leading-relaxed font-mono">
                CRDT-based synchronization. See cursors, selections, and edits from collaborators in milliseconds.
              </p>
            </div>
            <div className="p-8 md:p-12 hover:bg-neutral-50 transition-colors duration-75 group">
              <div className="mb-6 text-accent">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-4 group-hover:text-accent transition-colors duration-75">Access Control</h3>
              <p className="text-sm md:text-base text-muted leading-relaxed font-mono">
                Granular permissions. Share via secure links. Role-based access control for teams.
              </p>
            </div>
          </div>
        </section>

        {/* Install Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-8">
               <span className="w-3 h-3 bg-accent"></span>
               <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Quick Install</h2>
             </div>
             
             <div className="bg-surface p-8 text-white font-mono text-base md:text-lg relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-50 text-xs uppercase tracking-widest">
                 BASH
               </div>
               <div className="flex items-center gap-4 mb-4">
                 <span className="text-accent select-none">$</span>
                 <span>npm install -g @latex-writer/cli</span>
               </div>
               <div className="text-neutral-500 text-sm select-none">
                 &gt; Installing package...
                 <br />
                 &gt; Verified signature...
                 <br />
                 &gt; Done.
               </div>
               
               <div className="absolute bottom-0 left-0 h-1 bg-accent w-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out"></div>
             </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 py-12 px-6 bg-neutral-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="logo-bar text-foreground">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <span className="font-bold tracking-tight uppercase">LMMs-Lab Writer</span>
          </div>
          
          <div className="text-xs text-muted font-mono uppercase tracking-widest text-center md:text-left">
            © 2026 All Systems Normal
          </div>
          
          <div className="flex gap-8">
            <Link href="https://github.com" className="uppercase tracking-widest text-sm hover:text-accent transition-colors duration-75">
              GitHub
            </Link>
            <Link href="/docs" className="uppercase tracking-widest text-sm hover:text-accent transition-colors duration-75">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
