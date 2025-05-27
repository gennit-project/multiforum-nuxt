import { createConfigForNuxt } from "@nuxt/eslint-config/flat";
<<<<<<< HEAD

export default createConfigForNuxt({
  rules: {
    "vue/html-self-closing": "off",
=======
import pluginVueA11y from "eslint-plugin-vuejs-accessibility";

export default createConfigForNuxt({
  plugins: {
    'vuejs-accessibility': pluginVueA11y
  },
  rules: {
    "vue/html-self-closing": ["off", {
      "html": {
        "void": "any",
        "normal": "any",
        "component": "any"
      }
    }],
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    "vue/v-on-event-hyphenation": "off",
    "@typescript-eslint/no-explicit-any": 0,
    "no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
<<<<<<< HEAD
    "no-unused-vars": "off", // Turn off base rule
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }
    ],
=======
    "no-unused-vars": ["error", {
      vars: "all",
      args: "after-used",
      ignoreRestSiblings: true,
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    "@typescript-eslint/no-unused-vars": ["error", {
      vars: "all",
      args: "after-used",
      ignoreRestSiblings: true,
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],
<<<<<<< HEAD
    "vue/multi-word-component-names": "off",
=======
    // Accessibility rules
    "vuejs-accessibility/alt-text": ["error", { 
      "elements": ["img", "object", "area", "input[type=\"image\"]"],
      "img": ["Image"],
      "object": ["Object"],
      "area": ["Area"],
      "input[type=\"image\"]": ["ImageInput"]
    }],
    "vuejs-accessibility/anchor-has-content": "error",
    "vuejs-accessibility/aria-props": "error",
    "vuejs-accessibility/aria-role": ["error", {
      "ignoreNonDOM": true
    }],
    "vuejs-accessibility/aria-unsupported-elements": "error",
    "vuejs-accessibility/click-events-have-key-events": "error",
    "vuejs-accessibility/form-has-label": "error",
    "vuejs-accessibility/heading-has-content": "error",
    "vuejs-accessibility/label-has-for": ["error", {
      "required": {
        "some": ["nesting", "id"]
      }
    }],
    "vuejs-accessibility/media-has-caption": "error",
    "vuejs-accessibility/mouse-events-have-key-events": "error",
    "vuejs-accessibility/no-autofocus": "error",
    "vuejs-accessibility/no-onchange": "error",
    "vuejs-accessibility/no-redundant-roles": "error",
    "vuejs-accessibility/no-access-key": "error",
    "vuejs-accessibility/no-distracting-elements": "error",
    "vuejs-accessibility/no-static-element-interactions": "error",
    "vuejs-accessibility/tabindex-no-positive": "error",
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
<<<<<<< HEAD
      'vue/html-self-closing': 'off',
=======
      'vue/html-self-closing': 0,
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
<<<<<<< HEAD
);
=======
)
>>>>>>> parent of 666ae3d (Use automated formatting tools)
