<script setup lang="ts">
// A persistent live region for async loading / empty / status text. Render it
// once (do not gate the wrapper itself behind v-if) and swap the inner text so
// screen readers announce transitions between loading, empty, and loaded states.
//
// - role/aria-live default to status/polite; pass `assertive` for errors.
// - pass `busy` while content is loading so assistive tech knows the region is
//   updating (maps to aria-busy).
withDefaults(
  defineProps<{
    busy?: boolean;
    assertive?: boolean;
  }>(),
  {
    busy: false,
    assertive: false,
  }
);
</script>

<template>
  <div
    :role="assertive ? 'alert' : 'status'"
    :aria-live="assertive ? 'assertive' : 'polite'"
    :aria-busy="busy || undefined"
  >
    <slot />
  </div>
</template>
