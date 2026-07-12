import { nextTick } from 'vue';
import { moveFocusToMain } from '@/utils/routeFocus';

// After each client-side navigation, move keyboard focus to the main content
// region so keyboard/screen-reader users aren't left on the (now-detached) link
// they activated. See utils/routeFocus.ts.
export default defineNuxtPlugin(() => {
  const router = useRouter();
  let isInitialNavigation = true;

  router.afterEach((to, from) => {
    // Skip the initial hydration navigation: on first load focus should start
    // at the top of the page (the skip link), not be pulled into the content.
    if (isInitialNavigation) {
      isInitialNavigation = false;
      return;
    }

    // Ignore query/hash-only updates (filters, tabs, selected items) — only
    // move focus when the actual page changes.
    if (to.path === from.path) return;

    // Wait for the destination page to render before moving focus into it.
    nextTick(() => {
      moveFocusToMain();
    });
  });
});
