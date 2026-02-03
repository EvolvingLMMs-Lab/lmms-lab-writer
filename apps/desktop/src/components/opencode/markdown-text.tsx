import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

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
      table({ children }) {
        return (
          <div className="my-2 overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              {children}
            </table>
          </div>
        );
      },
      thead({ children }) {
        return <thead className="bg-neutral-50">{children}</thead>;
      },
      th({ children }) {
        return (
          <th className="border border-neutral-200 px-2 py-1 text-left font-medium text-neutral-700">
            {children}
          </th>
        );
      },
      td({ children }) {
        return (
          <td className="border border-neutral-200 px-2 py-1 text-neutral-600">
            {children}
          </td>
        );
      },
    };
  }, [onFileClick]);

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {text}
    </ReactMarkdown>
  );
}
