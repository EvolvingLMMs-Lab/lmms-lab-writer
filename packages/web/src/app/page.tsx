import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type UserProfile = {
  email: string;
};

async function getUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  // getSession() reads from cookie - ZERO network requests
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    email: session.user.email ?? "",
  };
}

export default async function Home() {
  const user = await getUser();

  return (
    <div className="min-h-screen flex flex-col font-mono text-foreground bg-background selection:bg-accent selection:text-white">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight uppercase flex items-center gap-3"
          >
            <div className="logo-bar text-foreground">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
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
              <Link
                href="/signup"
                className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 active:bg-black/60 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
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
              Your files stay on your machine. Claude Code, Cursor, and other AI
              tools edit directly. You compile and commit locally.
            </p>
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-black text-white font-medium hover:bg-black/80 active:bg-black/60 active:scale-[0.98] transition-all"
              >
                Start Writing
              </Link>
              <Link
                href="https://github.com/EvolvingLMMs-Lab/agentic-latex-writer"
                className="px-8 py-4 border border-black font-medium hover:bg-black hover:text-white active:scale-[0.98] transition-all"
              >
                View on GitHub
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works - Combined with tool info */}
        <section className="border-t border-neutral-200 py-20 px-6 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center text-sm uppercase tracking-widest text-muted mb-12">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-16">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-black flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <h3 className="font-bold mb-2">Install CLI</h3>
                <p className="text-sm text-muted">One command</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-black flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <h3 className="font-bold mb-2">Open Project</h3>
                <p className="text-sm text-muted">Pick your folder</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-black flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <h3 className="font-bold mb-2">Write & Compile</h3>
                <p className="text-sm text-muted">
                  Agentic writing. Compile locally.
                </p>
              </div>
            </div>

            {/* Supported tools - compact */}
            <div className="text-center">
              <p className="text-sm text-muted mb-4">Works with</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">
                  Claude Code
                </span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">
                  Cursor
                </span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">
                  Codex
                </span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono">
                  OpenCode
                </span>
                <span className="px-3 py-1.5 bg-white border border-neutral-200 text-xs font-mono text-muted">
                  Any AI Editor
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Star to Unlock Section */}
        <section className="bg-black text-white py-20 px-6 border-t border-neutral-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Star to Unlock
            </h2>
            <p className="text-neutral-400 mb-12 max-w-xl mx-auto">
              Support our open source work and get premium features free. We
              verify your stars automatically.
            </p>

            <div className="grid sm:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto">
              <div className="border border-neutral-800 p-6 flex flex-col items-center">
                <div className="text-4xl font-mono font-bold mb-2">1 Star</div>
                <div className="text-neutral-400 text-sm uppercase tracking-widest mb-4">
                  7 Days Pro Access
                </div>
                <div className="flex -space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-none bg-neutral-800 border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-700 border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-600 border-2 border-black"></div>
                </div>
              </div>

              <div className="border border-white p-6 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-white text-black text-[10px] px-2 py-1 font-mono uppercase font-bold">
                  Best Value
                </div>
                <div className="text-4xl font-mono font-bold mb-2">
                  10+ Stars
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-widest mb-4">
                  90 Days Pro Access
                </div>
                <div className="flex -space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-none bg-white border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-200 border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-300 border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-400 border-2 border-black flex items-center justify-center text-[10px] text-black font-bold">
                    +99
                  </div>
                </div>
              </div>

              <div className="border border-white p-6 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-white text-black text-[10px] px-2 py-1 font-mono uppercase font-bold">
                  Best Value
                </div>
                <div className="text-4xl font-mono font-bold mb-2">
                  10+ Stars
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-widest mb-4">
                  90 Days Pro Access
                </div>
                <div className="flex -space-x-2 mb-4">
                  {/* Fake avatars */}
                  <div className="w-8 h-8 rounded-none bg-white border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-200 border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-300 border-2 border-black"></div>
                  <div className="w-8 h-8 rounded-none bg-neutral-400 border-2 border-black flex items-center justify-center text-[10px] text-black font-bold">
                    +99
                  </div>
                </div>
              </div>
            </div>

            <div className="text-left max-w-md mx-auto mb-10 space-y-3">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4 text-center">
                Repositories to Star
              </p>

              <a
                href="https://github.com/EvolvingLMMs-Lab/agentic-latex-writer"
                target="_blank"
                className="flex items-center justify-between p-3 border border-neutral-800 hover:bg-neutral-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <svg
                    viewBox="0 0 16 16"
                    className="w-5 h-5 text-neutral-400"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                  </svg>
                  <span className="font-mono text-sm">
                    agentic-latex-writer
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 text-xs">1.2k</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    className="text-neutral-600 group-hover:text-yellow-500 transition-colors"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
              </a>

              <a
                href="https://github.com/EvolvingLMMs-Lab/lmms-eval"
                target="_blank"
                className="flex items-center justify-between p-3 border border-neutral-800 hover:bg-neutral-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <svg
                    viewBox="0 0 16 16"
                    className="w-5 h-5 text-neutral-400"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                  </svg>
                  <span className="font-mono text-sm">lmms-eval</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 text-xs">840</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    className="text-neutral-600 group-hover:text-yellow-500 transition-colors"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
              </a>

              <a
                href="https://github.com/EvolvingLMMs-Lab/research-canvas"
                target="_blank"
                className="flex items-center justify-between p-3 border border-neutral-800 hover:bg-neutral-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <svg
                    viewBox="0 0 16 16"
                    className="w-5 h-5 text-neutral-400"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                  </svg>
                  <span className="font-mono text-sm">research-canvas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 text-xs">350</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    className="text-neutral-600 group-hover:text-yellow-500 transition-colors"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
              </a>
            </div>

            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
            >
              Connect GitHub
            </Link>
          </div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <div className="logo-bar text-foreground">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>LMMs-Lab Writer</span>
          </div>
          <div className="flex gap-6">
            <Link
              href="https://github.com/EvolvingLMMs-Lab/agentic-latex-writer"
              className="hover:text-black transition-colors"
            >
              GitHub
            </Link>
            <Link href="/docs" className="hover:text-black transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
