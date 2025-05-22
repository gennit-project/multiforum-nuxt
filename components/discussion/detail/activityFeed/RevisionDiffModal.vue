<script setup lang="ts">
  import { computed } from "vue";
  import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
  import GenericModal from "@/components/GenericModal.vue";

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
          <div class="bg-red-50 rounded-t-md p-4 dark:bg-red-900/30">
            <h3 class="mb-2 text-sm font-medium text-red-800 dark:text-red-300">Removed content</h3>
            <div
              class="rounded border border-red-200 bg-white p-3 dark:border-red-900 dark:bg-gray-800"
            >
              <MarkdownRenderer :text="oldContent" />
            </div>
          </div>

          <div class="bg-green-50 rounded-b-md p-4 dark:bg-green-900/30">
            <h3 class="mb-2 text-sm font-medium text-green-800 dark:text-green-300">
              Added content
            </h3>
            <div
              class="rounded border border-green-200 bg-white p-3 dark:border-green-900 dark:bg-gray-800"
            >
              <MarkdownRenderer :text="newContent" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </GenericModal>
</template>
