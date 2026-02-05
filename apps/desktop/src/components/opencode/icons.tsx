import {
  Archive,
  BookOpenText,
  CaretDown,
  CaretRight,
  Check,
  File,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  Gear,
  Globe,
  Image,
  ListChecks,
  Monitor,
  NotePencil,
  PaperPlaneRight,
  Plug,
  Plus,
  Question,
  Robot,
  StarFour,
  Stop,
  Terminal,
  TextT,
  Trash,
  Warning,
} from "@phosphor-icons/react";

export function ProviderIcon({ providerId }: { providerId?: string }) {
  if (!providerId) return null;

  const iconClass = "size-4 text-neutral-500";
  const lowerProvider = providerId.toLowerCase();

  if (lowerProvider.includes("anthropic") || lowerProvider.includes("claude")) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.303 3.073c-.32-.907-1.662-.907-1.982 0L12 12.573l-3.321-9.5c-.32-.907-1.662-.907-1.982 0L3.073 14.697c-.32.907.187 1.803 1.134 1.803h3.586l2.207 6.427c.32.907 1.662.907 1.982 0l2.207-6.427h3.586c.947 0 1.454-.896 1.134-1.803L17.303 3.073z" />
      </svg>
    );
  }

  if (lowerProvider.includes("openai") || lowerProvider.includes("gpt")) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681v6.722zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    );
  }

  if (lowerProvider.includes("google") || lowerProvider.includes("gemini")) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018s3.132-7.018 7-7.018c1.89 0 3.47.697 4.682 1.829l-1.974 1.978c-.517-.548-1.417-1.19-2.708-1.19-2.31 0-4.187 1.956-4.187 4.401 0 2.446 1.877 4.401 4.187 4.401 2.688 0 3.693-1.955 3.852-2.963h-3.852v-2.611h6.403c.063.35.116.697.116 1.15 0 4.027-2.687 6.041-6.519 6.041z" />
      </svg>
    );
  }

  return <Monitor className={iconClass} />;
}

export function ToolIcon({ tool }: { tool: string }) {
  const baseClassName = "size-4 flex-shrink-0";
  const toolLower = tool.toLowerCase();

  switch (toolLower) {
    // Terminal/Shell operations
    case "bash":
      return <Terminal className={`${baseClassName} text-emerald-600`} />;

    // File reading - eye/book icon in blue
    case "read":
      return <BookOpenText className={`${baseClassName} text-sky-500`} />;

    // File writing - file plus icon in green
    case "write":
      return <FilePlus className={`${baseClassName} text-green-500`} />;

    // File editing - pencil icon in amber
    case "edit":
      return <NotePencil className={`${baseClassName} text-amber-500`} />;

    // Search operations
    case "glob":
      return <FolderOpen className={`${baseClassName} text-violet-500`} />;
    case "grep":
      return <TextT className={`${baseClassName} text-violet-500`} />;

    // Web operations
    case "webfetch":
    case "websearch":
      return <Globe className={`${baseClassName} text-blue-500`} />;

    // Agent/Task operations
    case "task":
      return <Robot className={`${baseClassName} text-purple-500`} />;

    // Todo/Task list operations
    case "todowrite":
    case "todocreate":
    case "todoread":
    case "todolist":
    case "todoupdate":
      return <ListChecks className={`${baseClassName} text-teal-500`} />;

    // MCP/Plugin operations
    case "mcp":
      return <Plug className={`${baseClassName} text-orange-500`} />;

    // Question/User input
    case "question":
    case "askuserquestion":
      return <Question className={`${baseClassName} text-pink-500`} />;

    // List directory
    case "list":
      return <Folder className={`${baseClassName} text-yellow-600`} />;

    default:
      return <StarFour className={`${baseClassName} text-neutral-400`} />;
  }
}

export function ChevronIcon({ className }: { className?: string }) {
  return <CaretDown className={className} />;
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return <CaretRight className={className} />;
}

export function WarningIcon({ className }: { className?: string }) {
  return <Warning className={className} />;
}

export function TrashIcon({ className }: { className?: string }) {
  return <Trash className={className} />;
}

export function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} />;
}

export function CheckIcon({ className }: { className?: string }) {
  return <Check className={className} weight="bold" />;
}

export function FolderIcon({ className }: { className?: string }) {
  return <Folder className={className} />;
}

export function TerminalIcon({ className }: { className?: string }) {
  return <Terminal className={className} />;
}

export function SendIcon({ className }: { className?: string }) {
  return <PaperPlaneRight className={className} />;
}

export function ImageIcon({ className }: { className?: string }) {
  return <Image className={className} />;
}

export function StopIcon({ className }: { className?: string }) {
  return <Stop className={className} />;
}

export function SettingsIcon({ className }: { className?: string }) {
  return <Gear className={className} />;
}

export function DisclosureTriangle({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <CaretRight
      className={`size-3 transition-transform ${open ? "rotate-90" : ""} ${className || ""}`}
      weight="fill"
    />
  );
}

export function FileTypeIcon({ filename }: { filename: string }) {
  const className = "size-4 flex-shrink-0";
  const ext = filename.split(".").pop()?.toLowerCase();

  // PDF files - red
  if (ext === "pdf") {
    return <File className={`${className} text-red-500`} />;
  }

  // Log and auxiliary files - gray
  if (ext === "log" || ext === "aux" || ext === "fdb_latexmk") {
    return <FileText className={`${className} text-neutral-400`} />;
  }

  // LaTeX files - teal
  if (ext === "tex" || ext === "bib" || ext === "cls" || ext === "sty") {
    return <FileText className={`${className} text-teal-600`} />;
  }

  // Archive files - amber
  if (ext === "gz" || ext === "synctex" || ext === "xdv" || ext === "zip" || ext === "tar") {
    return <Archive className={`${className} text-amber-500`} />;
  }

  // TypeScript/JavaScript files - blue/yellow
  if (ext === "ts" || ext === "tsx") {
    return <FileText className={`${className} text-blue-500`} />;
  }
  if (ext === "js" || ext === "jsx" || ext === "mjs") {
    return <FileText className={`${className} text-yellow-500`} />;
  }

  // Python files - green
  if (ext === "py" || ext === "pyw" || ext === "pyi") {
    return <FileText className={`${className} text-green-500`} />;
  }

  // Rust files - orange
  if (ext === "rs") {
    return <FileText className={`${className} text-orange-500`} />;
  }

  // Go files - cyan
  if (ext === "go") {
    return <FileText className={`${className} text-cyan-500`} />;
  }

  // HTML/CSS files - orange/pink
  if (ext === "html" || ext === "htm") {
    return <FileText className={`${className} text-orange-600`} />;
  }
  if (ext === "css" || ext === "scss" || ext === "sass" || ext === "less") {
    return <FileText className={`${className} text-pink-500`} />;
  }

  // Config files - purple
  if (ext === "json" || ext === "yaml" || ext === "yml" || ext === "toml") {
    return <FileText className={`${className} text-violet-500`} />;
  }

  // Markdown files - indigo
  if (ext === "md" || ext === "mdx") {
    return <FileText className={`${className} text-indigo-500`} />;
  }

  // Shell scripts - emerald
  if (ext === "sh" || ext === "bash" || ext === "zsh") {
    return <FileText className={`${className} text-emerald-500`} />;
  }

  // Image files - rose
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "svg" || ext === "webp") {
    return <Image className={`${className} text-rose-500`} />;
  }

  return <File className={`${className} text-neutral-500`} />;
}
