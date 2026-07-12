<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import ScratchpadSection from '@/components/scratchpad/ScratchpadSection.vue';
import BackLink from '@/components/BackLink.vue';

const route = useRoute();

const username = computed(() => {
  if (typeof route.params.username === 'string') {
    return route.params.username;
  }
  return '';
});
</script>

<template>
  <div class="py-3">
    <div class="mb-4 flex flex-col gap-3">
      <BackLink :link="`/u/${username}`" text="Back to profile" />
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Kudos
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Public thank-you notes this user chose to show on their profile.
        </p>
      </div>
    </div>
    <ScratchpadSection :username="username" />
  </div>
</template>
