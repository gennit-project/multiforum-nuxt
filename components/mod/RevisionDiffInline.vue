<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { TextVersion } from '@/__generated__/graphql';
import * as DiffMatchPatch from 'diff-match-patch';

interface VersionData {
  id: string;
  body?: string;
  title?: string;
  createdAt: string;
  Author?: {
    username?: string;
  } | null;
}

const props = defineProps({
  oldVersion: {
    type: Object as PropType<TextVersion | VersionData>,
    required: true,
  },
  newVersion: {
    type: Object as PropType<TextVersion | VersionData>,
    required: true,
  },
});

const oldContent = computed(
  () =>
    props.oldVersion.body ||
    ('title' in props.oldVersion ? props.oldVersion.title : '') ||
    ''
);
const newContent = computed(
  () =>
    props.newVersion.body ||
    ('title' in props.newVersion ? props.newVersion.title : '') ||
    ''
);

const editReason = computed(() => {
  const newReason = (props.newVersion as Record<string, any>).editReason;
  const oldReason = (props.oldVersion as Record<string, any>).editReason;
  return newReason || oldReason || '';
});

const editReasonLabel = computed(() => {
  if (
    editReason.value.includes('Server rules:') ||
    editReason.value.includes('Forum rules:')
  ) {
    return 'Edit details:';
  }
  return 'Edit reason:';
});

// Computed property that generates the diff HTML
const diffHtml = computed(() => {
  const dmp = new DiffMatchPatch.diff_match_patch();
  const diffs = dmp.diff_main(oldContent.value, newContent.value);
  dmp.diff_cleanupSemantic(diffs);

  // Create highlighted HTML for both sides
  let leftHtml = '';
  let rightHtml = '';

  diffs.forEach((diff) => {
    const [operation, text] = diff;
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    if (operation === -1) {
      // Deletion - show in left column with red background
      leftHtml += `<span class="bg-red-500/20 text-red-800 dark:bg-red-500/30 dark:text-red-100">${escapedText}</span>`;
    } else if (operation === 1) {
      // Insertion - show in right column with green background
      rightHtml += `<span class="bg-green-500/20 text-green-800 dark:bg-green-500/30 dark:text-green-100">${escapedText}</span>`;
    } else {
      // Equal - show in both columns
      leftHtml += `<span class="dark:text-gray-200">${escapedText}</span>`;
      rightHtml += `<span class="dark:text-gray-200">${escapedText}</span>`;
    }
  });

  return {
    left: leftHtml,
    right: rightHtml,
  };
});
</script>

<template>
  <div class="mt-2 rounded-md border dark:border-gray-700">
    <!-- Edit reason if provided -->
    <div
      v-if="editReason"
      class="whitespace-pre-line border-b px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400"
    >
      <span class="font-semibold text-gray-700 dark:text-gray-200">{{
        editReasonLabel
      }}</span>
      {{ editReason }}
    </div>

    <!-- Diff view -->
    <div class="flex flex-col md:flex-row">
      <!-- Old version (left side) -->
      <div
        class="flex-1 rounded-tl-md border-b bg-red-500/10 p-3 dark:border-gray-700 dark:bg-red-500/20 md:border-b-0 md:border-r"
      >
        <p class="mb-1 text-xs font-medium text-red-700 dark:text-red-200">
          Previous
        </p>
        <div
          class="max-h-48 overflow-auto rounded border border-red-300 bg-white p-2 text-sm dark:border-red-700 dark:bg-gray-800"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="diffHtml.left" />
        </div>
      </div>

      <!-- New version (right side) -->
      <div
        class="flex-1 rounded-tr-md bg-green-500/10 p-3 dark:bg-green-500/20 md:rounded-bl-none"
      >
        <p class="mb-1 text-xs font-medium text-green-700 dark:text-green-200">
          Current
        </p>
        <div
          class="max-h-48 overflow-auto rounded border border-green-300 bg-white p-2 text-sm dark:border-green-700 dark:bg-gray-800"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="diffHtml.right" />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div
      class="flex flex-wrap justify-center gap-4 border-t p-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
    >
      <span class="flex items-center">
        <span
          class="mr-1 inline-block h-3 w-3 bg-red-500/20 dark:bg-red-500/30"
        />
        Removed
      </span>
      <span class="flex items-center">
        <span
          class="mr-1 inline-block h-3 w-3 bg-green-500/20 dark:bg-green-500/30"
        />
        Added
      </span>
    </div>
  </div>
</template>
