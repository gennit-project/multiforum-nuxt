<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import {
  buildDiffLineRows,
  collapseDiffRows,
  expandDiffRows,
  type SideKind,
} from '@/utils/revisionDiff';

type RevisionVersion = {
  id?: string;
  body?: string | null;
  title?: string | null;
  createdAt?: string | null;
  editReason?: string | null;
  Author?: {
    username?: string | null;
  } | null;
};

const props = defineProps({
  oldVersion: {
    type: Object as PropType<RevisionVersion>,
    required: true,
  },
  newVersion: {
    type: Object as PropType<RevisionVersion>,
    required: true,
  },
  isMostRecent: {
    type: Boolean,
    default: false,
  },
});

const getVersionUsername = (version: RevisionVersion) => {
  return version.Author?.username || '[Deleted]';
};

const getVersionDate = (version: RevisionVersion) => {
  if (!version.createdAt) {
    return '';
  }

  const date = new Date(version.createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
};

const getVersionContent = (version: RevisionVersion) => {
  return version.body || version.title || '';
};

const oldVersionUsername = computed(() => getVersionUsername(props.oldVersion));
const newVersionUsername = computed(() => getVersionUsername(props.newVersion));
const oldVersionDate = computed(() => getVersionDate(props.oldVersion));
const newVersionDate = computed(() => getVersionDate(props.newVersion));
const oldContent = computed(() => getVersionContent(props.oldVersion));
const newContent = computed(() => getVersionContent(props.newVersion));
const editReason = computed(() => {
  return props.newVersion.editReason || props.oldVersion.editReason || '';
});

const CONTEXT_LINES = 3;
const expandedChunks = ref<Record<string, boolean>>({});

const allDiffLineRows = computed(() => {
  return buildDiffLineRows({
    oldContent: oldContent.value,
    newContent: newContent.value,
  });
});

const collapsedDiffRows = computed(() => {
  return collapseDiffRows({
    rows: allDiffLineRows.value,
    contextLines: CONTEXT_LINES,
  });
});

const renderRows = computed(() => {
  return expandDiffRows({
    rows: collapsedDiffRows.value,
    expandedChunks: expandedChunks.value,
  });
});

const toggleCollapsedChunk = (chunkKey: string) => {
  expandedChunks.value = {
    ...expandedChunks.value,
    [chunkKey]: !expandedChunks.value[chunkKey],
  };
};

const getCodeCellClass = (kind: SideKind) => {
  if (kind === 'removed') {
    return 'bg-red-500/20 text-red-800 dark:bg-red-500/30 dark:text-red-100';
  }

  if (kind === 'added') {
    return 'bg-green-500/20 text-green-800 dark:bg-green-500/30 dark:text-green-100';
  }

  if (kind === 'empty') {
    return 'bg-gray-50 text-gray-400 dark:bg-gray-900/40 dark:text-gray-500';
  }

  return 'text-gray-800 dark:text-gray-200';
};

const getLineNumberClass = (kind: SideKind) => {
  if (kind === 'removed') {
    return 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-200';
  }

  if (kind === 'added') {
    return 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-200';
  }

  return 'text-gray-500 dark:text-gray-400';
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <div v-if="isMostRecent" class="text-xs text-gray-500 dark:text-gray-400">
        <span
          class="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-800 dark:text-green-200"
          >Current version</span
        >
      </div>

      <div class="mb-2 flex flex-col gap-1">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
          From version by {{ oldVersionUsername }} ({{ oldVersionDate }})
        </div>

        <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
          To version by {{ newVersionUsername }} ({{ newVersionDate }})
        </div>

        <div v-if="editReason" class="text-xs text-gray-600 dark:text-gray-400">
          <span class="font-semibold text-gray-700 dark:text-gray-200"
            >Edit reason:</span
          >
          {{ editReason }}
        </div>
      </div>
    </div>

    <div class="rounded-md border dark:border-gray-700">
      <div class="flex flex-col md:flex-row">
        <div
          class="flex-1 rounded-t-md border-b bg-red-500/10 p-4 dark:border-gray-700 dark:bg-red-500/20 md:rounded-l-md md:rounded-tr-none md:border-b-0 md:border-r"
        >
          <h3 class="mb-2 text-sm font-medium text-red-700 dark:text-red-200">
            Previous Version
          </h3>
          <div
            class="h-full min-h-[200px] overflow-auto rounded border border-red-300 bg-white dark:border-red-700 dark:bg-gray-800"
          >
            <table class="w-full border-collapse text-xs">
              <tbody>
                <tr
                  v-for="row in renderRows"
                  :key="`left-${row.key}`"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <template v-if="row.type === 'collapsed'">
                    <td
                      colspan="2"
                      class="bg-gray-100 px-3 py-2 text-center text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <button
                        type="button"
                        class="font-medium underline"
                        @click="toggleCollapsedChunk(row.key)"
                      >
                        {{
                          expandedChunks[row.key]
                            ? `Hide ${row.hiddenCount} unchanged lines`
                            : `Show ${row.hiddenCount} unchanged lines`
                        }}
                      </button>
                    </td>
                  </template>
                  <template v-else>
                    <td
                      class="w-12 select-none px-2 py-1 text-right font-mono"
                      :class="getLineNumberClass(row.leftKind)"
                    >
                      {{ row.oldLineNumber ?? '' }}
                    </td>
                    <td
                      class="px-3 py-1 font-mono"
                      :class="getCodeCellClass(row.leftKind)"
                    >
                      <pre
                        class="m-0 whitespace-pre-wrap break-words"
                      ><code>{{ row.leftText }}</code></pre>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="flex-1 rounded-b-md bg-green-500/10 p-4 dark:bg-green-500/20 md:rounded-r-md md:rounded-bl-none"
        >
          <h3
            class="mb-2 text-sm font-medium text-green-700 dark:text-green-200"
          >
            Current Version
          </h3>
          <div
            class="h-full min-h-[200px] overflow-auto rounded border border-green-300 bg-white dark:border-green-700 dark:bg-gray-800"
          >
            <table class="w-full border-collapse text-xs">
              <tbody>
                <tr
                  v-for="row in renderRows"
                  :key="`right-${row.key}`"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <template v-if="row.type === 'collapsed'">
                    <td
                      colspan="2"
                      class="bg-gray-100 px-3 py-2 text-center text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <button
                        type="button"
                        class="font-medium underline"
                        @click="toggleCollapsedChunk(row.key)"
                      >
                        {{
                          expandedChunks[row.key]
                            ? `Hide ${row.hiddenCount} unchanged lines`
                            : `Show ${row.hiddenCount} unchanged lines`
                        }}
                      </button>
                    </td>
                  </template>
                  <template v-else>
                    <td
                      class="w-12 select-none px-2 py-1 text-right font-mono"
                      :class="getLineNumberClass(row.rightKind)"
                    >
                      {{ row.newLineNumber ?? '' }}
                    </td>
                    <td
                      class="px-3 py-1 font-mono"
                      :class="getCodeCellClass(row.rightKind)"
                    >
                      <pre
                        class="m-0 whitespace-pre-wrap break-words"
                      ><code>{{ row.rightText }}</code></pre>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        class="mt-4 flex flex-wrap justify-center gap-4 border-t p-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        <span class="flex items-center">
          <span
            class="mr-1 inline-block h-3 w-3 bg-red-500/20 dark:bg-red-500/30"
          />
          Removed content
        </span>
        <span class="flex items-center">
          <span
            class="mr-1 inline-block h-3 w-3 bg-green-500/20 dark:bg-green-500/30"
          />
          Added content
        </span>
      </div>
    </div>
  </div>
</template>
