import dynamic from "next/dynamic";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";

export const PANEL_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
} as const;

export const INSTANT_TRANSITION = { duration: 0 } as const;

export const MIN_PANEL_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 480;
export const MIN_TERMINAL_HEIGHT = 120;
export const MAX_TERMINAL_HEIGHT_RATIO = 0.5;

export const MonacoEditor = dynamic(
  () =>
    import("@/components/editor/monaco-editor").then((mod) => mod.MonacoEditor),
  { ssr: false },
);

export const GitMonacoDiffEditor = dynamic(
  () =>
    import("@/components/editor/monaco-diff-editor").then(
      (mod) => mod.MonacoDiffEditor,
    ),
  {
    ssr: false,
    loading: () => <EditorSkeleton className="h-full" />,
  },
);

export const EditorTerminal = dynamic(
  () => import("@/components/editor/terminal").then((mod) => mod.Terminal),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center px-4 text-sm text-muted">
        Loading terminal...
      </div>
    ),
  },
);

export const OpenCodePanel = dynamic(
  () =>
    import("@/components/opencode/opencode-panel").then(
      (mod) => mod.OpenCodePanel,
    ),
  {
    ssr: false,
    loading: () => <OpenCodePanelSkeleton />,
  },
);

export const OpenCodeDisconnectedDialog = dynamic(
  () =>
    import("@/components/opencode/opencode-disconnected-dialog").then(
      (mod) => mod.OpenCodeDisconnectedDialog,
    ),
  { ssr: false },
);

export const OpenCodeErrorBoundary = dynamic(
  () =>
    import("@/components/opencode/opencode-error-boundary").then(
      (mod) => mod.OpenCodeErrorBoundary,
    ),
  { ssr: false },
);

export const OpenCodeErrorDialog = dynamic(
  () =>
    import("@/components/opencode/opencode-error-dialog").then(
      (mod) => mod.OpenCodeErrorDialog,
    ),
  { ssr: false },
);

export const PdfViewer = dynamic(
  () => import("@/components/editor/pdf-viewer").then((mod) => mod.PdfViewer),
  { ssr: false },
);

function OpenCodePanelSkeleton() {
  return (
    <div className="flex flex-col bg-background h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-surface-tertiary animate-pulse" />
          <div className="h-4 w-24 bg-surface-tertiary animate-pulse" />
        </div>
        <div className="h-6 w-12 bg-surface-tertiary animate-pulse" />
      </div>
      <div className="flex-1 p-3 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div
              className="h-4 bg-surface-secondary animate-pulse"
              style={{ width: `${60 + i * 10}%` }}
            />
            <div
              className="h-4 bg-surface-secondary animate-pulse"
              style={{ width: `${40 + i * 10}%` }}
            />
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <div className="h-16 bg-accent-hover border border-border animate-pulse" />
      </div>
    </div>
  );
}
