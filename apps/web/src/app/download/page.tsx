import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

const platforms = [
  {
    name: "macOS",
    variants: [
      { label: "Apple Silicon", file: "LMMs-Lab_Writer_0.1.0_aarch64.dmg" },
      { label: "Intel", file: "LMMs-Lab_Writer_0.1.0_x64.dmg" },
    ],
  },
  {
    name: "Windows",
    variants: [
      { label: "64-bit", file: "LMMs-Lab_Writer_0.1.0_x64-setup.exe" },
    ],
  },
  {
    name: "Linux",
    variants: [
      { label: "AppImage", file: "LMMs-Lab_Writer_0.1.0_amd64.AppImage" },
      { label: "Debian", file: "lmms-lab-writer_0.1.0_amd64.deb" },
    ],
  },
];

const releaseUrl =
  "https://github.com/Luodian/latex-writer/releases/latest/download";

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-bar">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="font-mono text-sm tracking-tight">
              LMMs-Lab Writer
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="text-2xl font-medium tracking-tight mb-2">Download</h1>
          <p className="text-muted mb-10">Version 0.1.0</p>

          <div className="space-y-8">
            {platforms.map((platform) => (
              <div key={platform.name}>
                <h2 className="text-sm font-medium mb-3">{platform.name}</h2>
                <div className="flex flex-wrap gap-3">
                  {platform.variants.map((variant) => (
                    <Link
                      key={variant.file}
                      href={`${releaseUrl}/${variant.file}`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border hover:border-foreground transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {variant.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-sm font-medium mb-3">Requirements</h2>
            <ul className="text-sm text-muted space-y-1">
              <li>
                LaTeX distribution (
                <Link
                  href="https://www.tug.org/mactex/"
                  className="underline hover:text-foreground"
                  target="_blank"
                >
                  MacTeX
                </Link>
                ,{" "}
                <Link
                  href="https://www.tug.org/texlive/"
                  className="underline hover:text-foreground"
                  target="_blank"
                >
                  TeX Live
                </Link>
                , or{" "}
                <Link
                  href="https://miktex.org/"
                  className="underline hover:text-foreground"
                  target="_blank"
                >
                  MiKTeX
                </Link>
                )
              </li>
              <li>Git (optional, for version control)</li>
            </ul>
          </div>

          <div className="mt-10 pt-8 border-t border-border">
            <h2 className="text-sm font-medium mb-3">Build from source</h2>
            <pre className="text-sm text-muted bg-neutral-50 p-4 overflow-x-auto border border-border">
              {`git clone https://github.com/Luodian/latex-writer.git
cd latex-writer
pnpm install
pnpm tauri:build`}
            </pre>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 text-sm text-muted">
          Free and open source
        </div>
      </footer>
    </div>
  );
}
