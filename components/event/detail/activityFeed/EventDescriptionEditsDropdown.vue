<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import type { Event, TextVersion, User } from '@/__generated__/graphql';
import {
  usePopoverPositioning,
  type PopoverPosition,
} from '@/composables/usePopoverPositioning';
import { timeAgo } from '@/utils';
import { DELETE_EVENT_DESCRIPTION_REVISION } from '@/graphQLData/event/mutations';
import RevisionDiffModal from '@/components/discussion/detail/activityFeed/RevisionDiffModal.vue';

const props = defineProps({
  event: {
    type: Object as PropType<Event>,
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

interface RevisionData {
  id: string;
  type: 'description';
  author: string;
  createdAt: string;
  isCurrent: boolean;
  oldVersion:
    | TextVersion
    | {
        id: string;
        body?: string;
        createdAt: string;
        Author?: User | null;
      };
  newVersion:
    | TextVersion
    | {
        id: string;
        body?: string;
        createdAt: string;
        Author?: User | null;
      };
}

const activeRevision = ref<RevisionData | null>(null);

const totalEdits = computed(() => {
  return props.event?.PastDescriptionVersions?.length || 0;
});

const hasEdits = computed(() => {
  return totalEdits.value >= 1;
});

// Build the description edit transitions. Mirrors the discussion body model:
// - TextVersion.Author = author of the OLD content stored in that version
// - DescriptionLastEditedBy = author of the current description (most recent edit)
const allEdits = computed(() => {
  const edits: RevisionData[] = [];

  if (props.event?.PastDescriptionVersions?.length) {
    const currentVersionBody = {
      id: 'current',
      body: props.event.description ?? undefined,
      createdAt: String(props.event.updatedAt || props.event.createdAt),
    };

    props.event.PastDescriptionVersions.forEach((version, index) => {
      const authorOfNewContent =
        index === 0
          ? props.event.DescriptionLastEditedBy
          : props.event.PastDescriptionVersions[index - 1]?.Author;

      const nextVersionBody =
        index === 0
          ? currentVersionBody
          : props.event.PastDescriptionVersions[index - 1];

      if (!nextVersionBody) {
        return;
      }

      edits.push({
        id: version.id,
        type: 'description' as const,
        author: authorOfNewContent?.username || '[Deleted]',
        createdAt: version.createdAt,
        isCurrent: false,
        oldVersion: version,
        newVersion: {
          id: nextVersionBody.id,
          body: nextVersionBody.body ?? undefined,
          Author: authorOfNewContent,
          createdAt: version.createdAt,
        },
      });
    });
  }

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

const closeDropdown = () => {
  isOpen.value = false;
};

const openRevisionDiff = (revision: RevisionData) => {
  activeRevision.value = revision;
  closeDropdown();
};

const closeRevisionDiff = () => {
  activeRevision.value = null;
};

const handleRevisionDeleted = () => {
  closeRevisionDiff();
  isOpen.value = false;
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
    <button
      ref="triggerRef"
      class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      @click="toggleDropdown"
    >
      Edits
    </button>

    <Teleport to="body">
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
                  >(description)</span
                >
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ timeAgo(new Date(edit.createdAt)) }}
                <span
                  v-if="edit === allEdits[0]"
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

    <RevisionDiffModal
      v-if="activeRevision"
      :open="!!activeRevision"
      :old-version="activeRevision.oldVersion"
      :new-version="activeRevision.newVersion"
      :is-most-recent="activeRevision === allEdits[0]"
      :delete-mutation="DELETE_EVENT_DESCRIPTION_REVISION"
      @close="closeRevisionDiff"
      @deleted="handleRevisionDeleted"
    />
  </div>
</template>
