"use client";

import type { Monaco } from "@monaco-editor/react";
import type { editor, languages } from "monaco-editor";

// Register LaTeX language support
export const registerLaTeXLanguage = (monaco: Monaco) => {
  // Register the LaTeX language
  monaco.languages.register({
    id: "latex",
    extensions: [".tex", ".sty", ".cls", ".bib"],
  });

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
        [
          /\\(ref|cite|label|pageref|eqref)\s*\{/,
          { token: "keyword", next: "@braceArg" },
        ],

        // Text formatting
        [
          /\\(textbf|textit|texttt|emph|underline)\s*\{/,
          { token: "keyword", next: "@braceArg" },
        ],

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
        [/[^\]{}]+/, "variable.parameter"],
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
    provideCompletionItems: (
      model: editor.ITextModel,
      position: { lineNumber: number; column: number },
    ) => {
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

      const suggestions: languages.CompletionItem[] = [];

      if (charBefore === "\\") {
        // Command completions
        const commands = [
          // Document structure
          {
            label: "documentclass",
            insertText: "documentclass{${1:article}}",
            detail: "Document class",
          },
          {
            label: "usepackage",
            insertText: "usepackage{${1:package}}",
            detail: "Import package",
          },
          {
            label: "begin",
            insertText:
              "begin{${1:environment}}\n\t$0\n\\end{${1:environment}}",
            detail: "Begin environment",
          },
          {
            label: "section",
            insertText: "section{${1:title}}",
            detail: "Section",
          },
          {
            label: "subsection",
            insertText: "subsection{${1:title}}",
            detail: "Subsection",
          },
          {
            label: "subsubsection",
            insertText: "subsubsection{${1:title}}",
            detail: "Subsubsection",
          },
          {
            label: "chapter",
            insertText: "chapter{${1:title}}",
            detail: "Chapter",
          },
          {
            label: "title",
            insertText: "title{${1:title}}",
            detail: "Document title",
          },
          {
            label: "author",
            insertText: "author{${1:name}}",
            detail: "Author",
          },
          { label: "date", insertText: "date{${1:\\today}}", detail: "Date" },
          { label: "maketitle", insertText: "maketitle", detail: "Make title" },
          {
            label: "tableofcontents",
            insertText: "tableofcontents",
            detail: "Table of contents",
          },

          // Text formatting
          {
            label: "textbf",
            insertText: "textbf{${1:text}}",
            detail: "Bold text",
          },
          {
            label: "textit",
            insertText: "textit{${1:text}}",
            detail: "Italic text",
          },
          {
            label: "texttt",
            insertText: "texttt{${1:text}}",
            detail: "Monospace text",
          },
          {
            label: "emph",
            insertText: "emph{${1:text}}",
            detail: "Emphasized text",
          },
          {
            label: "underline",
            insertText: "underline{${1:text}}",
            detail: "Underlined text",
          },

          // References
          { label: "label", insertText: "label{${1:key}}", detail: "Label" },
          { label: "ref", insertText: "ref{${1:key}}", detail: "Reference" },
          { label: "cite", insertText: "cite{${1:key}}", detail: "Citation" },
          {
            label: "footnote",
            insertText: "footnote{${1:text}}",
            detail: "Footnote",
          },
          {
            label: "caption",
            insertText: "caption{${1:text}}",
            detail: "Caption",
          },

          // Math
          {
            label: "frac",
            insertText: "frac{${1:num}}{${2:den}}",
            detail: "Fraction",
          },
          { label: "sqrt", insertText: "sqrt{${1:x}}", detail: "Square root" },
          {
            label: "sum",
            insertText: "sum_{${1:i=1}}^{${2:n}}",
            detail: "Summation",
          },
          {
            label: "int",
            insertText: "int_{${1:a}}^{${2:b}}",
            detail: "Integral",
          },
          {
            label: "lim",
            insertText: "lim_{${1:x \\to \\infty}}",
            detail: "Limit",
          },

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
          {
            label: "hspace",
            insertText: "hspace{${1:1cm}}",
            detail: "Horizontal space",
          },
          {
            label: "vspace",
            insertText: "vspace{${1:1cm}}",
            detail: "Vertical space",
          },
          { label: "newline", insertText: "newline", detail: "New line" },
          { label: "newpage", insertText: "newpage", detail: "New page" },

          // Lists
          { label: "item", insertText: "item ", detail: "List item" },

          // Includes
          {
            label: "input",
            insertText: "input{${1:file}}",
            detail: "Input file",
          },
          {
            label: "include",
            insertText: "include{${1:file}}",
            detail: "Include file",
          },
        ];

        commands.forEach((cmd) => {
          suggestions.push({
            label: cmd.label,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: cmd.insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: env.detail,
            range,
          });
        });
      }

      return { suggestions };
    },
  });
};

