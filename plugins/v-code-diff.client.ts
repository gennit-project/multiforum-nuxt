import VCodeDiff from 'v-code-diff';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VCodeDiff);
});