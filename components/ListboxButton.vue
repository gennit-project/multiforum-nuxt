<script setup lang="ts">
import SelectorIcon from '@/components/icons/ChevronUpDownIcon.vue';
import { ListboxButton } from '@headlessui/vue';

defineProps<{
  label: string;
}>();
</script>

<template>
  <ListboxButton
    class="focus:border-brand-500 focus:ring-brand-500 relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-left shadow-sm focus:ring-1 focus:outline-none sm:text-sm dark:bg-gray-900 dark:text-gray-200"
  >
    <span class="block truncate">{{ label }}</span>
    <span
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
    >
      <SelectorIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
    </span>
  </ListboxButton>
</template>
