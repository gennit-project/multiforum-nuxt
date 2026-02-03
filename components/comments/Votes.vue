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
  upvoteLoading: {
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
  <div class="flex flex-row items-center">
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
      <i class="fa-solid fa-arrow-up mr-1 w-3" aria-hidden="true" />
      <span id="count" class="text-xs">{{ upvoteCount }}</span>
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
