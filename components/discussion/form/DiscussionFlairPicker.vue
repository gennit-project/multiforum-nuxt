<script setup lang="ts">
import ErrorBanner from '@/components/ErrorBanner.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

export type DiscussionFlairOption = {
  id: string;
  displayName: string;
  color?: string | null;
};

const props = defineProps<{
  channelUniqueName: string;
  flairs: DiscussionFlairOption[];
  modelValue: string[];
  required?: boolean;
  loading?: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [flairIds: string[]];
}>();

const toggleFlair = (flairId: string) => {
  const selected = new Set(props.modelValue);
  if (selected.has(flairId)) {
    selected.delete(flairId);
  } else {
    selected.add(flairId);
  }
  emit('update:modelValue', [...selected]);
};
</script>

<template>
  <fieldset class="space-y-2" :aria-required="required">
    <legend class="text-sm font-medium text-gray-900 dark:text-gray-100">
      Post flair
      <span v-if="required" class="text-red-600 dark:text-red-400">
        (required)
      </span>
    </legend>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Select one or more categories for {{ channelUniqueName }}.
    </p>

    <div
      v-if="loading"
      class="flex items-center py-2 text-sm text-gray-600 dark:text-gray-300"
    >
      <LoadingSpinner class="mr-2" />
      Loading flair options...
    </div>
    <ErrorBanner v-else-if="errorMessage" :text="errorMessage" />
    <div v-else class="flex flex-wrap gap-2" data-testid="flair-picker">
      <button
        v-for="flair in flairs"
        :key="flair.id"
        type="button"
        class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        :class="
          modelValue.includes(flair.id)
            ? 'border-orange-600 bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-100'
            : 'border-gray-300 bg-white text-gray-700 hover:border-orange-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
        "
        :aria-pressed="modelValue.includes(flair.id)"
        :aria-label="`${modelValue.includes(flair.id) ? 'Remove' : 'Select'} ${flair.displayName} flair`"
        @click="toggleFlair(flair.id)"
      >
        <span
          v-if="flair.color"
          class="h-3 w-3 rounded-full border border-black/10"
          :style="{ backgroundColor: flair.color }"
          aria-hidden="true"
        />
        {{ flair.displayName }}
      </button>
    </div>
  </fieldset>
</template>
