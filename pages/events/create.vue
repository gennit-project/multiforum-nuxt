<script setup lang="ts">
import CreateEvent from '@/components/event/form/CreateEvent.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'New event' });
</script>
<template>
  <NuxtLayout>
    <div class="flex justify-center">
      <div class="mt-2 w-full max-w-3xl bg-white pt-2 dark:bg-gray-800">
        <CreateEvent />
      </div>
    </div>
  </NuxtLayout>
</template>
