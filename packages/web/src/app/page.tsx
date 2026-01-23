import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-200 px-6 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            LMMs-Lab Write
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-neutral-500 hover:text-black transition-colors"
            >
              Login
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-black text-balance">
            Write LaTeX,
            <br />
            Together.
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-neutral-500 font-light leading-relaxed max-w-2xl text-pretty">
            A modern collaborative LaTeX editor. Write locally with our CLI,
            sync to the cloud, and collaborate in real-time.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/signup" className="btn btn-primary">
              Start Writing
            </Link>
            <Link
              href="/docs"
              className="btn btn-secondary"
            >
              Documentation
            </Link>
          </div>
        </section>

        <section className="border-t border-neutral-200 py-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-12">
              Features
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="border-t border-neutral-200 pt-8">
                <h3 className="text-2xl font-bold mb-4">Local CLI</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Compile LaTeX locally with XeLaTeX, pdfLaTeX, or LuaLaTeX.
                  Watch mode for instant feedback.
                </p>
              </div>
              <div className="border-t border-neutral-200 pt-8">
                <h3 className="text-2xl font-bold mb-4">Real-time Sync</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Collaborate with others in real-time. See cursors, selections,
                  and changes as they happen.
                </p>
              </div>
              <div className="border-t border-neutral-200 pt-8">
                <h3 className="text-2xl font-bold mb-4">Easy Sharing</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Share documents with a link. Control permissions for viewing
                  or editing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-200 py-24 bg-accent">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-balance">
              Install the CLI
            </h2>
            <p className="text-neutral-500 font-light mb-8 text-pretty">
              Get started in seconds with npm
            </p>
            <code className="inline-block bg-black text-white px-8 py-4 font-mono text-lg">
              npm install -g @latex-writer/cli
            </code>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              LMMs-Lab Write
            </p>
            <div className="flex gap-6">
              <Link
                href="https://github.com"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                GitHub
              </Link>
              <Link
                href="/docs"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Docs
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
