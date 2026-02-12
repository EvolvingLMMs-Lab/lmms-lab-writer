// Editor theme options - auto-follows app light/dark mode
export type EditorTheme = "one-light" | "one-dark";
export type TerminalShellMode = "auto" | "custom";

// Editor view modes
export type EditorViewMode = "file" | "git-diff";

export type GitDiffPreviewState = {
  path: string;
  staged: boolean;
  content: string;
  isLoading: boolean;
  error: string | null;
};

export type SplitPaneSide = "left" | "right";
export type DragSourcePane = "primary" | "split";

export type SplitPaneState = {
  side: SplitPaneSide;
  openTabs: string[];
  selectedFile?: string;
  content: string;
  isLoading: boolean;
  error: string | null;
  binaryPreviewUrl: string | null;
  pdfRefreshKey: number;
};

// Minimap configuration matching Monaco Editor API
export interface MinimapSettings {
  enabled: boolean;
  side: "left" | "right";
  showSlider: "always" | "mouseover";
  renderCharacters: boolean;
  size: "proportional" | "fill" | "fit";
  scale: number;
}

export interface EditorSettings {
  // Keybindings
  vimMode: boolean;

  // Display
  fontSize: number;
  lineHeight: number;
  wordWrap: "off" | "on" | "wordWrapColumn" | "bounded";
  wordWrapColumn: number;

  // Editing
  tabSize: number;
  insertSpaces: boolean;
  autoClosingBrackets:
    | "always"
    | "languageDefined"
    | "beforeWhitespace"
    | "never";
  autoClosingQuotes:
    | "always"
    | "languageDefined"
    | "beforeWhitespace"
    | "never";

  // Features
  minimap: MinimapSettings;
  lineNumbers: "on" | "off" | "relative" | "interval";
  renderWhitespace: "none" | "boundary" | "selection" | "trailing" | "all";
  smoothScrolling: boolean;
  cursorBlinking: "blink" | "smooth" | "phase" | "expand" | "solid";
  cursorStyle:
    | "line"
    | "block"
    | "underline"
    | "line-thin"
    | "block-outline"
    | "underline-thin";

  // Formatting
  formatOnSave: boolean;
  formatOnPaste: boolean;

  // Git
  gitAutoFetchEnabled: boolean;
  gitAutoFetchIntervalSeconds: number;

  // Terminal
  terminalShellMode: TerminalShellMode;
  terminalShellPath: string;
}

export const DEFAULT_MINIMAP_SETTINGS: MinimapSettings = {
  enabled: false,
  side: "right",
  showSlider: "mouseover",
  renderCharacters: false,
  size: "proportional",
  scale: 1,
};

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  vimMode: false,

  // Display
  fontSize: 14,
  lineHeight: 1.6,
  wordWrap: "off",
  wordWrapColumn: 80,

  // Editing
  tabSize: 2,
  insertSpaces: true,
  autoClosingBrackets: "languageDefined",
  autoClosingQuotes: "languageDefined",

  // Features
  minimap: DEFAULT_MINIMAP_SETTINGS,
  lineNumbers: "on",
  renderWhitespace: "selection",
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorStyle: "line",

  // Formatting
  formatOnSave: false,
  formatOnPaste: false,

  // Git
  gitAutoFetchEnabled: true,
  gitAutoFetchIntervalSeconds: 120,

  // Terminal
  terminalShellMode: "auto",
  terminalShellPath: "",
};
