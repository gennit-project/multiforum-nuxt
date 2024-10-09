<script setup lang="ts">
import { computed } from 'vue';
import VoteButton from '@/components/VoteButton.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import HandThumbDownIcon from '@/components/icons/HandThumbDownIcon.vue';
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
  upvoteLoading: {
    type: Boolean,
    default: false,
  },
  downvoteLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'editFeedback',
  'undoFeedback',
  'giveFeedback',
  'viewFeedback',
  'clickUp',
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

const editFeedback = () => {
  emit('editFeedback');
};

const undoFeedback = () => {
  emit('undoFeedback');
};

const giveFeedback = () => {
  emit('giveFeedback');
};

const viewFeedback = () => {
  emit('viewFeedback');
};

const clickUp = () => {
  emit('clickUp');
};
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <div class="flex items-center gap-1">
        <VoteButton
          :test-id="'upvote-discussion-button'"
          :count="upvoteCount"
          :active="upvoteActive"
          :loading="upvoteLoading"
          :tooltip-text="
            upvoteActive
              ? 'Undo upvote'
              : 'Upvote to make this discussion more visible'
          "
          @vote="clickUp"
        >
          <i class="fa-solid fa-arrow-up mr-1 w-3" />
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
            class="ml-2"
            :test-id="'downvote-discussion-button'"
            :show-count="false"
            :active="downvoteActive"
            :loading="downvoteLoading"
          >
            <div>
              <HandThumbDownIcon class="h-4 w-4" />
            </div>
          </VoteButton>
        </MenuButton>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex gap-1">
        <VoteButton
          :test-id="'upvote-discussion-button'"
          :count="upvoteCount"
          :active="upvoteActive"
          :tooltip-text="'Make this discussion more visible to others'"
        >
          <i class="fa-solid fa-arrow-up mr-1 w-3" />
        </VoteButton>
        <VoteButton
          v-if="showDownvote"
          :test-id="'downvote-discussion-button'"
          :show-count="false"
          :active="downvoteActive"
          :tooltip-text="'Give semi-anonymous feedback'"
        >
          <HandThumbDownIcon class="h-4 w-4" />
        </VoteButton>
      </div>
    </template>
  </RequireAuth>
</template>

<style scoped></style>
