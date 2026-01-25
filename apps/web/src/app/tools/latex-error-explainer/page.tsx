"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Search, Copy, Check, Download, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorMatch {
  pattern: RegExp;
  title: string;
  explanation: string;
  fix: string;
  example?: string;
}

const LATEX_ERRORS: ErrorMatch[] = [
  {
    pattern: /Undefined control sequence.*\\([a-zA-Z]+)/i,
    title: "Undefined Control Sequence",
    explanation:
      "LaTeX doesn't recognize this command. This usually happens when you use a command from a package that isn't loaded, or when there's a typo in the command name.",
    fix: "1. Check if you spelled the command correctly\n2. Add the required package with \\usepackage{package-name}\n3. Common packages: amsmath (math), graphicx (images), hyperref (links)",
    example:
      "Error: \\includegraphics → Add \\usepackage{graphicx}\nError: \\textbf misspelled as \\textbo → Fix the typo",
  },
  {
    pattern: /Missing \$ inserted/i,
    title: "Missing $ (Math Mode Error)",
    explanation:
      "You used a math symbol or command outside of math mode. LaTeX requires math content to be wrapped in $ symbols or math environments.",
    fix: "Wrap the mathematical content in:\n• $...$ for inline math\n• \\[...\\] for display math\n• \\begin{equation}...\\end{equation} for numbered equations",
    example:
      "Wrong: The value is x^2\nRight: The value is $x^2$\n\nWrong: alpha = 0.5\nRight: $\\alpha = 0.5$",
  },
  {
    pattern: /Missing { inserted|Missing } inserted/i,
    title: "Missing Brace { or }",
    explanation:
      "There's an unmatched curly brace in your document. Every { must have a corresponding }.",
    fix: "1. Find the line number in the error\n2. Count braces on that line and nearby lines\n3. Add the missing brace\n4. Use an editor with brace matching to help",
    example:
      "Wrong: \\textbf{bold text\nRight: \\textbf{bold text}\n\nWrong: \\frac{a{b}\nRight: \\frac{a}{b}",
  },
  {
    pattern: /File .* not found/i,
    title: "File Not Found",
    explanation:
      "LaTeX can't find a file you're trying to include. This could be an image, a .tex file, or a .bib file.",
    fix: "1. Check the file path is correct\n2. Ensure the file exists in the right directory\n3. Check the file extension (sometimes you don't need to include it)\n4. Use relative paths from your main .tex file",
    example:
      "\\includegraphics{images/figure1} → Make sure images/figure1.png (or .jpg, .pdf) exists",
  },
  {
    pattern: /LaTeX Error: Environment .* undefined/i,
    title: "Undefined Environment",
    explanation:
      "You're using an environment (\\begin{...}...\\end{...}) that LaTeX doesn't recognize.",
    fix: "1. Check spelling of the environment name\n2. Load the package that defines the environment\n3. Common packages: amsmath (align, gather), algorithm2e (algorithm), listings (lstlisting)",
    example:
      "\\begin{align} → needs \\usepackage{amsmath}\n\\begin{lstlisting} → needs \\usepackage{listings}",
  },
  {
    pattern: /Overfull \\hbox/i,
    title: "Overfull hbox (Line Too Long)",
    explanation:
      "Some content extends beyond the text margin. This is a warning, not an error, but it can cause ugly output.",
    fix: "1. Rephrase the sentence to be shorter\n2. Add \\sloppy before the paragraph (less strict breaking)\n3. Use \\linebreak or \\\\ to force a line break\n4. For URLs, use \\url{} from hyperref package",
    example:
      "For long URLs: \\usepackage{hyperref} and \\url{https://...}\nFor long words: add \\hyphenation{long-word} in preamble",
  },
  {
    pattern: /Underfull \\hbox/i,
    title: "Underfull hbox (Line Too Short)",
    explanation:
      "A line has too few words, causing ugly spacing. This is usually a warning, not an error.",
    fix: "1. Add more content to the line\n2. Use \\mbox{} to prevent breaks in certain words\n3. Generally safe to ignore unless visually obvious",
  },
  {
    pattern: /Package .* Error/i,
    title: "Package Error",
    explanation:
      "A package encountered an error. This could be due to conflicting packages, missing options, or incorrect usage.",
    fix: "1. Read the full error message for specific guidance\n2. Check package documentation\n3. Try loading packages in a different order\n4. Look for package conflicts",
  },
  {
    pattern: /Too many }'s/i,
    title: "Too Many Closing Braces",
    explanation: "There are more } than { in your document.",
    fix: "1. Find the line number in the error\n2. Remove the extra } or add a missing {\n3. Use editor brace matching to find mismatches",
  },
  {
    pattern: /Misplaced alignment tab character/i,
    title: "Misplaced & Character",
    explanation:
      "The & character is used for alignment in tables and math, but you used it in regular text.",
    fix: "If you want a literal &, use \\& instead.\nIf you're in a table/align environment, check your column count.",
    example: "Wrong: Tom & Jerry\nRight: Tom \\& Jerry",
  },
  {
    pattern: /Double superscript|Double subscript/i,
    title: "Double Superscript/Subscript",
    explanation: "You wrote something like x^2^3 or x_1_2, which is ambiguous.",
    fix: "Use braces to group: x^{2^3} or x_{1_2}\nOr clarify: x^{23} if that's what you mean",
    example: "Wrong: $x^2^3$\nRight: $x^{2^3}$ or ${x^2}^3$",
  },
  {
    pattern: /Command .* already defined/i,
    title: "Command Already Defined",
    explanation:
      "You're trying to define a command that already exists (from LaTeX or a package).",
    fix: "1. Use \\renewcommand instead of \\newcommand to override\n2. Or choose a different name for your command\n3. Check which package defines the conflicting command",
  },
  {
    pattern: /Citation .* undefined/i,
    title: "Undefined Citation",
    explanation:
      "You're citing a reference that doesn't exist in your bibliography.",
    fix: "1. Check the citation key matches exactly (case-sensitive)\n2. Make sure your .bib file is included\n3. Run: pdflatex → bibtex → pdflatex → pdflatex",
    example:
      "\\cite{smith2020} requires an entry with key 'smith2020' in your .bib file",
  },
  {
    pattern: /Reference .* undefined/i,
    title: "Undefined Reference",
    explanation: "You're referencing a label (\\ref{...}) that doesn't exist.",
    fix: "1. Check the label exists: \\label{...}\n2. Check spelling matches exactly\n3. Compile twice to resolve references",
    example:
      "\\ref{fig:example} requires \\label{fig:example} on a figure/table/section",
  },
  {
    pattern: /LaTeX Error: \\begin{.*} on input line .* ended by \\end{.*}/i,
    title: "Mismatched Environment",
    explanation: "A \\begin{X} was closed with \\end{Y} instead of \\end{X}.",
    fix: "Make sure every \\begin{env} has a matching \\end{env}.\nCheck for typos in environment names.",
    example:
      "Wrong:\n\\begin{figure}\n...\n\\end{table}\n\nRight:\n\\begin{figure}\n...\n\\end{figure}",
  },
];

