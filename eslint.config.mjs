import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/out/**",
      "**/coverage/**",
      "**/src-tauri/target/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.cjs",
      // Generated files
      "**/next-env.d.ts",
    ],
  },

  // Base JS config
  js.configs.recommended,

  // TypeScript config
  ...tseslint.configs.recommended,

  // React config for all tsx/jsx files
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      // Downgrade to warning - setState in effect is sometimes needed for initialization
      "react-hooks/set-state-in-effect": "warn",
      // Downgrade to warning - ref updates in render are sometimes used as a pattern
      "react-hooks/refs": "warn",
      // Downgrade to warning - variable hoisting issues can be fixed incrementally
      "react-hooks/immutability": "warn",
    },
  },

  // Next.js specific rules for apps
  {
    files: ["apps/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Disable for Tauri apps where next/image may not work well
      "@next/next/no-img-element": "off",
    },
  },

  // TypeScript specific rules
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Node.js config files
  {
    files: ["**/*.config.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }
);
