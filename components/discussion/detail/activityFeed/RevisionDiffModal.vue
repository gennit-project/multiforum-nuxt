<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import type { TextVersion } from '@/__generated__/graphql';
import GenericModal from '@/components/GenericModal.vue';
import * as DiffMatchPatch from 'diff-match-patch';
import { useMutation } from '@vue/apollo-composable';
import { DELETE_TEXT_VERSION } from '@/graphQLData/discussion/mutations';

// Define the version data structure that can include current version data
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
  open: {
    type: Boolean,
    required: true,
  },
  oldVersion: {
    type: Object as PropType<TextVersion | VersionData>,
    required: true,
  },
  newVersion: {
    type: Object as PropType<TextVersion | VersionData>,
    required: true,
  },
  isMostRecent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  close: [];
  deleted: [deletedId: string];
}>();

// Deletion state
const isDeleting = ref(false);

const oldVersionUsername = computed(() => {
  const author = props.oldVersion.Author;
  return author && 'username' in author && author.username
    ? author.username
    : '[Deleted]';
});

const newVersionUsername = computed(() => {
  const author = props.newVersion.Author;
  return author && 'username' in author && author.username
    ? author.username
    : '[Deleted]';
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

type SideKind = 'context' | 'removed' | 'added' | 'empty';

interface DiffLineRow {
  type: 'line';
  key: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  leftText: string;
  rightText: string;
  leftKind: SideKind;
  rightKind: SideKind;
  isContext: boolean;
}

interface CollapsedDiffRow {
  type: 'collapsed';
  key: string;
  hiddenCount: number;
  hiddenRows: DiffLineRow[];
}

type DiffRow = DiffLineRow | CollapsedDiffRow;

const CONTEXT_LINES = 3;
const expandedChunks = ref<Record<string, boolean>>({});

const allDiffLineRows = computed(() => {
  const dmp = new DiffMatchPatch.diff_match_patch();
  const lineData = dmp.diff_linesToChars_(oldContent.value, newContent.value);
  const diffs = dmp.diff_main(lineData.chars1, lineData.chars2, false);
  dmp.diff_charsToLines_(diffs, lineData.lineArray);
  dmp.diff_cleanupSemantic(diffs);

  const blocks = diffs.map(([operation, text]) => {
    const lines = text.split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    return { operation, lines };
  });

  const rows: DiffLineRow[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let rowIndex = 0;

  const pushRow = (row: Omit<DiffLineRow, 'type' | 'key'>) => {
    rows.push({
      type: 'line',
      key: `line-${rowIndex}`,
      ...row,
    });
    rowIndex += 1;
  };

  let blockIndex = 0;
  while (blockIndex < blocks.length) {
    const block = blocks[blockIndex];
    if (!block) {
      blockIndex += 1;
      continue;
    }

    const nextBlock = blocks[blockIndex + 1];

    if (
      block.operation === -1 &&
      nextBlock &&
      nextBlock.operation === 1
    ) {
      const removedLines = block.lines;
      const addedLines = nextBlock.lines;
      const maxLineCount = Math.max(removedLines.length, addedLines.length);

      for (let lineIndex = 0; lineIndex < maxLineCount; lineIndex += 1) {
        const hasRemovedLine = lineIndex < removedLines.length;
        const hasAddedLine = lineIndex < addedLines.length;

        pushRow({
          oldLineNumber: hasRemovedLine ? oldLineNumber++ : null,
          newLineNumber: hasAddedLine ? newLineNumber++ : null,
          leftText: hasRemovedLine ? (removedLines[lineIndex] ?? '') : '',
          rightText: hasAddedLine ? (addedLines[lineIndex] ?? '') : '',
          leftKind: hasRemovedLine ? 'removed' : 'empty',
          rightKind: hasAddedLine ? 'added' : 'empty',
          isContext: false,
        });
      }

      blockIndex += 2;
      continue;
    }

    if (block.operation === 0) {
      block.lines.forEach((line) => {
        pushRow({
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
          leftText: line,
          rightText: line,
          leftKind: 'context',
          rightKind: 'context',
          isContext: true,
        });
      });
      blockIndex += 1;
      continue;
    }

    if (block.operation === -1) {
      block.lines.forEach((line) => {
        pushRow({
          oldLineNumber: oldLineNumber++,
          newLineNumber: null,
          leftText: line,
          rightText: '',
          leftKind: 'removed',
          rightKind: 'empty',
          isContext: false,
        });
      });
      blockIndex += 1;
      continue;
    }

    if (block.operation === 1) {
      block.lines.forEach((line) => {
        pushRow({
          oldLineNumber: null,
          newLineNumber: newLineNumber++,
          leftText: '',
          rightText: line,
          leftKind: 'empty',
          rightKind: 'added',
          isContext: false,
        });
      });
    }
    blockIndex += 1;
  }

  return rows;
});

const collapsedDiffRows = computed(() => {
  const rows = allDiffLineRows.value;
  const changedIndexes = rows.reduce<number[]>((indexes, row, index) => {
    if (!row.isContext) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (!changedIndexes.length) {
    return rows as DiffRow[];
  }

  const visibleIndexes = new Set<number>();
  changedIndexes.forEach((changedIndex) => {
    const start = Math.max(0, changedIndex - CONTEXT_LINES);
    const end = Math.min(rows.length - 1, changedIndex + CONTEXT_LINES);

    for (let i = start; i <= end; i += 1) {
      visibleIndexes.add(i);
    }
  });

  const output: DiffRow[] = [];
  let cursor = 0;
  while (cursor < rows.length) {
    if (visibleIndexes.has(cursor)) {
      output.push(rows[cursor] as DiffLineRow);
      cursor += 1;
      continue;
    }

    const hiddenRows: DiffLineRow[] = [];
    const chunkStart = cursor;
    while (cursor < rows.length && !visibleIndexes.has(cursor)) {
      hiddenRows.push(rows[cursor] as DiffLineRow);
      cursor += 1;
    }

    output.push({
      type: 'collapsed',
      key: `collapsed-${chunkStart}-${cursor - 1}`,
      hiddenCount: hiddenRows.length,
      hiddenRows,
    });
  }

  return output;
});

const renderRows = computed(() => {
  const rows: DiffRow[] = [];

  collapsedDiffRows.value.forEach((row) => {
    if (row.type === 'collapsed' && expandedChunks.value[row.key]) {
      rows.push(...row.hiddenRows);
      return;
    }

    rows.push(row);
  });

  return rows;
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

onDone(() => {
  isDeleting.value = false;
  emit('deleted', props.oldVersion.id);
  emit('close');
});

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <GenericModal
    :open="open"
    title="Revision History"
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
