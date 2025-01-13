import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  rules: {
    "vue/html-self-closing": ["off", {
      "html": {
        "void": "any",
        "normal": "any",
        "component": "any"
      }
    }],
    "vue/v-on-event-hyphenation": "off",
    "@typescript-eslint/no-explicit-any": 0,
    "no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-unused-vars": ["error", {
      vars: "all",
      args: "after-used",
      ignoreRestSiblings: true,
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],
    "@typescript-eslint/no-unused-vars": ["error", {
      vars: "all",
      args: "after-used",
      ignoreRestSiblings: true,
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }]
  },
  languageOptions: {
    parserOptions: {
      project: true,
    },
  },
}).override(
  'nuxt/typescript/rules',
  {
    rules: {
      'vue/html-self-closing': 0,
      '@typescript-eslint/no-explicit-any': 'off',
      'no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // Add the same rules here to ensure they're not overridden
      "@typescript-eslint/no-unused-vars": ["error", {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }]
    },
  }
)