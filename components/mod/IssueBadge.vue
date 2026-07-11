<script setup lang="ts">
import { computed } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import DotCircleIcon from '@/components/icons/DotCircleIcon.vue';

const props = defineProps<{
  issue: Issue;
}>();

const isOpen = computed(() => props.issue.isOpen);
</script>

<template>
  <div
    v-if="isOpen"
    class="flex flex-row items-center space-y-4 rounded-full bg-green-500 px-3 py-1 text-white"
  >
    <DotCircleIcon class="list-item-icon h-4 w-4 text-white" /> Open
  </div>
  <div
    v-else
    class="flex flex-row items-center gap-2 space-y-4 rounded-full bg-purple-500 py-1 pl-2 pr-3 text-white"
  >
    <CheckCircleIcon class="mr-1 h-4 w-4 pl-1" /> Closed
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