function matchError(input: string): ErrorMatch | null {
  const normalizedInput = input.toLowerCase();
  for (const error of LATEX_ERRORS) {
    if (error.pattern.test(input) || error.pattern.test(normalizedInput)) {
      return error;
    }
  }
  return null;
}

export default function LaTeXErrorExplainerPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ErrorMatch | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = useCallback(() => {
    const match = matchError(input);
    setResult(match);
    setSearched(true);
  }, [input]);

  const handleCopy = useCallback(() => {
    if (result) {
      const text = `${result.title}\n\n${result.explanation}\n\nHow to fix:\n${result.fix}${result.example ? `\n\nExample:\n${result.example}` : ""}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between">
          <Link href="/" className="font-medium">
            LMMs-Lab Writer
          </Link>
          <Link
            href="/download"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Download
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              LaTeX Error Explainer
            </h1>
            <p className="text-muted">
              Paste your LaTeX error message and get a human-readable
              explanation with fixes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="border border-border">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your LaTeX error here...

Example:
! Undefined control sequence.
l.42 \includegraphic
                    {figure.png}"
                className="w-full h-40 p-4 font-mono text-sm bg-transparent resize-none focus:outline-none"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={!input.trim()}
              className="w-full py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Explain This Error
            </button>
          </motion.div>

          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              {result ? (
                <div className="border border-border">
                  <div className="p-4 border-b border-border bg-neutral-50 flex items-center justify-between">
                    <h2 className="font-medium">{result.title}</h2>
                    <button
                      onClick={handleCopy}
                      className="text-muted hover:text-foreground transition-colors"
                      title="Copy explanation"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                        What it means
                      </h3>
                      <p className="text-sm">{result.explanation}</p>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                        How to fix
                      </h3>
                      <pre className="text-sm whitespace-pre-wrap font-mono bg-neutral-50 p-3 border border-border">
                        {result.fix}
                      </pre>
                    </div>

                    {result.example && (
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                          Example
                        </h3>
                        <pre className="text-sm whitespace-pre-wrap font-mono bg-neutral-50 p-3 border border-border">
                          {result.example}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-border p-6 text-center">
                  <p className="text-muted mb-2">
                    No match found for this error.
                  </p>
                  <p className="text-sm text-muted">
                    Try pasting the exact error message from your LaTeX compiler
                    output.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 p-6 border border-border bg-cream text-center"
          >
            <h3 className="font-medium mb-2">
              Tired of debugging LaTeX errors?
            </h3>
            <p className="text-sm text-muted mb-4">
              Let AI write your LaTeX while you focus on research. LMMs-Lab
              Writer lets Claude, Cursor, and Codex edit your papers directly.
            </p>
            <Link
              href="/download"
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="mt-12">
            <h3 className="font-medium mb-4">Common LaTeX Errors</h3>
            <div className="grid gap-2">
              {LATEX_ERRORS.slice(0, 8).map((error) => (
                <button
                  key={error.title}
                  onClick={() => {
                    setResult(error);
                    setSearched(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left p-3 border border-border hover:bg-neutral-50 transition-colors text-sm"
                >
                  {error.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted text-center">
          A free tool by{" "}
          <Link href="/" className="hover:text-foreground transition-colors">
            LMMs-Lab Writer
          </Link>
        </div>
      </footer>
    </div>
  );
}
