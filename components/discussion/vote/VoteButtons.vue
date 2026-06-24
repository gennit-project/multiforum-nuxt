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
  superUpvoteActive: {
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
  showSuperUpvote: {
    type: Boolean,
    default: true,
  },
  isOwnContent: {
    type: Boolean,
    default: false,
  },
  upvoteLoading: {
    type: Boolean,
    default: false,
  },
  downvoteLoading: {
    type: Boolean,
    default: false,
  },
  superUpvoteLoading: {
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
  'superUpvote',
  'undoSuperUpvote',
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

const clickSuperUpvote = () => {
  emit('superUpvote');
};

const clickUndoSuperUpvote = () => {
  emit('undoSuperUpvote');
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
            <i :class="upvoteIcon" aria-hidden="true" />
            <span class="text-sm">{{ upvoteCount }}</span>
            <span class="text-xs">{{ upvoteActive ? 'Undo' : 'Upvote' }}</span>
          </span>
        </VoteButton>

        <!-- Super Upvote button - visible when user has upvoted and not own content -->
        <VoteButton
          v-if="showSuperUpvote && upvoteActive && !isOwnContent"
          :active="superUpvoteActive"
          :is-permalinked="isPermalinked"
          :loading="superUpvoteLoading"
          :show-count="false"
          :test-id="'super-upvote-discussion-button'"
          :tooltip-text="superUpvoteActive ? 'Undo super upvote' : 'Super upvote with a thank-you note'"
          :class="superUpvoteActive ? '' : 'super-upvote-button'"
          @vote="superUpvoteActive ? clickUndoSuperUpvote() : clickSuperUpvote()"
        >
          <span class="flex items-center gap-1 text-xs font-medium" :class="superUpvoteActive ? '' : 'rainbow-star'">
            <i :class="superUpvoteActive ? 'fa-solid fa-star' : 'fa-regular fa-star'" />
            <span v-if="superUpvoteActive">Undo</span>
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
            <i :class="upvoteIcon" aria-hidden="true" />
            <span class="text-sm">{{ upvoteCount }}</span>
            <span class="text-sm">Upvote</span>
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
