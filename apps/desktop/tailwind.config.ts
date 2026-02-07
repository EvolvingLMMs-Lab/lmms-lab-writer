import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Google Sans Text"',
          '"Google Sans"',
          'var(--font-geist-sans)',
          'Roboto',
          'system-ui',
          '"Segoe UI"',
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
          '"SF Mono"',
          'SFMono-Regular',
          '"SF Pro Mono"',
          '"Google Sans Code"',
          '"Roboto Mono"',
          'var(--font-geist-mono)',
          'ui-monospace',
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
