export default defineNuxtPlugin((nuxtApp) => {
  // Only load on client-side to avoid SSR issues with regenerator runtime
  if (process.client) {
    const VCodeDiff = require('v-code-diff').default;
    const { hljs } = require('v-code-diff');
    const markdown = require('highlight.js/lib/languages/markdown');

    // Extend markdown language support
    hljs.registerLanguage('markdown', markdown);
    
    nuxtApp.vueApp.use(VCodeDiff);
  }
});