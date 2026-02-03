export function MarkdownText({
  text,
  onFileClick,
}: {
  text: string;
  onFileClick?: (path: string) => void;
}) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  const isClickableFile = (content: string) =>
    onFileClick &&
    /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|py|js|ts|tsx|css|html|pdf|png|jpg)$/i.test(
      content,
    );

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, , code] = match;
            return (
              <pre
                key={i}
                className="bg-neutral-50 border border-neutral-200 p-3 overflow-x-auto text-[11px] my-3 font-mono leading-relaxed"
              >
                <code>{code?.trim() || ""}</code>
              </pre>
            );
          }
        }
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i}>
            {inlineParts.map((p, j) => {
              if (p.startsWith("`") && p.endsWith("`")) {
                const content = p.slice(1, -1);
                if (isClickableFile(content)) {
                  return (
                    <button
                      key={j}
                      onClick={() => onFileClick!(content)}
                      className="text-black font-medium font-mono text-[12px] hover:underline cursor-pointer bg-neutral-100 px-1"
                    >
                      {content}
                    </button>
                  );
                }
                return (
                  <code
                    key={j}
                    className="text-black font-medium font-mono text-[12px] bg-neutral-100 px-1"
                  >
                    {content}
                  </code>
                );
              }
              return p;
            })}
          </span>
        );
      })}
    </>
  );
}
