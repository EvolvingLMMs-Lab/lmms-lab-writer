import Link from "next/link";
import { Header } from "@/components/header";
import {
  DownloadSection,
  RequirementsSection,
  BuildSection,
} from "@/components/download-sections";

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-medium tracking-tight mb-2">Download</h1>
          <p className="text-muted mb-10">Version 0.1.0</p>

          <DownloadSection />
          <RequirementsSection />
          <BuildSection />
        </div>
      </main>

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted">
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
