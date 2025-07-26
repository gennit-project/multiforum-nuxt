import VCodeDiff, { hljs } from 'v-code-diff';
import markdown from 'highlight.js/lib/languages/markdown';

// Extend markdown language support
hljs.registerLanguage('markdown', markdown);

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VCodeDiff);
});