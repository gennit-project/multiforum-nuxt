<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import ScratchpadSection from '@/components/scratchpad/ScratchpadSection.vue';

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
    <ScratchpadSection :username="username" />
  </div>
</template>
