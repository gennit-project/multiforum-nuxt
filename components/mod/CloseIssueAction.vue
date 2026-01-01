<script setup lang="ts">
import XCircleIcon from '../icons/XCircleIcon.vue';

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close-issue']);
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm text-gray-700 dark:text-gray-300">
      Close the issue to log that no moderation action is needed.
    </p>
    <button
      class="font-semibold flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
      :loading="loading"
      @click="$emit('close-issue')"
    >
      <XCircleIcon />
      Close Issue (No Action Needed)
    </button>
    <p class="text-xs text-gray-500 dark:text-gray-400">
      This records that moderators reviewed the content and found no violation.
    </p>
  </div>
</template>
