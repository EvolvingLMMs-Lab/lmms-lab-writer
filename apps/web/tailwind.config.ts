import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fafafa",
        foreground: "#0a0a0a",
        border: "#e5e5e5",
        "border-dark": "#404040",
        muted: "#737373",
        "muted-foreground": "#a3a3a3",
        accent: "#0a0a0a",
        "accent-hover": "#f5f5f5",
        surface: "#171717",
        "surface-text": "#fafafa",
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "#0a0a0a",
            "--tw-prose-headings": "#0a0a0a",
            "--tw-prose-links": "#0a0a0a",
            "--tw-prose-code": "#0a0a0a",
            "--tw-prose-pre-bg": "#fafafa",
            "--tw-prose-pre-code": "#0a0a0a",
            maxWidth: "none",
            code: {
              backgroundColor: "#f5f5f5",
              padding: "0.25rem 0.375rem",
              borderRadius: "0",
              fontWeight: "400",
              fontSize: "0.875em",
            },
            "code::before": { content: "none" },
            "code::after": { content: "none" },
            pre: {
              backgroundColor: "#f5f5f5",
              borderWidth: "1px",
              borderColor: "#0a0a0a",
              borderRadius: "0",
            },
            table: {
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875em",
            },
            thead: {
              borderBottomWidth: "2px",
              borderBottomColor: "#0a0a0a",
            },
            "thead th": {
              padding: "0.75rem 1rem",
              fontWeight: "600",
              textAlign: "left",
              verticalAlign: "bottom",
            },
            "tbody td": {
              padding: "0.75rem 1rem",
              verticalAlign: "top",
            },
            "tbody tr": {
              borderBottomWidth: "1px",
              borderBottomColor: "#0a0a0a",
            },
            "tbody tr:last-child": {
              borderBottomWidth: "0",
            },
            "thead th:first-child, tbody td:first-child": {
              paddingLeft: "0",
            },
            "thead th:last-child, tbody td:last-child": {
              paddingRight: "0",
            },
            a: {
              color: "#0a0a0a",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              "&:hover": {
                color: "#737373",
              },
            },
            h1: { fontWeight: "600" },
            h2: { fontWeight: "600" },
            h3: { fontWeight: "600" },
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
