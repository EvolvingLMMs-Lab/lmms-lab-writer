// Editor theme options
export type EditorTheme =
  | "monochrome"
  | "github-light"
  | "solarized-light"
  | "one-dark"
  | "dracula"
  | "nord";

export const EDITOR_THEMES: {
  value: EditorTheme;
  label: string;
  description: string;
}[] = [
  {
    value: "monochrome",
    label: "Monochrome",
    description: "Clean black and white",
  },
  {
    value: "github-light",
    label: "GitHub Light",
    description: "Classic GitHub style",
  },
  {
    value: "solarized-light",
    label: "Solarized Light",
    description: "Easy on the eyes",
  },
  {
    value: "one-dark",
    label: "One Dark",
    description: "Atom's iconic dark theme",
  },
  { value: "dracula", label: "Dracula", description: "Popular dark theme" },
  { value: "nord", label: "Nord", description: "Arctic, bluish colors" },
];

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
  // Theme
  theme: EditorTheme;

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
  theme: "github-light",

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
};
