import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#fafafa',
        foreground: '#0a0a0a',
        border: '#e5e5e5',
        'border-dark': '#404040',
        muted: '#737373',
        'muted-foreground': '#a3a3a3',
        accent: '#0a0a0a',
        'accent-muted': '#404040',
        'accent-dark': '#000000',
        surface: '#171717',
        'surface-text': '#fafafa',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
