<script lang="ts">
import { defineComponent } from "vue";
import { Comment } from "@/__generated__/graphql";
import { PropType } from "vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";

export default defineComponent({
  name: "VoteComponent",
  components: {

    RequireAuth,
  },
  props: {
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
  },
  setup() {
    return {
      buttonClasses: "inline-flex gap-1 h-6 cursor-pointer items-center hover:bg-gray-200 border-gray-100 dark:border-gray-600  bg-gray-100 hover:border-gray-400 dark:bg-gray-700 rounded-full border px-2 py-1 hover:dark:border-blue-500 hover:dark:text-blue-500"
    };
  },
});
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <div class="flex items-center">
        <div
          data-testid="reply-comment-button"
          :class="[buttonClasses, showReplyEditor ? 'text-black dark:text-gray-100' : '']"
          @click="$emit('toggleShowReplyEditor')"
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
