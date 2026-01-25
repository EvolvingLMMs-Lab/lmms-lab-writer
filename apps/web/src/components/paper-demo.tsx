"use client";

import { useState, useEffect } from "react";

function highlightLatex(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const commandMatch = remaining.match(/^(\\[a-zA-Z]+)/);
    if (commandMatch?.[1]) {
      parts.push(
        <span key={key++} className="text-neutral-400">
          {commandMatch[1]}
        </span>,
      );
      remaining = remaining.slice(commandMatch[1].length);
      continue;
    }

    const braceMatch = remaining.match(/^([{}])/);
    if (braceMatch) {
      parts.push(
        <span key={key++} className="text-neutral-400">
          {braceMatch[1]}
        </span>,
      );
      remaining = remaining.slice(1);
      continue;
    }

    const textMatch = remaining.match(/^[^\\{}]+/);
    if (textMatch) {
      parts.push(
        <span key={key++} className="text-foreground">
          {textMatch[0]}
        </span>,
      );
      remaining = remaining.slice(textMatch[0].length);
      continue;
    }

    parts.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return parts;
}

interface Paper {
  title: string;
  filename: string;
  prompt: string;
  content: string[];
}

const PAPERS: Paper[] = [
  {
    title: "Attention is All You Need",
    filename: "transformer.tex",
    prompt:
      "Write the abstract - we propose replacing RNNs entirely with self-attention for sequence transduction",
    content: [
      "\\documentclass{article}",
      "\\usepackage{amsmath}",
      "\\title{Attention is All You Need}",
      "\\author{Vaswani et al.}",
      "\\begin{document}",
      "\\maketitle",
      "",
      "\\section{Abstract}",
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder.",
      "The best performing models also connect the encoder and decoder through an attention mechanism.",
      "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
    ],
  },
  {
    title: "Seq2Seq Learning",
    filename: "seq2seq.tex",
    prompt:
      "Draft abstract for our seq2seq paper - stacked LSTMs encode to fixed vector, then decode to target",
    content: [
      "\\documentclass{article}",
      "\\usepackage{amsmath}",
      "\\title{Sequence to Sequence Learning with Neural Networks}",
      "\\author{Sutskever, Vinyals, Le}",
      "\\begin{document}",
      "\\maketitle",
      "",
      "\\section{Abstract}",
      "Deep Neural Networks (DNNs) are powerful models that have achieved excellent performance on difficult learning tasks.",
      "Although DNNs work well whenever large labeled training sets are available, they cannot be used to map sequences to sequences.",
      "In this paper, we present a general end-to-end approach to sequence learning that makes minimal assumptions on the sequence structure.",
    ],
  },
  {
    title: "AlphaGo",
    filename: "alphago.tex",
    prompt:
      "Write abstract - we combine deep neural networks with Monte Carlo tree search to master Go",
    content: [
      "\\documentclass{article}",
      "\\usepackage{amsmath}",
      "\\title{Mastering the Game of Go with Deep Neural Networks}",
      "\\author{Silver, Huang et al.}",
      "\\begin{document}",
      "\\maketitle",
      "",
      "\\section{Abstract}",
      "The game of Go has long been viewed as the most challenging of classic games for artificial intelligence owing to its enormous search space.",
      "Here we introduce a new approach to computer Go that uses value networks to evaluate board positions and policy networks to select moves.",
      "Using this search algorithm, our program AlphaGo achieved a 99.8\\% winning rate against other Go programs.",
    ],
  },
];

type Phase = "user-typing" | "agent-writing" | "user-command";

const NEW_COMMAND = "/new";

