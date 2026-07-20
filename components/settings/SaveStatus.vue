<script setup lang="ts">
import type { PropType } from 'vue';
import type { AutosaveStatus } from '@/composables/useSettingAutosave';
import CheckIcon from '@/components/icons/CheckIcon.vue';
import ExclamationIcon from '@/components/icons/ExclamationIcon.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

defineProps({
  status: {
    type: String as PropType<AutosaveStatus>,
    default: 'idle',
  },
  errorMessage: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <!--
    Autosave status for settings that persist on change instead of via a Save
    button. The live region announces "Saving…"/"Saved" to assistive tech;
    errors are shown with role="alert".
  -->
  <div
    class="flex min-h-[1.25rem] items-center text-xs"
    data-testid="save-status"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <span
      v-if="status === 'saving'"
      class="flex items-center text-gray-500 dark:text-gray-400"
    >
      <LoadingSpinner class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      Saving…
    </span>
    <span
      v-else-if="status === 'saved'"
      class="flex items-center text-green-600 dark:text-green-400"
    >
      <CheckIcon class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      Saved
    </span>
    <span
      v-else-if="status === 'error'"
      class="flex items-center text-red-600 dark:text-red-400"
      role="alert"
    >
      <ExclamationIcon class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {{ errorMessage || 'Could not save. Retrying on your next change.' }}
    </span>
  </div>
</template>
