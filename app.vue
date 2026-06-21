<script setup lang="ts">
import { useUIStore } from '@/stores/uiStore';
import { onMounted } from 'vue';

const uiStore = useUIStore();

// Initialize theme class on application load
onMounted(() => {
  // Force theme application on initial load
  if (uiStore.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});
</script>

<template>
  <div>
    <!--
      NuxtRouteAnnouncer is rendered as a client-only component on the server
      (an empty <div> placeholder, with no `nuxt-route-announcer` markup in the
      SSR HTML) but mounts as a real <span class="nuxt-route-announcer"> on the
      client. On the Vercel runtime that div->span swap at the app root is
      treated as a hard hydration mismatch (the Node runtime swaps it cleanly),
      which shifts every following sibling and forces Vue to re-render the whole
      tree client-side — the "content loads, black screen, then reloads" flash.
      Wrapping it in <ClientOnly> gives a deterministic SSR placeholder so the
      announcer is mounted client-side without a hydration mismatch. It only
      announces route changes to screen readers, which is a client-runtime
      concern anyway, so there is no SSR/SEO cost.
    -->
    <ClientOnly>
      <NuxtRouteAnnouncer />
    </ClientOnly>
    <NuxtPage />
  </div>
</template>
