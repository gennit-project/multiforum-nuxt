import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import vueEslintParser from "vue-eslint-parser"; // Import vue-eslint-parser
import typeScriptParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ),
  // Configuration for Vue files
  {
    files: ["*.vue"], // Apply this configuration to .vue files
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        extraFileExtensions: [".vue"], // Make sure .vue files are recognized
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  // Configuration for TypeScript files
  {
    files: ["*.ts", "*.tsx"], // Apply this configuration to .ts and .tsx files
    languageOptions: {
      parser: typeScriptParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        project: ["./tsconfig.json"],
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    ignores: [".nuxt/"],
  },
];
