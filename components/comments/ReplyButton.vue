<script lang="ts" setup>
  import type { PropType } from "vue";
  import { computed } from "vue";
  import type { Comment } from "@/__generated__/graphql";
  import RequireAuth from "@/components/auth/RequireAuth.vue";

  const props = defineProps({
    showReplyEditor: {
      type: Boolean,
      default: false,
    },
    commentData: {
      type: Object as PropType<Comment>,
      required: true,
    },
    parentCommentId: {
      type: String,
      default: "",
    },
    depth: {
      type: Number,
      default: 0,
    },
    isPermalinked: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["toggleShowReplyEditor"]);

  const buttonClasses = computed(() => {
    const baseClasses = ["flex gap-1 max-h-6 cursor-pointer items-center rounded-full px-2 py-1"];

    const defaultClasses =
      "bg-gray-100 text-black hover:border-gray-400 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700";
    return [
      ...baseClasses,
      ...defaultClasses,
      props.isPermalinked
        ? "hover:bg-blue-300 dark:hover:bg-blue-700"
        : "hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700",
    ];
  });
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <div class="flex items-center gap-1">
        <div
          :class="[buttonClasses, showReplyEditor ? 'text-black dark:text-gray-100' : '']"
          data-testid="reply-comment-button"
          @click="emit('toggleShowReplyEditor')"
        >
          <i class="fa-regular fa-comment h-3 w-3" /> Reply
        </div>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex items-center gap-1">
        <button
          :class="[buttonClasses]"
          data-testid="reply-comment-button"
        >
          <i class="fa-regular fa-comment h-3 w-3" />
          Reply
        </button>
      </div>
    </template>
  </RequireAuth>
</template>
