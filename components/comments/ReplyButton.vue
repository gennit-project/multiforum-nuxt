<script lang="ts" setup>
import type { PropType } from "vue";
import type { Comment } from "@/__generated__/graphql";
import RequireAuth from "@/components/auth/RequireAuth.vue";

// Define props
defineProps({
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
});

const emit = defineEmits(['toggleShowReplyEditor']);

const buttonClasses = "inline-flex gap-1 h-6 cursor-pointer items-center hover:bg-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 hover:dark:text-blue-500";

</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <div class="flex items-center">
        <div
          data-testid="reply-comment-button"
          :class="[buttonClasses, showReplyEditor ? 'text-black dark:text-gray-100' : '']"
          @click="emit('toggleShowReplyEditor')"
        >
          <i class="fa-regular fa-comment h-3 w-3" /> Reply
        </div>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex items-center">
        <button
          data-testid="reply-comment-button"
          :class="[buttonClasses]"
        >
          <i class="fa-regular fa-comment h-3 w-3" />
          Reply
        </button>
      </div>
    </template>
  </RequireAuth>
</template>
