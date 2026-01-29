import nextConfig from "eslint-config-next";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/out/**",
      "**/coverage/**",
      "**/src-tauri/target/**",
      "**/*.d.ts",
    ],
  },
  ...nextConfig,
  {
    settings: {
      next: {
        rootDir: ["apps/web", "apps/desktop"],
      },
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
];
