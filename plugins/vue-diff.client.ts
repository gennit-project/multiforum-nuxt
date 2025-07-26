import VueDiff from 'vue-diff';
import 'vue-diff/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueDiff, {
    componentName: 'VueDiff',
  });
});