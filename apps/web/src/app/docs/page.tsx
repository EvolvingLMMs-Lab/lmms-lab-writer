import Link from "next/link";
import { Header } from "@/components/header";
import { DocsContent } from "@/components/docs-sections";

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <DocsContent />

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted">
          <Link
            href="https://github.com/EvolvingLMMs-Lab/lmms-lab-writer"
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Edit on GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
