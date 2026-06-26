import { ref } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';

/**
 * Copies the current route's absolute URL to the clipboard and briefly flips a
 * notification flag (auto-resets after 2s). Extracted from the image- and
 * album-detail pages, which both hand-rolled the same SSR-safe origin logic.
 */
export function useCopyCurrentUrl() {
  const route = useRoute();
  const router = useRouter();
  const showCopiedNotification = ref(false);

  const copyCurrentUrl = async () => {
    try {
      const basePath = import.meta.client
        ? window.location.origin
        : process.env.BASE_URL || '';
      const permalink = `${basePath}${router.resolve(route).href}`;
      await navigator.clipboard.writeText(permalink);
      showCopiedNotification.value = true;
      setTimeout(() => {
        showCopiedNotification.value = false;
      }, 2000);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  return { showCopiedNotification, copyCurrentUrl };
}
