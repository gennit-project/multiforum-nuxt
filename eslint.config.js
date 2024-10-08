import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt()
  .override(
    'nuxt/typescript/rules',
    {
      rules: {
        'vue/v-on-event-hyphenation': 'off',
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "vue/html-self-closing": "off",
      }
    }
  )
