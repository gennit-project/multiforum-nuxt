<script setup lang="ts">
import { computed } from 'vue';
import Breadcrumbs from '@/components/nav/Breadcrumbs.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'Settings' });

const links = computed(() => {
  return [
    {
      label: 'Settings',
      path: 'settings',
    },
  ];
});
</script>

<template>
  <main
    id="main-content"
    tabindex="-1"
    class="flex-1 px-10 text-xl font-bold outline-none"
  >
    <Breadcrumbs :links="links" />
    <h2
      class="font-extrabold mb-2 ml-2 mt-6 inline text-3xl tracking-tight text-gray-900 dark:text-gray-100 sm:block sm:text-4xl"
    >
      Settings
    </h2>
  </main>
</template>
