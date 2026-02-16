<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import type { Discussion, TextVersion, User } from '@/__generated__/graphql';
import {
  usePopoverPositioning,
  type PopoverPosition,
} from '@/composables/usePopoverPositioning';
import { timeAgo } from '@/utils';
import RevisionDiffModal from './RevisionDiffModal.vue';

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
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

// Define type for revision data
interface RevisionData {
  id: string;
  type: 'body' | 'title';
  author: string;
  createdAt: string;
  isCurrent: boolean;
  oldVersion:
    | TextVersion
    | {
        id: string;
        title?: string;
        body?: string;
        createdAt: string;
        Author?: User | null;
      };
  newVersion:
    | TextVersion
    | {
        id: string;
        title?: string;
        body?: string;
        createdAt: string;
        Author?: User | null;
      };
}

const activeRevision = ref<RevisionData | null>(null);

// Total number of edits - body versions only (title edits are handled separately)
const totalEdits = computed(() => {
  const bodyEdits = props.discussion?.PastBodyVersions?.length || 0;
  return bodyEdits;
});

// Check if there are any edits to show (need at least 1 past version, meaning it has been edited)
const hasEdits = computed(() => {
  return totalEdits.value >= 1;
});

// Get body edits only (title edits are handled by separate DiscussionTitleVersions component)
const allEdits = computed(() => {
  const edits: RevisionData[] = [];

  // Add body revisions only
  if (props.discussion?.PastBodyVersions?.length) {
    // Create current version entry (body content only - author is set per edit)
    const currentVersionBody = {
      id: 'current',
      body: props.discussion.body ?? undefined,
      createdAt: String(
        props.discussion.updatedAt || props.discussion.createdAt
      ),
    };

    // Add past body versions
    // With the corrected backend model:
    // - TextVersion.Author = author of the content stored in that TextVersion (the OLD content)
    // - BodyLastEditedBy = author of the current discussion body (the person who made the most recent edit)
    props.discussion.PastBodyVersions.forEach((version, index) => {
      // The author of the OLD content is now correctly stored in version.Author
      // (This is the author of the content being replaced, set correctly by the backend)

      // The author of the NEW content (who made this edit):
      // - For the most recent edit (index 0): use BodyLastEditedBy
      // - For older edits: use the next TextVersion's Author (who wrote that content)
      const authorOfNewContent =
        index === 0
          ? props.discussion.BodyLastEditedBy
          : props.discussion.PastBodyVersions[index - 1]?.Author;

      // Get the new version's body content
      const nextVersionBody =
        index === 0
          ? currentVersionBody
          : props.discussion.PastBodyVersions[index - 1];

      // Skip if we don't have valid next version data
      if (!nextVersionBody) {
        return;
      }

      edits.push({
        id: version.id,
        type: 'body' as const,
        // Show who made this edit (the author of the new content)
        author: authorOfNewContent?.username || '[Deleted]',
        createdAt: version.createdAt,
        isCurrent: false,
        // oldVersion.Author = author of the old content (directly from TextVersion, now correct)
        oldVersion: version,
        newVersion: {
          id: nextVersionBody.id,
          body: nextVersionBody.body ?? undefined,
          Author: authorOfNewContent,
          createdAt: version.createdAt, // Use edit timestamp for the new version
        },
      });
    });
  }

  // Sort by date (newest first - most recent at top)
  return edits.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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
const openRevisionDiff = (revision: RevisionData) => {
  activeRevision.value = revision;
  closeDropdown();
};

// Close diff modal
const closeRevisionDiff = () => {
  activeRevision.value = null;
};

// Handle revision deleted event
const handleRevisionDeleted = (deletedId: string) => {
  // Close the modal
  closeRevisionDiff();

  // If the deleted revision is in the body versions, refetch the discussion data
  // This will be handled by the cache update in the mutation, but we can optimize the UI
  // by filtering out the deleted revision from our local state
  if (props.discussion?.PastBodyVersions) {
    const index = props.discussion.PastBodyVersions.findIndex(
      (version) => version.id === deletedId
    );
    if (index !== -1) {
      // We'll let Apollo Client handle the actual cache update, but we can update our UI immediately
      // by recalculating the allEdits computed property
      isOpen.value = false; // Close the dropdown as we've modified the list
    }
  }
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
                <span class="ml-1 text-xs text-gray-500 dark:text-gray-400"
                  >(body)</span
                >
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
                  v-else-if="edit === allEdits[0]"
                  class="ml-1 text-orange-600 dark:text-orange-400"
                >
                  Most recent
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </Teleport>

    <!-- Revision diff modal -->
    <RevisionDiffModal
      v-if="activeRevision"
      :open="!!activeRevision"
      :old-version="activeRevision.oldVersion"
      :new-version="activeRevision.newVersion"
      :is-most-recent="activeRevision === allEdits[0]"
      @close="closeRevisionDiff"
      @deleted="handleRevisionDeleted"
    />
  </div>
</template>
