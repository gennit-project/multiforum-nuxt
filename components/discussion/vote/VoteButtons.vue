<script setup lang="ts">
import { computed } from 'vue';
import VoteButton from '@/components/VoteButton.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
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
  showUpvote: {
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
  isPermalinked: {
    type: Boolean,
    default: false,
  },
  upvoteIcon: {
    type: String,
    default: 'fa-solid fa-arrow-up',
  },
  upvoteTooltipActive: {
    type: String,
    default: 'Undo upvote',
  },
  upvoteTooltipInactive: {
    type: String,
    default: 'Upvote to make this discussion more visible',
  },
  upvoteTooltipUnauthenticated: {
    type: String,
    default: 'Make this discussion more visible to others',
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
      icon: ALLOWED_ICONS.VIEW_FEEDBACK as string,
      value: '',
      event: 'viewFeedback',
    },
  ];

  if (props.downvoteActive) {
    items = items.concat([
      {
        label: 'Undo Feedback',
        icon: ALLOWED_ICONS.UNDO as string,
        value: '',
        event: 'undoFeedback',
      },
      {
        label: 'Edit Feedback',
        icon: ALLOWED_ICONS.EDIT as string,
        value: '',
        event: 'editFeedback',
      },
    ]);
  } else {
    items = items.concat([
      {
        label: 'Give Feedback',
        icon: ALLOWED_ICONS.GIVE_FEEDBACK as string,
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
      <div class="flex items-center gap-2 text-sm">
        <VoteButton
          v-if="showUpvote"
          :active="upvoteActive"
          :count="upvoteCount"
          :is-permalinked="isPermalinked"
          :loading="upvoteLoading"
          :test-id="'upvote-discussion-button'"
          :tooltip-text="
            upvoteActive ? upvoteTooltipActive : upvoteTooltipInactive
          "
          @vote="clickUp"
        >
          <span class="flex items-center gap-1">
            <i :class="upvoteIcon + ' mr-1'" />
            <span class="text-sm">{{ upvoteCount }}</span>
          </span>
        </VoteButton>

        <MenuButton
          v-if="showDownvote"
          data-testid="discussion-thumbs-down-menu-button"
          :items="thumbsDownMenuItems"
          @edit-feedback="editFeedback"
          @give-feedback="giveFeedback"
          @undo-feedback="undoFeedback"
          @view-feedback="viewFeedback"
        >
          <template #activator="{ props: activatorProps }">
            <VoteButton
              :active="downvoteActive"
              :is-permalinked="isPermalinked"
              :loading="downvoteLoading"
              :show-count="false"
              :test-id="'downvote-discussion-button'"
              :button-props="activatorProps"
            >
              <span class="flex items-center gap-1 text-xs font-medium">
                <FlagIcon class="h-4 w-4" />
                <span>Feedback</span>
              </span>
            </VoteButton>
          </template>
        </MenuButton>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex items-center gap-2 text-sm">
        <VoteButton
          v-if="showUpvote"
          :active="upvoteActive"
          :count="upvoteCount"
          :is-permalinked="isPermalinked"
          :loading="upvoteLoading"
          :test-id="'upvote-discussion-button'"
          :tooltip-text="upvoteTooltipUnauthenticated"
        >
          <span class="flex items-center gap-1">
            <i :class="upvoteIcon + ' mr-1'" />
            <span class="text-sm">{{ upvoteCount }}</span>
          </span>
        </VoteButton>

        <MenuButton
          v-if="showDownvote"
          data-testid="discussion-thumbs-down-menu-button"
          :items="thumbsDownMenuItems"
          :disabled="true"
        >
          <template #activator="{ props: activatorProps }">
            <VoteButton
              :active="downvoteActive"
              :is-permalinked="isPermalinked"
              :loading="downvoteLoading"
              :show-count="false"
              :test-id="'downvote-discussion-button'"
              :tooltip-text="'Give semi-anonymous feedback'"
              :button-props="activatorProps"
            >
              <span class="flex items-center gap-1 text-xs font-medium">
                <FlagIcon class="h-4 w-4" />
                <span>Feedback</span>
              </span>
            </VoteButton>
          </template>
        </MenuButton>
      </div>
    </template>
  </RequireAuth>
</template>

<style scoped></style>
