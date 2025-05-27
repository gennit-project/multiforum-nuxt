<script setup lang="ts">
import { computed } from "vue";
import VoteButton from "@/components/VoteButton.vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import HandThumbDownIcon from "@/components/icons/HandThumbDownIcon.vue";
import type { SelectOptionData } from "@/types/GenericFormTypes";
import { ALLOWED_ICONS } from "@/utils";

<<<<<<< HEAD
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
    isPermalinked: {
      type: Boolean,
      default: false,
    },
    upvoteIcon: {
      type: String,
      default: "fa-solid fa-arrow-up",
    },
    upvoteTooltipActive: {
      type: String,
      default: "Undo upvote",
    },
    upvoteTooltipInactive: {
      type: String,
      default: "Upvote to make this discussion more visible",
    },
    upvoteTooltipUnauthenticated: {
      type: String,
      default: "Make this discussion more visible to others",
    },
  });
  const emit = defineEmits([
    "editFeedback",
    "undoFeedback",
    "giveFeedback",
    "viewFeedback",
    "clickUp",
  ]);
=======
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
  isPermalinked: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits([
  "editFeedback",
  "undoFeedback",
  "giveFeedback",
  "viewFeedback",
  "clickUp",
]);
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const thumbsDownMenuItems = computed(() => {
  let items: SelectOptionData[] = [
    {
      label: "View Feedback",
      icon: ALLOWED_ICONS.VIEW_FEEDBACK as string,
      value: "",
      event: "viewFeedback",
    },
  ];

  if (props.downvoteActive) {
    items = items.concat([
      {
        label: "Undo Feedback",
        icon: ALLOWED_ICONS.UNDO as string,
        value: "",
        event: "undoFeedback",
      },
      {
        label: "Edit Feedback",
        icon: ALLOWED_ICONS.EDIT as string,
        value: "",
        event: "editFeedback",
      },
    ]);
  } else {
    items = items.concat([
      {
        label: "Give Feedback",
        icon: ALLOWED_ICONS.GIVE_FEEDBACK as string,
        value: "",
        event: "giveFeedback",
      },
    ]);
  }
  return items;
});

const editFeedback = () => {
  emit("editFeedback");
};

const undoFeedback = () => {
  emit("undoFeedback");
};

const giveFeedback = () => {
  emit("giveFeedback");
};

const viewFeedback = () => {
  emit("viewFeedback");
};

const clickUp = () => {
  console.log("clickUp");
  emit("clickUp");
};
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <div class="flex items-center gap-2 text-sm">
        <VoteButton
          :test-id="'upvote-discussion-button'"
<<<<<<< HEAD
          :tooltip-text="upvoteActive ? upvoteTooltipActive : upvoteTooltipInactive"
=======
          :count="upvoteCount"
          :active="upvoteActive"
          :loading="upvoteLoading"
          :tooltip-text="
            upvoteActive
              ? 'Undo upvote'
              : 'Upvote to make this discussion more visible'
          "
          :is-permalinked="isPermalinked"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
          @view-feedback="viewFeedback"
          @give-feedback="giveFeedback"
          @edit-feedback="editFeedback"
          @undo-feedback="undoFeedback"
        >
          <VoteButton
            :test-id="'downvote-discussion-button'"
            :show-count="false"
            :active="downvoteActive"
            :loading="downvoteLoading"
            :is-permalinked="isPermalinked"
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
<<<<<<< HEAD
          :tooltip-text="upvoteTooltipUnauthenticated"
=======
          :count="upvoteCount"
          :active="upvoteActive"
          :tooltip-text="'Make this discussion more visible to others'"
          :is-permalinked="isPermalinked"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        >
          <span class="flex items-center gap-1">
            <i :class="upvoteIcon + ' mr-1'" />
            <span class="text-sm">{{ upvoteCount }}</span>
          </span>
        </VoteButton>
        <VoteButton
          v-if="showDownvote"
          :test-id="'downvote-discussion-button'"
          :show-count="false"
          :active="downvoteActive"
          :tooltip-text="'Give semi-anonymous feedback'"
          :is-permalinked="isPermalinked"
        >
          <HandThumbDownIcon class="h-4 w-4" />
        </VoteButton>
      </div>
    </template>
  </RequireAuth>
</template>

<style scoped></style>
