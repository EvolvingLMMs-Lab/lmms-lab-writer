"use client";

import { useRef, memo, useCallback } from "react";
import Editor, { Monaco, OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { EditorSettings } from "@/lib/editor/types";

// Monochrome theme definition matching the project's design system
const defineMonochromeTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme("monochrome", {
    base: "vs",
    inherit: true,
    rules: [
      // General tokens
      { token: "", foreground: "0a0a0a", background: "ffffff" },
      { token: "comment", foreground: "737373", fontStyle: "italic" },
      { token: "comment.line", foreground: "737373", fontStyle: "italic" },
      { token: "comment.block", foreground: "737373", fontStyle: "italic" },

      // Keywords and control flow
      { token: "keyword", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "keyword.control", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "keyword.operator", foreground: "0a0a0a" },

      // Strings
      { token: "string", foreground: "404040" },
      { token: "string.quoted", foreground: "404040" },
      { token: "string.escape", foreground: "0a0a0a", fontStyle: "bold" },

      // Numbers
      { token: "number", foreground: "404040" },
      { token: "number.float", foreground: "404040" },

      // Variables and identifiers
      { token: "variable", foreground: "0a0a0a" },
      { token: "variable.parameter", foreground: "404040" },
      { token: "variable.other", foreground: "0a0a0a" },

      // Functions
      { token: "entity.name.function", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "support.function", foreground: "0a0a0a", fontStyle: "bold" },

      // Types and classes
      { token: "entity.name.type", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "entity.name.class", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "support.type", foreground: "0a0a0a" },
      { token: "support.class", foreground: "0a0a0a" },

      // Tags (HTML, XML, LaTeX)
      { token: "tag", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "tag.attribute.name", foreground: "404040" },
      { token: "tag.attribute.value", foreground: "404040" },

      // Operators and punctuation
      { token: "operator", foreground: "0a0a0a" },
      { token: "delimiter", foreground: "404040" },
      { token: "delimiter.bracket", foreground: "404040" },

      // Constants
      { token: "constant", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "constant.language", foreground: "0a0a0a", fontStyle: "bold" },

      // LaTeX specific tokens
      { token: "keyword.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "keyword.control.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "support.function.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "variable.parameter.latex", foreground: "404040" },
      { token: "punctuation.definition.latex", foreground: "0a0a0a" },
      { token: "markup.heading.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "markup.italic.latex", foreground: "0a0a0a", fontStyle: "italic" },
      { token: "markup.bold.latex", foreground: "0a0a0a", fontStyle: "bold" },

      // Markdown
      { token: "markup.heading", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "markup.bold", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "markup.italic", foreground: "0a0a0a", fontStyle: "italic" },
      { token: "markup.underline.link", foreground: "404040" },

      // Invalid/Error
      { token: "invalid", foreground: "0a0a0a", fontStyle: "underline" },
    ],
    colors: {
      // Editor background and foreground
      "editor.background": "#ffffff",
      "editor.foreground": "#0a0a0a",

      // Line numbers
      "editorLineNumber.foreground": "#a3a3a3",
      "editorLineNumber.activeForeground": "#0a0a0a",

      // Cursor
      "editorCursor.foreground": "#0a0a0a",
      "editorCursor.background": "#ffffff",

      // Selection
      "editor.selectionBackground": "#e5e5e5",
      "editor.selectionHighlightBackground": "#e5e5e5",
      "editor.inactiveSelectionBackground": "#f0f0f0",

      // Current line highlight
      "editor.lineHighlightBackground": "#f5f5f5",
      "editor.lineHighlightBorder": "#00000000",

      // Matching brackets
      "editorBracketMatch.background": "#e5e5e5",
      "editorBracketMatch.border": "#a3a3a3",

      // Indent guides
      "editorIndentGuide.background": "#e5e5e5",
      "editorIndentGuide.activeBackground": "#a3a3a3",

      // Whitespace
      "editorWhitespace.foreground": "#e5e5e5",

      // Gutter
      "editorGutter.background": "#ffffff",
      "editorGutter.modifiedBackground": "#737373",
      "editorGutter.addedBackground": "#404040",
      "editorGutter.deletedBackground": "#0a0a0a",

      // Scrollbar
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#d4d4d4",
      "scrollbarSlider.hoverBackground": "#a3a3a3",
      "scrollbarSlider.activeBackground": "#737373",

      // Widget (autocomplete, hover, etc.)
      "editorWidget.background": "#fafafa",
      "editorWidget.border": "#e5e5e5",
      "editorWidget.foreground": "#0a0a0a",

      // Suggest widget (autocomplete dropdown)
      "editorSuggestWidget.background": "#fafafa",
      "editorSuggestWidget.border": "#e5e5e5",
      "editorSuggestWidget.foreground": "#0a0a0a",
      "editorSuggestWidget.selectedBackground": "#e5e5e5",
      "editorSuggestWidget.highlightForeground": "#0a0a0a",

      // Hover widget
      "editorHoverWidget.background": "#fafafa",
      "editorHoverWidget.border": "#e5e5e5",
      "editorHoverWidget.foreground": "#0a0a0a",

      // Find/Replace
      "editor.findMatchBackground": "#e5e5e5",
      "editor.findMatchHighlightBackground": "#f0f0f0",
      "editor.findMatchBorder": "#a3a3a3",

      // Word highlight
      "editor.wordHighlightBackground": "#f0f0f0",
      "editor.wordHighlightStrongBackground": "#e5e5e5",

      // Minimap
      "minimap.background": "#fafafa",
      "minimap.selectionHighlight": "#d4d4d4",
      "minimapSlider.background": "#d4d4d420",
      "minimapSlider.hoverBackground": "#d4d4d440",
      "minimapSlider.activeBackground": "#d4d4d460",

      // Overview ruler (right side scrollbar annotations)
      "editorOverviewRuler.border": "#e5e5e5",
      "editorOverviewRuler.findMatchForeground": "#a3a3a3",
      "editorOverviewRuler.selectionHighlightForeground": "#a3a3a3",

      // Error/Warning
      "editorError.foreground": "#0a0a0a",
      "editorWarning.foreground": "#737373",
      "editorInfo.foreground": "#a3a3a3",

      // Bracket pair colorization (monochrome)
      "editorBracketHighlight.foreground1": "#0a0a0a",
      "editorBracketHighlight.foreground2": "#404040",
      "editorBracketHighlight.foreground3": "#737373",
      "editorBracketHighlight.unexpectedBracket.foreground": "#0a0a0a",
    },
  });
};

// Register LaTeX language support
const registerLaTeXLanguage = (monaco: Monaco) => {
  // Register the LaTeX language
  monaco.languages.register({ id: "latex", extensions: [".tex", ".sty", ".cls", ".bib"] });

  // Set language configuration
  monaco.languages.setLanguageConfiguration("latex", {
    comments: {
      lineComment: "%",
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "$", close: "$" },
      { open: "$$", close: "$$" },
      { open: '"', close: '"' },
      { open: "`", close: "'" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "$", close: "$" },
      { open: '"', close: '"' },
    ],
    folding: {
      markers: {
        start: /\\begin\{/,
        end: /\\end\{/,
      },
    },
    indentationRules: {
      increaseIndentPattern: /\\begin\{(?!document)/,
      decreaseIndentPattern: /\\end\{(?!document)/,
    },
  });

  // Set tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider("latex", {
    defaultToken: "",
    tokenPostfix: ".latex",

    // Common LaTeX commands
    commands: [
      "documentclass",
      "usepackage",
      "begin",
      "end",
      "section",
      "subsection",
      "subsubsection",
      "chapter",
      "part",
      "paragraph",
      "subparagraph",
      "title",
      "author",
      "date",
      "maketitle",
      "tableofcontents",
      "include",
      "input",
      "bibliography",
      "bibliographystyle",
      "cite",
      "ref",
      "label",
      "footnote",
      "caption",
      "item",
      "textbf",
      "textit",
      "texttt",
      "emph",
      "underline",
      "newcommand",
      "renewcommand",
      "newenvironment",
      "def",
      "let",
      "if",
      "else",
      "fi",
      "ifx",
      "newline",
      "linebreak",
      "pagebreak",
      "newpage",
      "clearpage",
      "hspace",
      "vspace",
      "hfill",
      "vfill",
      "centering",
      "raggedright",
      "raggedleft",
      "frac",
      "sqrt",
      "sum",
      "prod",
      "int",
      "lim",
      "infty",
      "partial",
      "nabla",
      "alpha",
      "beta",
      "gamma",
      "delta",
      "epsilon",
      "theta",
      "lambda",
      "mu",
      "pi",
      "sigma",
      "omega",
    ],

    // Environments
    environments: [
      "document",
      "figure",
      "table",
      "tabular",
      "equation",
      "align",
      "gather",
      "multline",
      "itemize",
      "enumerate",
      "description",
      "quote",
      "quotation",
      "verse",
      "center",
      "flushleft",
      "flushright",
      "abstract",
      "verbatim",
      "lstlisting",
      "minipage",
      "array",
      "matrix",
      "pmatrix",
      "bmatrix",
      "cases",
      "split",
      "theorem",
      "lemma",
      "proof",
      "definition",
      "corollary",
      "example",
      "remark",
    ],

    tokenizer: {
      root: [
        // Comments
        [/%.*$/, "comment"],

        // Math mode
        [/\$\$/, { token: "string.math", next: "@mathDisplay" }],
        [/\$/, { token: "string.math", next: "@mathInline" }],
        [/\\\[/, { token: "string.math", next: "@mathDisplay" }],
        [/\\\(/, { token: "string.math", next: "@mathInline" }],

        // Commands with arguments
        [
          /\\(begin|end)\s*\{/,
          { token: "keyword.control", next: "@environment" },
        ],
        [
          /\\(documentclass|usepackage)\s*(\[)?/,
          { token: "keyword.control", next: "@options" },
        ],

        // Section commands
        [
          /\\(section|subsection|subsubsection|chapter|part|paragraph|subparagraph)\*?\s*\{/,
          { token: "markup.heading", next: "@braceArg" },
        ],

        // Reference commands
        [/\\(ref|cite|label|pageref|eqref)\s*\{/, { token: "keyword", next: "@braceArg" }],

        // Text formatting
        [/\\(textbf|textit|texttt|emph|underline)\s*\{/, { token: "keyword", next: "@braceArg" }],

        // Other commands
        [/\\[a-zA-Z@]+\*?/, "keyword"],

        // Special characters
        [/\\[{}$&#%_^~\\]/, "constant"],

        // Curly braces groups
        [/\{/, { token: "delimiter.bracket", next: "@braceGroup" }],
        [/\}/, "delimiter.bracket"],

        // Square brackets
        [/\[/, "delimiter.bracket"],
        [/\]/, "delimiter.bracket"],

        // Numbers
        [/-?\d+(\.\d+)?/, "number"],
      ],

      mathInline: [
        [/\$/, { token: "string.math", next: "@pop" }],
        [/\\\)/, { token: "string.math", next: "@pop" }],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^$\\]+/, "string.math"],
        [/./, "string.math"],
      ],

      mathDisplay: [
        [/\$\$/, { token: "string.math", next: "@pop" }],
        [/\\\]/, { token: "string.math", next: "@pop" }],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^$\\]+/, "string.math"],
        [/./, "string.math"],
      ],

      environment: [
        [/[a-zA-Z*]+/, "variable.parameter"],
        [/\}/, { token: "keyword.control", next: "@pop" }],
      ],

      options: [
        [/\]/, { token: "delimiter.bracket", next: "@pop" }],
        [/\{/, { token: "delimiter.bracket", next: "@braceArg" }],
        [/[^\]\{]+/, "variable.parameter"],
      ],

      braceArg: [
        [/\{/, { token: "delimiter.bracket", next: "@braceArg" }],
        [/\}/, { token: "delimiter.bracket", next: "@pop" }],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^{}\\]+/, ""],
      ],

      braceGroup: [
        [/\{/, { token: "delimiter.bracket", next: "@braceGroup" }],
        [/\}/, { token: "delimiter.bracket", next: "@pop" }],
        [/%.*$/, "comment"],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^{}%\\]+/, ""],
      ],
    },
  });

  // Register completions provider
  monaco.languages.registerCompletionItemProvider("latex", {
    triggerCharacters: ["\\", "{"],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Get the character before the cursor
      const lineContent = model.getLineContent(position.lineNumber);
      const charBefore = lineContent[position.column - 2];

      const suggestions: editor.languages.CompletionItem[] = [];

      if (charBefore === "\\") {
        // Command completions
        const commands = [
          // Document structure
          { label: "documentclass", insertText: "documentclass{${1:article}}", detail: "Document class" },
          { label: "usepackage", insertText: "usepackage{${1:package}}", detail: "Import package" },
          { label: "begin", insertText: "begin{${1:environment}}\n\t$0\n\\end{${1:environment}}", detail: "Begin environment" },
          { label: "section", insertText: "section{${1:title}}", detail: "Section" },
          { label: "subsection", insertText: "subsection{${1:title}}", detail: "Subsection" },
          { label: "subsubsection", insertText: "subsubsection{${1:title}}", detail: "Subsubsection" },
          { label: "chapter", insertText: "chapter{${1:title}}", detail: "Chapter" },
          { label: "title", insertText: "title{${1:title}}", detail: "Document title" },
          { label: "author", insertText: "author{${1:name}}", detail: "Author" },
          { label: "date", insertText: "date{${1:\\today}}", detail: "Date" },
          { label: "maketitle", insertText: "maketitle", detail: "Make title" },
          { label: "tableofcontents", insertText: "tableofcontents", detail: "Table of contents" },

          // Text formatting
          { label: "textbf", insertText: "textbf{${1:text}}", detail: "Bold text" },
          { label: "textit", insertText: "textit{${1:text}}", detail: "Italic text" },
          { label: "texttt", insertText: "texttt{${1:text}}", detail: "Monospace text" },
          { label: "emph", insertText: "emph{${1:text}}", detail: "Emphasized text" },
          { label: "underline", insertText: "underline{${1:text}}", detail: "Underlined text" },

          // References
          { label: "label", insertText: "label{${1:key}}", detail: "Label" },
          { label: "ref", insertText: "ref{${1:key}}", detail: "Reference" },
          { label: "cite", insertText: "cite{${1:key}}", detail: "Citation" },
          { label: "footnote", insertText: "footnote{${1:text}}", detail: "Footnote" },
          { label: "caption", insertText: "caption{${1:text}}", detail: "Caption" },

          // Math
          { label: "frac", insertText: "frac{${1:num}}{${2:den}}", detail: "Fraction" },
          { label: "sqrt", insertText: "sqrt{${1:x}}", detail: "Square root" },
          { label: "sum", insertText: "sum_{${1:i=1}}^{${2:n}}", detail: "Summation" },
          { label: "int", insertText: "int_{${1:a}}^{${2:b}}", detail: "Integral" },
          { label: "lim", insertText: "lim_{${1:x \\to \\infty}}", detail: "Limit" },

          // Greek letters
          { label: "alpha", insertText: "alpha", detail: "Greek alpha" },
          { label: "beta", insertText: "beta", detail: "Greek beta" },
          { label: "gamma", insertText: "gamma", detail: "Greek gamma" },
          { label: "delta", insertText: "delta", detail: "Greek delta" },
          { label: "epsilon", insertText: "epsilon", detail: "Greek epsilon" },
          { label: "theta", insertText: "theta", detail: "Greek theta" },
          { label: "lambda", insertText: "lambda", detail: "Greek lambda" },
          { label: "mu", insertText: "mu", detail: "Greek mu" },
          { label: "pi", insertText: "pi", detail: "Greek pi" },
          { label: "sigma", insertText: "sigma", detail: "Greek sigma" },
          { label: "omega", insertText: "omega", detail: "Greek omega" },
          { label: "infty", insertText: "infty", detail: "Infinity" },

          // Spacing
          { label: "hspace", insertText: "hspace{${1:1cm}}", detail: "Horizontal space" },
          { label: "vspace", insertText: "vspace{${1:1cm}}", detail: "Vertical space" },
          { label: "newline", insertText: "newline", detail: "New line" },
          { label: "newpage", insertText: "newpage", detail: "New page" },

          // Lists
          { label: "item", insertText: "item ", detail: "List item" },

          // Includes
          { label: "input", insertText: "input{${1:file}}", detail: "Input file" },
          { label: "include", insertText: "include{${1:file}}", detail: "Include file" },
        ];

        commands.forEach((cmd) => {
          suggestions.push({
            label: cmd.label,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: cmd.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: cmd.detail,
            range,
          });
        });
      }

      // Environment completions after \begin{
      const linePrefix = lineContent.substring(0, position.column - 1);
      if (/\\begin\{$/.test(linePrefix)) {
        const environments = [
          { label: "document", detail: "Main document environment" },
          { label: "figure", detail: "Figure environment" },
          { label: "table", detail: "Table environment" },
          { label: "tabular", detail: "Tabular environment" },
          { label: "equation", detail: "Equation environment" },
          { label: "align", detail: "Aligned equations" },
          { label: "gather", detail: "Gathered equations" },
          { label: "itemize", detail: "Bullet list" },
          { label: "enumerate", detail: "Numbered list" },
          { label: "description", detail: "Description list" },
          { label: "center", detail: "Centered content" },
          { label: "verbatim", detail: "Verbatim text" },
          { label: "abstract", detail: "Abstract" },
          { label: "quote", detail: "Quote block" },
          { label: "minipage", detail: "Minipage" },
          { label: "array", detail: "Math array" },
          { label: "matrix", detail: "Matrix" },
          { label: "pmatrix", detail: "Parenthesized matrix" },
          { label: "bmatrix", detail: "Bracketed matrix" },
          { label: "cases", detail: "Cases" },
          { label: "theorem", detail: "Theorem" },
          { label: "lemma", detail: "Lemma" },
          { label: "proof", detail: "Proof" },
          { label: "definition", detail: "Definition" },
        ];

        environments.forEach((env) => {
          suggestions.push({
            label: env.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: `${env.label}}\n\t$0\n\\\\end{${env.label}}`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: env.detail,
            range,
          });
        });
      }

      return { suggestions };
    },
  });
};

type Props = {
  content?: string;
  readOnly?: boolean;
  className?: string;
  language?: string;
  editorSettings?: Partial<EditorSettings>;
  onContentChange?: (content: string) => void;
};

export const MonacoEditor = memo(function MonacoEditor({
  content = "",
  readOnly = false,
  className = "",
  language = "latex",
  editorSettings,
  onContentChange,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isExternalUpdateRef = useRef(false);
  const contentRef = useRef(content);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Define and set the monochrome theme
    defineMonochromeTheme(monaco);
    monaco.editor.setTheme("monochrome");

    // Register LaTeX language support
    registerLaTeXLanguage(monaco);

    // Focus the editor
    editor.focus();

    // Custom keybindings
    // Toggle comment with Cmd/Ctrl + /
    editor.addAction({
      id: "toggle-latex-comment",
      label: "Toggle LaTeX Comment",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
      run: (ed) => {
        const selection = ed.getSelection();
        if (!selection) return;

        const model = ed.getModel();
        if (!model) return;

        const edits: editor.IIdentifiedSingleEditOperation[] = [];

        for (let lineNumber = selection.startLineNumber; lineNumber <= selection.endLineNumber; lineNumber++) {
          const lineContent = model.getLineContent(lineNumber);
          const trimmedLine = lineContent.trimStart();
          const leadingSpaces = lineContent.length - trimmedLine.length;

          if (trimmedLine.startsWith("%")) {
            // Remove comment
            const commentLength = trimmedLine.startsWith("% ") ? 2 : 1;
            edits.push({
              range: {
                startLineNumber: lineNumber,
                startColumn: leadingSpaces + 1,
                endLineNumber: lineNumber,
                endColumn: leadingSpaces + 1 + commentLength,
              },
              text: "",
            });
          } else {
            // Add comment
            edits.push({
              range: {
                startLineNumber: lineNumber,
                startColumn: leadingSpaces + 1,
                endLineNumber: lineNumber,
                endColumn: leadingSpaces + 1,
              },
              text: "% ",
            });
          }
        }

        ed.executeEdits("toggle-comment", edits);
      },
    });
  }, []);

  const handleChange: OnChange = useCallback(
    (value) => {
      if (isExternalUpdateRef.current) return;
      if (value !== undefined) {
        contentRef.current = value;
        onContentChange?.(value);
      }
    },
    [onContentChange]
  );

  // Handle external content updates
  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineMonochromeTheme(monaco);
    registerLaTeXLanguage(monaco);
  }, []);

  // Detect language from content or file extension
  const detectLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      tex: "latex",
      latex: "latex",
      bib: "bibtex",
      js: "javascript",
      ts: "typescript",
      jsx: "javascript",
      tsx: "typescript",
      py: "python",
      md: "markdown",
      json: "json",
      css: "css",
      html: "html",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
    };
    return languageMap[lang.toLowerCase()] || lang;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <Editor
        height="100%"
        language={detectLanguage(language)}
        value={content}
        theme="monochrome"
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        onChange={handleChange}
        options={{
          readOnly,
          fontSize: editorSettings?.fontSize ?? 14,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
          fontLigatures: false,
          lineNumbers: editorSettings?.lineNumbers ?? "on",
          lineHeight: editorSettings?.lineHeight ?? 1.6,
          letterSpacing: 0,
          renderWhitespace: editorSettings?.renderWhitespace ?? "selection",
          tabSize: editorSettings?.tabSize ?? 2,
          insertSpaces: editorSettings?.insertSpaces ?? true,
          wordWrap: editorSettings?.wordWrap ?? "off",
          wordWrapColumn: editorSettings?.wordWrapColumn ?? 80,
          wrappingIndent: "indent",
          automaticLayout: true,
          minimap: {
            enabled: editorSettings?.minimap?.enabled ?? false,
            side: editorSettings?.minimap?.side ?? "right",
            size: editorSettings?.minimap?.size ?? "proportional",
            maxColumn: 120,
            renderCharacters: editorSettings?.minimap?.renderCharacters ?? false,
            scale: editorSettings?.minimap?.scale ?? 1,
            showSlider: editorSettings?.minimap?.showSlider ?? "mouseover",
          },
          scrollBeyondLastLine: false,
          smoothScrolling: editorSettings?.smoothScrolling ?? true,
          cursorBlinking: editorSettings?.cursorBlinking ?? "smooth",
          cursorSmoothCaretAnimation: "on",
          cursorStyle: editorSettings?.cursorStyle ?? "line",
          cursorWidth: 2,
          formatOnPaste: editorSettings?.formatOnPaste ?? false,
          formatOnType: editorSettings?.formatOnSave ?? false,
          autoClosingBrackets: editorSettings?.autoClosingBrackets ?? "languageDefined",
          autoClosingQuotes: editorSettings?.autoClosingQuotes ?? "languageDefined",
          renderLineHighlight: "line",
          renderLineHighlightOnlyWhenFocus: false,
          selectOnLineNumbers: true,
          folding: true,
          foldingStrategy: "auto",
          showFoldingControls: "mouseover",
          matchBrackets: "always",
          bracketPairColorization: {
            enabled: false, // Keep monochrome
          },
          guides: {
            bracketPairs: true,
            bracketPairsHorizontal: false,
            indentation: true,
            highlightActiveIndentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showFunctions: true,
            showConstants: true,
            showVariables: true,
            filterGraceful: true,
            localityBonus: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: "on",
          snippetSuggestions: "inline",
          parameterHints: {
            enabled: true,
          },
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: "multiline",
            seedSearchStringFromSelection: "selection",
          },
          padding: {
            top: 16,
            bottom: 16,
          },
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            arrowSize: 0,
          },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          contextmenu: true,
          mouseWheelZoom: true,
          dragAndDrop: true,
          links: true,
          colorDecorators: false,
          accessibilitySupport: "auto",
        }}
        loading={
          <div className="flex flex-col h-full bg-white">
            <div className="flex-1 p-4 space-y-2">
              {[70, 45, 60, 80, 35, 55, 40, 65].map((width, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-4 bg-neutral-100 animate-pulse" />
                  <div
                    className="flex-1 h-4 bg-neutral-100 animate-pulse"
                    style={{ width: `${width}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
});
