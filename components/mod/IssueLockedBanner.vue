<script lang="ts" setup>
import { DateTime } from 'luxon';

defineProps<{
  lockReason?: string | null;
  lockedByDisplayName?: string | null;
  lockedAt?: string | null;
}>();
</script>

<template>
  <div
    class="mx-4 mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-900/30"
  >
    <div class="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 text-yellow-600 dark:text-yellow-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="font-medium text-yellow-800 dark:text-yellow-200">
        This issue is locked
      </span>
    </div>
    <p
      v-if="lockReason"
      class="mt-1 text-sm text-yellow-700 dark:text-yellow-300"
    >
      <span class="font-medium">Reason:</span> {{ lockReason }}
    </p>
    <p class="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
      Locked by {{ lockedByDisplayName || 'Unknown' }}
      <span v-if="lockedAt">
        on
        {{ DateTime.fromISO(lockedAt).toLocaleString(DateTime.DATETIME_MED) }}
      </span>
    </p>
  </div>
</template>
