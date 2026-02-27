<script setup lang="ts">
import { computed, ref } from 'vue';
import GenericModal from '@/components/GenericModal.vue';
import { useMutation } from '@vue/apollo-composable';
import { DELETE_TEXT_VERSION } from '@/graphQLData/comment/mutations';
import {
  buildDiffLineRows,
  collapseDiffRows,
  expandDiffRows,
  type SideKind,
} from '@/utils/revisionDiff';

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  oldVersion: {
    type: Object,
    required: true,
  },
  newVersion: {
    type: Object,
    required: true,
  },
  isMostRecent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'deleted']);

// Deletion state
const isDeleting = ref(false);

const oldVersionUsername = computed(() => {
  return props.oldVersion.Author?.username || '[Deleted]';
});

const newVersionUsername = computed(() => {
  return props.newVersion.Author?.username || '[Deleted]';
});

const oldVersionDate = computed(() => {
  return new Date(props.oldVersion.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
});

const newVersionDate = computed(() => {
  return new Date(props.newVersion.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
});

const oldContent = computed(() => props.oldVersion.body || '');
const newContent = computed(() => props.newVersion.body || '');

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

const editReason = computed(() => {
  const newReason = (props.newVersion as Record<string, any>).editReason;
  const oldReason = (props.oldVersion as Record<string, any>).editReason;
  return newReason || oldReason || '';
});

// Set up delete mutation with dynamic variables
const {
  mutate: deleteTextVersion,
  loading,
  error,
  onDone,
} = useMutation(DELETE_TEXT_VERSION, {
  // Don't set variables here, as they won't update if props change
  update: (cache, { data }) => {
    if (data?.deleteTextVersions?.nodesDeleted) {
      // Clear cache for this revision
      cache.evict({ id: `TextVersion:${props.oldVersion.id}` });
      cache.gc();
    }
  },
});

const handleDelete = async () => {
  if (
    confirm(
      'Are you sure you want to delete this revision? This action cannot be undone.'
    )
  ) {
    isDeleting.value = true;
    try {
      // Pass variables at call time to ensure we use the current props value
      await deleteTextVersion({
        id: props.oldVersion.id,
      });
    } catch {
      isDeleting.value = false;
      // Error will be handled by the error ref from useMutation
    }
  }
};

const handleClose = () => {
  emit('close');
};

onDone(() => {
  emit('deleted', props.oldVersion.id);

  isDeleting.value = false;
  emit('close');
});
</script>

<template>
  <GenericModal
    :open="open"
    title="Comment Revision History"
    :error="error ? error.message : ''"
    :loading="isDeleting || loading"
    primary-button-text="Delete"
    :primary-button-disabled="!oldVersion.id || oldVersion.id === 'current'"
    highlight-color="red"
    @close="handleClose"
    @primary-button-click="handleDelete"
  >
    <template #icon>
      <i
        class="fa-solid fa-plus-minus text-lg text-orange-600 dark:text-orange-400"
      />
    </template>
    <template #content>
      <div class="flex flex-col gap-4">
        <!-- Revision information -->
        <div class="flex flex-col gap-2">
          <div
            v-if="isMostRecent"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
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

            <div
              v-if="editReason"
              class="text-xs text-gray-600 dark:text-gray-400"
            >
              <span class="font-semibold text-gray-700 dark:text-gray-200"
                >Edit reason:</span
              >
              {{ editReason }}
            </div>
          </div>
        </div>

        <!-- Diff view -->
        <div class="rounded-md border dark:border-gray-700">
          <div class="flex flex-col md:flex-row">
            <!-- Old version (left side) -->
            <div
              class="flex-1 rounded-t-md border-b bg-red-500/10 p-4 dark:border-gray-700 dark:bg-red-500/20 md:rounded-l-md md:rounded-tr-none md:border-b-0 md:border-r"
            >
              <h3
                class="mb-2 text-sm font-medium text-red-700 dark:text-red-200"
              >
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

            <!-- New version (right side) -->
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

          <!-- Legend -->
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
  </GenericModal>
</template>
