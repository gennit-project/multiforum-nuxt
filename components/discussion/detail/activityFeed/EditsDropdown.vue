<script setup lang="ts">
  import { ref, computed } from "vue";
  import type { PropType } from "vue";
  import type { Discussion } from "@/__generated__/graphql";
  import { timeAgo } from "@/utils";
  import RevisionDiffModal from "./RevisionDiffModal.vue";

  const props = defineProps({
    discussion: {
      type: Object as PropType<Discussion>,
      required: true,
    },
  });

  const isOpen = ref(false);
  const activeRevision = ref(null);

  // Total number of edits - title versions + body versions
  const totalEdits = computed(() => {
    const titleEdits = props.discussion?.PastTitleVersions?.length || 0;
    const bodyEdits = props.discussion?.PastBodyVersions?.length || 0;
    return titleEdits + bodyEdits;
  });

  // Check if there are any edits to show
  const hasEdits = computed(() => {
    return totalEdits.value > 0;
  });

  // Combine both types of edits and sort by timestamp (newest first)
  const allEdits = computed(() => {
    const edits = [];

    // Add body revisions
    if (props.discussion?.PastBodyVersions?.length) {
      // Create current version entry
      const currentVersion = {
        id: "current",
        type: "body",
        author: props.discussion.Author?.username || "[Deleted]",
        createdAt: props.discussion.updatedAt || props.discussion.createdAt,
        isCurrent: true,
        body: props.discussion.body, // Add the current body text
        Author: props.discussion.Author, // Add the full Author object to match the structure
      };

      // Add past body versions
      props.discussion.PastBodyVersions.forEach((version, index) => {
        const nextVersion =
          index === 0 ? currentVersion : props.discussion.PastBodyVersions[index - 1];

        edits.push({
          id: version.id,
          type: "body",
          author: version.Author?.username || "[Deleted]",
          createdAt: version.createdAt,
          isCurrent: false,
          oldVersion: version,
          newVersion: nextVersion,
        });
      });
    }

    // Add title revisions
    if (props.discussion?.PastTitleVersions?.length) {
      // Add past title versions
      props.discussion.PastTitleVersions.forEach((version, index) => {
        const nextVersion =
          index === 0
            ? {
                id: "current",
                body: props.discussion.title,
                Author: props.discussion.Author,
                createdAt: props.discussion.updatedAt || props.discussion.createdAt,
              }
            : props.discussion.PastTitleVersions[index - 1];

        edits.push({
          id: version.id,
          type: "title",
          author: version.Author?.username || "[Deleted]",
          createdAt: version.createdAt,
          isCurrent: false,
          oldVersion: version,
          newVersion: nextVersion,
        });
      });
    }

    // Sort by date (newest first)
    return edits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // Toggle dropdown
  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
  };

  // Close dropdown when clicking outside
  const closeDropdown = () => {
    isOpen.value = false;
  };

  // Open diff modal for a specific revision
  const openRevisionDiff = (revision) => {
    activeRevision.value = revision;
  };

  // Close diff modal
  const closeRevisionDiff = () => {
    activeRevision.value = null;
  };
</script>

<template>
  <div
    v-if="hasEdits"
    v-click-outside="closeDropdown"
    class="relative"
  >
    <!-- Dropdown toggle button -->
    <button
      class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      @click="toggleDropdown"
    >
      Edits
    </button>

    <!-- Dropdown content -->
    <div
      v-if="isOpen"
      class="absolute right-0 z-50 mt-2 w-64 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        class="border-b border-gray-200 p-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
      >
        Edited {{ totalEdits }} time{{ totalEdits > 1 ? "s" : "" }}
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
              <span class="font-medium text-gray-900 dark:text-gray-200">{{ edit.author }}</span>
              <span
                v-if="edit.type === 'title'"
                class="ml-1 text-xs text-gray-500 dark:text-gray-400"
                >(title)</span
              >
              <span
                v-else
                class="ml-1 text-xs text-gray-500 dark:text-gray-400"
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
                class="ml-1 text-blue-600 dark:text-blue-400"
              >
                Most recent
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Revision diff modal -->
    <RevisionDiffModal
      v-if="activeRevision"
      :open="!!activeRevision"
      :old-version="activeRevision.oldVersion"
      :new-version="activeRevision.newVersion"
      :is-most-recent="activeRevision === allEdits[0]"
      @close="closeRevisionDiff"
    />
  </div>
</template>
