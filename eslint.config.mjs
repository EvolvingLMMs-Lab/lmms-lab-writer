import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    ignores: [
      "node_modules/",
      ".next/",
      "dist/",
      "out/",
      "coverage/",
      "apps/desktop/src-tauri/target/",
      "**/*.d.ts",
    ],
  },
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
    },
  },
];
