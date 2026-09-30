<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean;
    text: string;
  }>(),
  {
    active: false,
  }
);
</script>

<template>
  <button
    type="button"
    :class="[active ? 'border-brand-500 ring-brand-500 ring-1' : '']"
    class="focus:border-brand-500 focus:ring-brand-500 flex inline-flex rounded-full border px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-1"
  >
    <slot />
    <span class="whitespace-nowrap">{{ text }}</span>
  </button>
</template>
