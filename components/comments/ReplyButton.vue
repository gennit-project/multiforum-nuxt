<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { Comment } from '@/__generated__/graphql';
import RequireAuth from '@/components/auth/RequireAuth.vue';

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
    default: '',
  },
  depth: {
    type: Number,
    default: 0,
  },
  isPermalinked: {
    type: Boolean,
    default: false,
  },
  isMarkedAsAnswer: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggleShowReplyEditor']);

const buttonClasses = computed(() => {
  const baseClasses = [
    'flex gap-1 max-h-6 cursor-pointer items-center rounded-full px-2 py-1',
  ];

  // Use green styling for best answer comments
  if (props.isMarkedAsAnswer) {
    return [
      ...baseClasses,
      'bg-green-100 text-green-700 hover:border-green-400 hover:bg-green-200 dark:text-white dark:hover:bg-green-700 dark:bg-green-800',
    ];
  }

  const defaultClasses =
    'bg-gray-100 text-black hover:border-gray-400 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700';
  return [
    ...baseClasses,
    ...defaultClasses,
    props.isPermalinked
      ? 'hover:bg-orange-300 dark:hover:bg-orange-700'
      : 'hover:bg-gray-200 dark:hover:bg-gray-600 dark:bg-gray-700',
  ];
});
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <div class="flex items-center gap-1">
        <button
          type="button"
          data-testid="reply-comment-button"
          :class="[
            buttonClasses,
            showReplyEditor ? 'text-black dark:text-gray-100' : '',
          ]"
          @click="emit('toggleShowReplyEditor')"
        >
          <i class="fa-regular fa-comment h-3 w-3" aria-hidden="true" /> Reply
        </button>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex items-center gap-1">
        <button type="button" data-testid="reply-comment-button" :class="[buttonClasses]">
          <i class="fa-regular fa-comment h-3 w-3" aria-hidden="true" />
          Reply
        </button>
      </div>
    </template>
  </RequireAuth>
</template>
