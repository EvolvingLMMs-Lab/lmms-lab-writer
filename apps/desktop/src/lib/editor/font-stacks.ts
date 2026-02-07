const CJK_MONO_FONTS = [
  '"Maple Mono NF CN"',
  '"Maple Mono SC NF"',
  '"Sarasa Mono SC"',
  '"LXGW WenKai Mono"',
  '"Noto Sans Mono CJK SC"',
  '"Source Han Mono SC"',
  '"WenQuanYi Zen Hei Mono"',
];

const CJK_SANS_FALLBACK_FONTS = [
  '"PingFang SC"',
  '"Hiragino Sans GB"',
  '"Microsoft YaHei UI"',
  '"Microsoft YaHei"',
  '"Noto Sans CJK SC"',
];

const ENGLISH_MONO_FONTS = [
  'var(--font-geist-mono)',
  "ui-monospace",
  "SFMono-Regular",
  '"SF Mono"',
  "Menlo",
  "Consolas",
  '"Liberation Mono"',
  '"Courier New"',
];

export const EDITOR_MONO_FONT_FAMILY = [
  ...ENGLISH_MONO_FONTS,
  ...CJK_MONO_FONTS,
  ...CJK_SANS_FALLBACK_FONTS,
  "monospace",
].join(", ");
