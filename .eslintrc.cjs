module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  settings: {
    next: {
      rootDir: ["apps/web", "apps/desktop"],
    },
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "dist/",
    "out/",
    "coverage/",
    "apps/desktop/src-tauri/target/",
  ],
};
