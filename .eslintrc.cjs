module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    '@nuxt/eslint-config',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended'
  ],
  plugins: [
    'vue',
    'unused-imports'
  ],
  // add your custom rules here
  rules: {
    'no-unused-vars': 'off', // Turn off the default rule
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        'vars': 'all',
        'args': 'after-used',
        'ignoreRestSiblings': true,
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }
    ],
    'vue/attributes-order': ['error', {
      'order': [
        'DEFINITION',
        'LIST_RENDERING',
        'CONDITIONALS',
        'RENDER_MODIFIERS',
        'GLOBAL',
        ['UNIQUE', 'SLOT'],
        'TWO_WAY_BINDING',
        'OTHER_DIRECTIVES',
        'OTHER_ATTR',
        'EVENTS',
        'CONTENT'
      ],
      'alphabetical': true
    }],
    'vue/multi-word-component-names': 'off'
  },
  ignorePatterns: [
    '.nuxt',
    '.output',
    '.vercel',
    'dist',
    'node_modules',
    '*.config.js',
    '*.config.ts',
    '__generated__'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: {
      // Script parser for `<script>`
      js: 'espree',
      // Script parser for `<script lang="ts">`
      ts: '@typescript-eslint/parser',
      // Script parser for vue directives and vue interpolations
      '<template>': 'espree'
    }
  }
}