<script setup lang="ts">
// Lightweight replacement for Vuetify's <v-skeleton-loader>. Dark mode is
// handled by Tailwind's `dark:` variant (the app toggles the `dark` class on
// <html>), so no theme prop is needed. Width is supplied by the caller via a
// fallthrough `class` (e.g. class="w-3/4"); this root's height/shape classes
// merge with it.
withDefaults(defineProps<{ type?: 'text' | 'button' }>(), { type: 'text' });
</script>

<template>
  <div
    aria-hidden="true"
    class="animate-pulse rounded bg-gray-300 dark:bg-gray-700"
    :class="type === 'button' ? 'h-9' : 'h-4'"
  />
</template>
