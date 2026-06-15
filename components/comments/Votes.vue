<script setup lang="ts">
import { computed } from 'vue';
import FlagIcon from '../icons/FlagIcon.vue';
import type { SelectOptionData } from '@/types/GenericFormTypes';
import { ALLOWED_ICONS } from '@/utils';

const props = defineProps({
  downvoteActive: {
    type: Boolean,
    default: false,
  },
  upvoteActive: {
    type: Boolean,
    default: false,
  },
  superUpvoteActive: {
    type: Boolean,
    default: false,
  },
  upvoteLoading: {
    type: Boolean,
    default: false,
  },
  superUpvoteLoading: {
    type: Boolean,
    default: false,
  },
  downvoteCount: {
    type: Number,
    default: 0,
  },
  upvoteCount: {
    type: Number,
    default: 0,
  },
  hasModProfile: {
    type: Boolean,
    default: false,
  },
  showDownvote: {
    type: Boolean,
    default: true,
  },
  showDownvoteCount: {
    type: Boolean,
    default: true,
  },
  showUpvote: {
    type: Boolean,
    default: true,
  },
  showSuperUpvote: {
    type: Boolean,
    default: true,
  },
  isOwnContent: {
    type: Boolean,
    default: false,
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

const emit = defineEmits([
  'editFeedback',
  'undoFeedback',
  'giveFeedback',
  'viewFeedback',
  'upvote',
  'undoUpvote',
  'superUpvote',
  'undoSuperUpvote',
]);

const downvoteButtonClasses = computed(() => {
  const baseClasses = [
    'inline-flex max-h-6 items-center rounded-full px-2 py-1',
  ];

  const activeClasses = props.isMarkedAsAnswer
    ? 'border-green-500 bg-green-500 dark:border-green-600 dark:bg-green-600 dark:hover:bg-green-500'
    : 'border-orange-400 text-black bg-orange-400 dark:border-orange-500 dark:bg-orange-400 dark:hover:bg-orange-500';

  const inactiveClasses = props.isMarkedAsAnswer
    ? 'border-green-200 bg-green-100 text-green-700 hover:border-green-400 hover:bg-green-200 dark:border-green-600 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700'
    : 'border-gray-200 text-black dark:text-white bg-gray-100 hover:border-orange-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600';

  const permalinkClasses = props.isPermalinked
    ? 'border-orange-500 hover:bg-orange-300 dark:border-orange-600 dark:hover:bg-orange-600'
    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-200';

  return [
    ...baseClasses,
    props.downvoteActive ? activeClasses : inactiveClasses,
    permalinkClasses,
  ].join(' ');
});

const thumbsDownMenuItems = computed(() => {
  let items: SelectOptionData[] = [
    {
      label: 'View Feedback',
      icon: ALLOWED_ICONS.VIEW_FEEDBACK,
      value: '',
      event: 'viewFeedback',
    },
  ];

  if (props.downvoteActive) {
    items = items.concat([
      {
        label: 'Undo Feedback',
        icon: ALLOWED_ICONS.UNDO,
        value: '',
        event: 'undoFeedback',
      },
      {
        label: 'Edit Feedback',
        icon: ALLOWED_ICONS.EDIT,
        value: '',
        event: 'editFeedback',
      },
    ]);
  } else {
    items = items.concat([
      {
        label: 'Give Feedback',
        icon: ALLOWED_ICONS.GIVE_FEEDBACK,
        value: '',
        event: 'giveFeedback',
      },
    ]);
  }
  return items;
});

function clickUpvote() {
  if (!props.upvoteActive) {
    emit('upvote');
  } else {
    emit('undoUpvote');
  }
}

function editFeedback() {
  emit('editFeedback');
}

function undoFeedback() {
  emit('undoFeedback');
}

function giveFeedback() {
  emit('giveFeedback');
}

function viewFeedback() {
  emit('viewFeedback');
}
</script>

<template>
  <div class="flex flex-row items-center gap-1">
    <VoteButton
      v-if="showUpvote"
      :test-id="'upvote-comment-button'"
      :count="upvoteCount"
      :loading="upvoteLoading"
      :active="upvoteActive"
      :tooltip-text="
        upvoteActive
          ? 'Undo upvote'
          : 'Upvote to make this comment more visible'
      "
      :is-permalinked="isPermalinked"
      :is-marked-as-answer="isMarkedAsAnswer"
      @vote="clickUpvote"
    >
      <i class="fa-solid fa-arrow-up" aria-hidden="true" />
      <span class="text-xs">{{ upvoteActive ? 'Undo' : 'Upvote' }}</span>
      <span class="text-xs">{{ upvoteCount }}</span>
    </VoteButton>

    <!-- Super Upvote button - visible when user has upvoted and not own content -->
    <VoteButton
      v-if="showSuperUpvote && upvoteActive && !isOwnContent"
      :test-id="'super-upvote-comment-button'"
      :loading="superUpvoteLoading"
      :active="superUpvoteActive"
      :show-count="false"
      :tooltip-text="superUpvoteActive ? 'Undo super upvote' : 'Super upvote with a thank-you note'"
      :is-permalinked="isPermalinked"
      :class="superUpvoteActive ? '' : 'super-upvote-button'"
      @vote="superUpvoteActive ? emit('undoSuperUpvote') : emit('superUpvote')"
    >
      <span class="flex items-center gap-1 text-xs font-medium" :class="superUpvoteActive ? '' : 'rainbow-star'">
        <i :class="superUpvoteActive ? 'fa-solid fa-star' : 'fa-regular fa-star'" aria-hidden="true" />
        <span v-if="superUpvoteActive">Undo</span>
      </span>
    </VoteButton>

    <MenuButton
      v-if="showDownvote"
      data-testid="comment-thumbs-down-menu-button"
      :items="thumbsDownMenuItems"
      :aria-label="'Feedback actions'"
      @view-feedback="viewFeedback"
      @give-feedback="giveFeedback"
      @edit-feedback="editFeedback"
      @undo-feedback="undoFeedback"
    >
      <span :class="downvoteButtonClasses">
        <FlagIcon class="h-4 w-4" />
        <span
          v-if="showDownvoteCount"
          class="ml-1 text-xs"
          aria-hidden="true"
        >
          {{ downvoteCount }}
        </span>
      </span>
    </MenuButton>
  </div>
</template>

<style scoped>
/* Super upvote button - outlined with rainbow gradient border */
.super-upvote-button :deep(button) {
  position: relative;
  background: white;
  border: none;
  max-height: 1.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  box-sizing: border-box;
}

.super-upvote-button :deep(button)::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  padding: 1.5px;
  background: linear-gradient(to right, #ec4899, #8b5cf6, #6366f1);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.super-upvote-button :deep(button:hover)::before {
  background: linear-gradient(to right, #db2777, #7c3aed, #4f46e5);
}

/* Dark mode support for the button background */
:root.dark .super-upvote-button :deep(button) {
  background: #374151;
}

/* Rainbow gradient for outlined star */
.rainbow-star {
  background: linear-gradient(to right, #ec4899, #8b5cf6, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
