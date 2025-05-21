// eslint.config.js  (or .eslintrc.cjs / .eslintrc.js)
module.exports = {
  root: true,
  env: { browser: true, node: true },

  /* ------------------------------------------------------------------ *
   * 1.  Make vue-eslint-parser the main parser so it can analyse the   *
   *     template and mark vars as “used”.                              *
   * ------------------------------------------------------------------ */
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser", // parses the <script lang="ts">
    ecmaVersion: 2022,
    sourceType: "module",
    extraFileExtensions: [".vue"],
  },

  /* ------------------------------------------------------------------ */
  extends: ["@nuxt/eslint-config", "plugin:vue/vue3-recommended", "plugin:prettier/recommended"],

  plugins: ["unused-imports"],

  rules: {
    /* Let eslint‑plugin‑unused‑imports delete dead **imports** -------- */
    "unused-imports/no-unused-imports": "error",

    /* Disable the variable rule inside that plugin (false‑positives) -- */
    "unused-imports/no-unused-vars": "off",

    /* Use the TS rule for vars everywhere _except_ .vue templates ------ */
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
      },
    ],

    /* Misc. ----------------------------------------------------------- */
    "vue/multi-word-component-names": "off",
  },

  /* Turn the TS unused‑vars rule off inside *.vue* to avoid clashes ---- */
  overrides: [
    {
      files: ["*.vue"],
      rules: { "@typescript-eslint/no-unused-vars": "off" },
    },
  ],

  ignorePatterns: [
    ".nuxt",
    ".output",
    ".vercel",
    "dist",
    "node_modules",
    "*.config.js",
    "*.config.ts",
    "__generated__",
  ],
};
