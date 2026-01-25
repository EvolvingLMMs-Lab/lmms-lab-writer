import Link from "next/link";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { PaperDemo } from "@/components/paper-demo";
import { Header } from "@/components/header";

const comparisons = [
  {
    feature: "File storage",
    overleaf: "Cloud only",
    writer: "Local (your machine)",
  },
  {
    feature: "AI editing",
    overleaf: "Built-in grammar help",
    writer: "OpenCode & More AI Agents",
  },
  {
    feature: "Compilation",
    overleaf: "Their servers",
    writer: "Local (faster, offline)",
  },
  {
    feature: "Git integration",
    overleaf: "Paid plans only",
    writer: "First-class",
  },
  {
    feature: "Offline work",
    overleaf: "Not available",
    writer: "Full support",
  },
  { feature: "Price", overleaf: "$21-42/month", writer: "Free & Very Cheap" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 px-6 bg-cream">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              Think Deep, Write Easy.
            </h1>
            <p className="text-lg text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
              Stop manually writing LaTeX. Let agents handle the syntax while
              you focus on outlier science.
            </p>
            <div className="flex items-center justify-center gap-4 relative">
              <Link href="/download" className="btn btn-primary">
                <Download className="w-4 h-4" />
                Download
              </Link>
              <Link href="/docs" className="btn btn-secondary">
                <FileText className="w-4 h-4" />
                Documentation
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-medium mb-4 text-center">
              See it in action.
            </h2>
            <p className="text-lg text-muted mb-10 text-center">
              Every legendary paper started somewhere. Yours starts here.
            </p>
            <PaperDemo />
          </div>
        </section>

        <section className="py-20 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-medium mb-10 text-center">
              There's a reason you're still frustrated.
            </h2>
            <div className="border border-border">
              <div className="grid grid-cols-3 border-b border-border font-mono text-muted text-xs">
                <div className="p-4 border-r border-border uppercase tracking-wider">
                  Feature
                </div>
                <div className="p-4 border-r border-border uppercase tracking-wider">
                  Overleaf
                </div>
                <div className="p-4 bg-neutral-50 text-foreground tracking-tight font-medium text-sm">
                  LMMs-Lab Writer
                </div>
              </div>
              {comparisons.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 text-sm ${
                    i !== comparisons.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="p-4 border-r border-border font-medium text-muted">
                    {row.feature}
                  </div>
                  <div className="p-4 border-r border-border text-muted">
                    {row.overleaf}
                  </div>
                  <div className="p-4 flex items-start gap-2 bg-neutral-50 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-foreground mt-0.5" />
                    {row.writer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted text-center">
          Built by{" "}
          <Link
            href="https://www.lmms-lab.com/"
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            LMMs-Lab
          </Link>
        </div>
      </footer>
    </div>
  );
}
