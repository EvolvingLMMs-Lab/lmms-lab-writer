import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { useMemo } from "react";

export function MarkdownText({
  text,
  onFileClick,
}: {
  text: string;
  onFileClick?: (path: string) => void;
}) {
  const components = useMemo<Components>(() => {
    const filePattern =
      /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|py|js|ts|tsx|css|html|pdf|png|jpg)$/i;

    return {
      pre({ children }) {
        return (
          <pre className="bg-neutral-50 border border-neutral-200 p-3 overflow-x-auto text-[11px] my-3 font-mono leading-relaxed">
            {children}
          </pre>
        );
      },
      code({ children, className }) {
        // Fenced code block (has language className like "language-xxx")
        // or is inside a <pre> — react-markdown wraps fenced blocks in <pre><code>
        const isInline = !className;
        const content = String(children).replace(/\n$/, "");

        if (isInline) {
          if (onFileClick && filePattern.test(content)) {
            return (
              <button
                onClick={() => onFileClick(content)}
                className="text-black font-medium font-mono text-[12px] hover:underline cursor-pointer bg-neutral-100 px-1"
              >
                {content}
              </button>
            );
          }
          return (
            <code className="text-black font-medium font-mono text-[12px] bg-neutral-100 px-1">
              {content}
            </code>
          );
        }

        // Block code — just render children, <pre> is handled above
        return <code className={className}>{children}</code>;
      },
      p({ children }) {
        return <p className="my-1.5">{children}</p>;
      },
      ul({ children }) {
        return <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>;
      },
      ol({ children }) {
        return <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>;
      },
      li({ children }) {
        return <li className="text-[13px]">{children}</li>;
      },
      a({ href, children }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {children}
          </a>
        );
      },
      strong({ children }) {
        return <strong className="font-semibold">{children}</strong>;
      },
      h1({ children }) {
        return <h1 className="text-sm font-bold mt-3 mb-1">{children}</h1>;
      },
      h2({ children }) {
        return <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>;
      },
      h3({ children }) {
        return <h3 className="text-[13px] font-bold mt-2 mb-1">{children}</h3>;
      },
      blockquote({ children }) {
        return (
          <blockquote className="border-l-2 border-neutral-300 pl-3 my-2 text-neutral-500 italic">
            {children}
          </blockquote>
        );
      },
    };
  }, [onFileClick]);

  return (
    <ReactMarkdown components={components}>
      {text}
    </ReactMarkdown>
  );
}