export function PaperDemo() {
  const [paperIndex, setPaperIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("user-typing");
  const [userTypedText, setUserTypedText] = useState("");
  const [commandText, setCommandText] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState("");

  const currentPaper = PAPERS[paperIndex] ?? PAPERS[0]!;
  const content = currentPaper.content;
  const prompt = currentPaper.prompt;

  useEffect(() => {
    if (phase === "user-typing") {
      if (userTypedText.length >= prompt.length) {
        const timeout = setTimeout(() => {
          setPhase("agent-writing");
        }, 500);
        return () => clearTimeout(timeout);
      }

      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const nextChunk = prompt.slice(
        userTypedText.length,
        userTypedText.length + chunkSize,
      );
      const delay = Math.floor(Math.random() * 50) + 30;

      const timeout = setTimeout(() => {
        setUserTypedText((prev) => prev + nextChunk);
      }, delay);

      return () => clearTimeout(timeout);
    }

    if (phase === "agent-writing") {
      if (currentLine >= content.length) {
        const timeout = setTimeout(() => {
          setPhase("user-command");
          setCommandText("");
        }, 1500);
        return () => clearTimeout(timeout);
      }

      const fullLine = content[currentLine] ?? "";

      if (currentText.length >= fullLine.length) {
        setLines((prev) => [...prev, fullLine]);
        setCurrentLine((prev) => prev + 1);
        setCurrentText("");
        return;
      }

      const chunkSize = Math.floor(Math.random() * 4) + 2;
      const nextChunk = fullLine.slice(
        currentText.length,
        currentText.length + chunkSize,
      );
      const delay = Math.floor(Math.random() * 30) + 15;

      const timeout = setTimeout(() => {
        setCurrentText((prev) => prev + nextChunk);
      }, delay);

      return () => clearTimeout(timeout);
    }

    if (phase === "user-command") {
      if (commandText.length >= NEW_COMMAND.length) {
        const timeout = setTimeout(() => {
          setPaperIndex((prev) => (prev + 1) % PAPERS.length);
          setPhase("user-typing");
          setUserTypedText("");
          setCommandText("");
          setLines([]);
          setCurrentLine(0);
          setCurrentText("");
        }, 800);
        return () => clearTimeout(timeout);
      }

      const delay = Math.floor(Math.random() * 80) + 60;

      const timeout = setTimeout(() => {
        setCommandText(NEW_COMMAND.slice(0, commandText.length + 1));
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [
    phase,
    userTypedText,
    currentLine,
    currentText,
    content,
    prompt,
    commandText,
  ]);

  return (
    <div className="border-2 border-foreground bg-white relative">
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-foreground bg-neutral-100">
        <span className="text-xs">{currentPaper.filename}</span>
        <div className="flex gap-1.5">
          {PAPERS.map((_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 border border-foreground transition-colors ${
                i === paperIndex ? "bg-foreground" : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 h-80 overflow-hidden">
        <div className="space-y-1 text-sm">
          {lines.map((line, i) => (
            <div key={i} className={`flex ${line === "" ? "h-4" : ""}`}>
              <span className="text-muted select-none mr-3 w-6 text-right shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 break-words">{highlightLatex(line)}</span>
            </div>
          ))}
          {phase === "agent-writing" && currentLine < content.length && (
            <div className="flex">
              <span className="text-muted select-none mr-3 w-6 text-right shrink-0">
                {lines.length + 1}
              </span>
              <span className="flex-1 break-words">
                {highlightLatex(currentText)}
                <span className="animate-pulse">▋</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-2 border-t-2 border-foreground text-xs bg-neutral-50">
        <div className="flex items-center min-w-0">
          {(phase === "user-typing" || phase === "user-command") && (
            <>
              <span className="text-muted mr-3 w-6 text-right shrink-0">
                User
              </span>
              <span className="truncate">
                {phase === "user-typing" ? userTypedText : commandText}
                <span className="animate-pulse">|</span>
              </span>
            </>
          )}
          {phase === "agent-writing" && (
            <>
              <span className="mr-3 w-6 shrink-0 flex justify-end">
                <span className="logo-bar-sm">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </span>
              <span>Agent is writing...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
