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
        'accent-hover': '#f5f5f5',
        'accent-muted': '#404040',
        'accent-dark': '#000000',
        surface: '#171717',
        'surface-text': '#fafafa',
      },
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei UI"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          'sans-serif'
        ],
        mono: [
          'var(--font-geist-mono)',
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          '"Maple Mono NF CN"',
          '"Maple Mono SC NF"',
          '"Sarasa Mono SC"',
          '"LXGW WenKai Mono"',
          '"Noto Sans Mono CJK SC"',
          '"Source Han Mono SC"',
          '"WenQuanYi Zen Hei Mono"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei UI"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          'monospace'
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
