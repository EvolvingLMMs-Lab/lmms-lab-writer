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
            "--tw-prose-pre-bg": "#171717",
            "--tw-prose-pre-code": "#fafafa",
            maxWidth: "none",
            code: {
              backgroundColor: "#f5f5f5",
              padding: "0.25rem 0.375rem",
              borderRadius: "0",
              fontWeight: "400",
            },
            "code::before": { content: "none" },
            "code::after": { content: "none" },
            a: {
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
