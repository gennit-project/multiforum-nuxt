<script setup lang="ts">
  import { computed } from "vue";
  import GenericModal from "@/components/GenericModal.vue";
  import * as DiffMatchPatch from "diff-match-patch";

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

  const emit = defineEmits(["close"]);

  const oldVersionUsername = computed(() => {
    return props.oldVersion.Author?.username || "[Deleted]";
  });

  const newVersionUsername = computed(() => {
    return props.newVersion.Author?.username || "[Deleted]";
  });

  const oldVersionDate = computed(() => {
    return new Date(props.oldVersion.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  });

  const newVersionDate = computed(() => {
    return new Date(props.newVersion.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  });

  const oldContent = computed(() => props.oldVersion.body || "");
  const newContent = computed(() => props.newVersion.body || "");

  // Computed property that generates the diff HTML
  const diffHtml = computed(() => {
    const dmp = new DiffMatchPatch.diff_match_patch();
    const diffs = dmp.diff_main(oldContent.value, newContent.value);
    dmp.diff_cleanupSemantic(diffs);

    // Create highlighted HTML for both sides
    let leftHtml = "";
    let rightHtml = "";

    diffs.forEach((diff) => {
      const [operation, text] = diff;
      const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

      // Operation is either -1 (deletion), 0 (equal), or 1 (insertion)
      if (operation === -1) {
        // Deletion - show in left column with red background
        leftHtml += `<span class="bg-red-500/20 text-red-800 dark:bg-red-500/30 dark:text-red-100">${escapedText}</span>`;
      } else if (operation === 1) {
        // Insertion - show in right column with green background
        rightHtml += `<span class="bg-green-500/20 text-green-800 dark:bg-green-500/30 dark:text-green-100">${escapedText}</span>`;
      } else {
        // Equal - show in both columns
        leftHtml += escapedText;
        rightHtml += escapedText;
      }
    });

    return {
      left: leftHtml,
      right: rightHtml,
    };
  });

  const handleClose = () => {
    emit("close");
  };
</script>

<template>
  <GenericModal
    :open="open"
    title="Revision History"
    @close="handleClose"
  >
    <template #icon>
      <i class="fa-solid fa-plus-minus text-lg text-orange-600 dark:text-orange-400"></i>
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
          </div>
        </div>

        <!-- Diff view -->
        <div class="rounded-md border dark:border-gray-700">
          <div class="flex flex-col md:flex-row">
            <!-- Old version (left side) -->
            <div
              class="flex-1 rounded-t-md border-b bg-red-500/10 p-4 dark:border-gray-700 dark:bg-red-500/20 md:rounded-l-md md:rounded-tr-none md:border-b-0 md:border-r"
            >
              <h3 class="mb-2 text-sm font-medium text-red-700 dark:text-red-200">
                Previous Version
              </h3>
              <div
                class="h-full min-h-[200px] overflow-auto rounded border border-red-300 bg-white p-3 dark:border-red-700 dark:bg-gray-800"
              >
                <div v-html="diffHtml.left"></div>
              </div>
            </div>

            <!-- New version (right side) -->
            <div
              class="flex-1 rounded-b-md bg-green-500/10 p-4 dark:bg-green-500/20 md:rounded-r-md md:rounded-bl-none"
            >
              <h3 class="mb-2 text-sm font-medium text-green-700 dark:text-green-200">
                Current Version
              </h3>
              <div
                class="h-full min-h-[200px] overflow-auto rounded border border-green-300 bg-white p-3 dark:border-green-700 dark:bg-gray-800"
              >
                <div v-html="diffHtml.right"></div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div
            class="mt-4 flex flex-wrap justify-center gap-4 border-t p-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            <span class="flex items-center">
              <span class="mr-1 inline-block h-3 w-3 bg-red-500/20 dark:bg-red-500/30"></span>
              Removed content
            </span>
            <span class="flex items-center">
              <span class="mr-1 inline-block h-3 w-3 bg-green-500/20 dark:bg-green-500/30"></span>
              Added content
            </span>
          </div>
        </div>
      </div>
    </template>
  </GenericModal>
</template>
