import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist"], // Ignore specific directories
  },
  {
    files: ["**/*.{ts,tsx,json}"], // Apply to TypeScript files
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser, // Specify TypeScript parser
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@typescript-eslint": tseslint, // Add TypeScript ESLint plugin
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules, // Include recommended React Hooks rules
      ...tseslint.configs.recommended.rules, // Include recommended TypeScript rules

      // Add or override rules
      "@typescript-eslint/no-unused-vars": [
        "off",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": ["off"],
      "@typescript-eslint/no-empty-object-type": ["off"],
      "react-hooks/exhaustive-deps": ["off"],
      "@typescript-eslint/no-wrapper-object-types": ["off"],
      "@typescript-eslint/no-namespace": ["off"],
      "@typescript-eslint/no-unsafe-function-type": ["off"],
      "@typescript-eslint/no-unused-expressions": ["off"],
      "unicorn/switch-case-braces": ["off"],
    },
  },
];