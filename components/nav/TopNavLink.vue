<script setup lang="ts">
defineProps<{
  to: string;
  label: string;
}>();
</script>

<template>
  <nuxt-link
    :to="to"
    class="group hover:border-brand-500 hover:text-brand-500 inline-flex items-center border-b-3 border-transparent px-4 py-3 text-xs font-medium dark:text-white hover:dark:text-gray-200"
    active-class="
      inline-flex
      items-center
      border-b-2
      border-brand-500
      text-brand-500
      dark:text-brand-400
      dark:border-brand-400
      hover:dark:text-brand-400
      px-4
      py-3
      text-xs
      font-medium
      "
  >
    <div>
      <slot />
    </div>
    {{ label }}
  </nuxt-link>
</template>
