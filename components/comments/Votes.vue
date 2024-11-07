<script setup lang="ts">
import { computed } from 'vue';
import VoteButton from '@/components/VoteButton.vue';
import HandThumbDownIcon from '../icons/HandThumbDownIcon.vue';
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
});

const emit = defineEmits([
  'editFeedback',
  'undoFeedback',
  'giveFeedback',
  'viewFeedback',
  'upvote',
  'undoUpvote',
]);

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
        label: 'Undo feedback',
        icon: ALLOWED_ICONS.UNDO,
        value: '',
        event: 'undoFeedback',
      },
      {
        label: 'Edit feedback',
        icon: ALLOWED_ICONS.EDIT,
        value: '',
        event: 'editFeedback',
      },
    ]);
  } else {
    items = items.concat([
      {
        label: 'Give feedback',
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
      @vote="clickUpvote"
    >
      <i class="fa-solid fa-arrow-up mr-1 w-3" />
      <span class="text-xs">{{upvoteCount}}</span>
    </VoteButton>

    <MenuButton
      v-if="showDownvote"
      data-testid="thumbs-down-menu-button"
      :items="thumbsDownMenuItems"
      @view-feedback="viewFeedback"
      @give-feedback="giveFeedback"
      @edit-feedback="editFeedback"
      @undo-feedback="undoFeedback"
    >
      <VoteButton
        :test-id="'downvote-comment-button'"
        :count="downvoteCount"
        :show-count="showDownvoteCount"
        :loading="false"
        :active="downvoteActive"
      >
        <HandThumbDownIcon class="h-4 w-4" />
      </VoteButton>
    </MenuButton>
  </div>
</template>
