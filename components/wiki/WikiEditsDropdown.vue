<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import type { WikiPage, TextVersion } from '@/__generated__/graphql';
import {
  usePopoverPositioning,
  type PopoverPosition,
} from '@/composables/usePopoverPositioning';
import { timeAgo } from '@/utils';
import WikiRevisionDiffModal from './WikiRevisionDiffModal.vue';

// Define type for revision data
interface WikiRevisionData {
  id: string;
  author: string;
  createdAt: string;
  isCurrent: boolean;
  oldVersionData?: TextVersion;
  newVersionData?: TextVersion;
}

const props = defineProps({
  wikiPage: {
    type: Object as PropType<WikiPage>,
    required: true,
  },
});

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);
const popoverPosition = ref<PopoverPosition>({
  top: 0,
  left: 0,
  placement: 'below',
});
const activeRevision = ref<WikiRevisionData | null>(null);

// Total number of edits
const totalEdits = computed(() => {
  return props.wikiPage?.PastVersions?.length || 0;
});

// Check if there are any edits to show (need at least 1 past version, meaning it has been edited)
const hasEdits = computed(() => {
  return totalEdits.value >= 1;
});

// Process all versions and sort by timestamp (newest first)
const allEdits = computed(() => {
  const edits: WikiRevisionData[] = [];

  if (props.wikiPage?.PastVersions?.length) {
    // Create current version entry (as TextVersion structure)
    const currentVersion = {
      id: 'current',
      body: props.wikiPage.body,
      createdAt: props.wikiPage.updatedAt || props.wikiPage.createdAt,
      Author: props.wikiPage.VersionAuthor,
      AuthorConnection: {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      },
    };

    // First item: most recent edit (current vs most recent past version)
    edits.push({
      id: 'most-recent-edit',
      author: props.wikiPage.VersionAuthor?.username || '[Deleted]',
      createdAt: props.wikiPage.updatedAt || props.wikiPage.createdAt,
      isCurrent: true,
      // Store the versions for the modal
      oldVersionData: props.wikiPage.PastVersions[0], // Most recent past version
      newVersionData: currentVersion, // Current version
    });

    // Subsequent items: compare each past version with the next one
    props.wikiPage.PastVersions.forEach((version, index) => {
      // Skip the most recent past version since it's already handled above
      if (index === 0) return;

      const nextVersion = props.wikiPage.PastVersions[index - 1]; // Next version (more recent)

      edits.push({
        id: version.id,
        author: version.Author?.username || '[Deleted]',
        createdAt: version.createdAt,
        isCurrent: false,
        // Store the versions for the modal
        oldVersionData: version,
        newVersionData: nextVersion,
      });
    });
  }

  return edits;
});

const isVisibleRef = computed(() => isOpen.value);
const { adjustedPosition, updateAdjustedPosition } = usePopoverPositioning({
  popoverRef,
  position: popoverPosition,
  isVisible: isVisibleRef,
  contentDependencies: [allEdits],
});

// Toggle dropdown
const toggleDropdown = () => {
  if (isOpen.value) {
    isOpen.value = false;
    return;
  }

  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect();
    popoverPosition.value = {
      top: rect.bottom + 8,
      left: rect.left,
      placement: 'below',
      triggerRect: {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        width: rect.width,
      },
    };
  }

  isOpen.value = true;
  updateAdjustedPosition();
};

// Close dropdown when clicking outside
const closeDropdown = () => {
  isOpen.value = false;
};

// Open diff modal for a specific revision
const openRevisionDiff = (revision: WikiRevisionData) => {
  activeRevision.value = revision;
  closeDropdown();
};

// Close diff modal
const closeRevisionDiff = () => {
  activeRevision.value = null;
};

// Handle revision deleted event
const handleRevisionDeleted = () => {
  closeRevisionDiff();
  // The cache will be updated by the mutation
};

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node;
  if (triggerRef.value?.contains(target) || popoverRef.value?.contains(target)) {
    return;
  }
  closeDropdown();
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div v-if="hasEdits" class="relative">
    <!-- Dropdown toggle button -->
    <span class="mx-2">·</span>
    <button
      ref="triggerRef"
      class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      @click="toggleDropdown"
    >
      Edits
    </button>

    <Teleport to="body">
      <!-- Dropdown content -->
      <div
        v-if="isOpen"
        ref="popoverRef"
        class="fixed z-[100] w-64 max-w-[calc(100vw-1rem)] rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        :style="{
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
        }"
      >
        <div
          class="border-b border-gray-200 p-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        >
          Edited {{ totalEdits }} time{{ totalEdits > 1 ? 's' : '' }}
        </div>

        <ul class="max-h-80 overflow-y-auto py-1">
          <li
            v-for="edit in allEdits"
            :key="edit.id"
            class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="openRevisionDiff(edit)"
          >
            <div class="flex flex-col">
              <div class="flex items-center text-sm">
                <span class="font-medium text-gray-900 dark:text-gray-200">{{
                  edit.author
                }}</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ timeAgo(new Date(edit.createdAt)) }}
                <span
                  v-if="edit.isCurrent"
                  class="ml-1 text-green-600 dark:text-green-400"
                >
                  (Current)
                </span>
                <span
                  v-else-if="edit === allEdits[1]"
                  class="ml-1 text-orange-600 dark:text-orange-400"
                >
                  Most recent edit
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </Teleport>

    <!-- Wiki revision diff modal -->
    <WikiRevisionDiffModal
      v-if="activeRevision"
      :open="!!activeRevision"
      :old-version="activeRevision.oldVersionData || {}"
      :new-version="activeRevision.newVersionData || {}"
      :is-most-recent="activeRevision === allEdits[0]"
      @close="closeRevisionDiff"
      @deleted="handleRevisionDeleted"
    />
  </div>
</template>
