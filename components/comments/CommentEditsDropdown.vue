<script setup lang="ts">
  import { ref, computed } from "vue";
  import type { PropType } from "vue";
  import type { Comment } from "@/__generated__/graphql";
  import { timeAgo } from "@/utils";
  import CommentRevisionDiffModal from "./CommentRevisionDiffModal.vue";

  const props = defineProps({
    comment: {
      type: Object as PropType<Comment>,
      required: true,
    },
  });

  const isOpen = ref(false);
  const activeRevision = ref(null);

  // Total number of edits
  const totalEdits = computed(() => {
    return props.comment?.PastVersions?.length || 0;
  });

  // Check if there are any edits to show (need at least 2 revisions - original + at least 1 edit)
  const hasEdits = computed(() => {
    return totalEdits.value >= 2;
  });

  // Process all versions and sort by timestamp (newest first)
  const allEdits = computed(() => {
    const edits = [];

    // Only process if we have past versions
    if (props.comment?.PastVersions?.length) {
      // Create current version entry
      const currentVersion = {
        id: "current",
        author: props.comment.CommentAuthor?.username || "[Deleted]",
        createdAt: props.comment.updatedAt || props.comment.createdAt,
        isCurrent: true,
        body: props.comment.text, // Current comment text
        Author: props.comment.CommentAuthor, // Add the full Author object
      };

      // Add past versions
      props.comment.PastVersions.forEach((version, index) => {
        const nextVersion = index === 0 ? currentVersion : props.comment.PastVersions[index - 1];

        edits.push({
          id: version.id,
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

  // Handle revision deleted event
  const handleRevisionDeleted = (deletedId) => {
    // Close the modal
    closeRevisionDiff();

    // If the deleted revision is in the past versions, update the UI
    if (props.comment?.PastVersions) {
      const index = props.comment.PastVersions.findIndex((version) => version.id === deletedId);
      if (index !== -1) {
        // Close the dropdown as we've modified the list
        isOpen.value = false;
      }
    }
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
    <CommentRevisionDiffModal
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
