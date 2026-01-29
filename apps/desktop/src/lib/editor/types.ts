export interface EditorSettings {
  // Display
  fontSize: number;
  lineHeight: number;
  wordWrap: "off" | "on" | "wordWrapColumn" | "bounded";
  wordWrapColumn: number;

  // Editing
  tabSize: number;
  insertSpaces: boolean;
  autoClosingBrackets: "always" | "languageDefined" | "beforeWhitespace" | "never";
  autoClosingQuotes: "always" | "languageDefined" | "beforeWhitespace" | "never";

  // Features
  minimap: boolean;
  lineNumbers: "on" | "off" | "relative" | "interval";
  renderWhitespace: "none" | "boundary" | "selection" | "trailing" | "all";
  smoothScrolling: boolean;
  cursorBlinking: "blink" | "smooth" | "phase" | "expand" | "solid";
  cursorStyle: "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin";

  // Formatting
  formatOnSave: boolean;
  formatOnPaste: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
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
  minimap: true,
  lineNumbers: "on",
  renderWhitespace: "selection",
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorStyle: "line",

  // Formatting
  formatOnSave: false,
  formatOnPaste: false,
};
