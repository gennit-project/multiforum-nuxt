<script setup lang="ts">
  import { computed } from "vue";
  import VoteButton from "@/components/VoteButton.vue";
  import HandThumbDownIcon from "../icons/HandThumbDownIcon.vue";
  import type { SelectOptionData } from "@/types/GenericFormTypes";
  import { ALLOWED_ICONS } from "@/utils";

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
  });

  const emit = defineEmits([
    "editFeedback",
    "undoFeedback",
    "giveFeedback",
    "viewFeedback",
    "upvote",
    "undoUpvote",
  ]);

  const thumbsDownMenuItems = computed(() => {
    let items: SelectOptionData[] = [
      {
        label: "View Feedback",
        icon: ALLOWED_ICONS.VIEW_FEEDBACK,
        value: "",
        event: "viewFeedback",
      },
    ];

    if (props.downvoteActive) {
      items = items.concat([
        {
          label: "Undo Feedback",
          icon: ALLOWED_ICONS.UNDO,
          value: "",
          event: "undoFeedback",
        },
        {
          label: "Edit Feedback",
          icon: ALLOWED_ICONS.EDIT,
          value: "",
          event: "editFeedback",
        },
      ]);
    } else {
      items = items.concat([
        {
          label: "Give Feedback",
          icon: ALLOWED_ICONS.GIVE_FEEDBACK,
          value: "",
          event: "giveFeedback",
        },
      ]);
    }
    return items;
  });

  function clickUpvote() {
    if (!props.upvoteActive) {
      emit("upvote");
    } else {
      console.log("Undo upvote");
      emit("undoUpvote");
    }
  }

  function editFeedback() {
    emit("editFeedback");
  }

  function undoFeedback() {
    emit("undoFeedback");
  }

  function giveFeedback() {
    emit("giveFeedback");
  }

  function viewFeedback() {
    emit("viewFeedback");
  }
</script>

<template>
  <div class="flex flex-row items-center">
    <VoteButton
      v-if="showUpvote"
      :active="upvoteActive"
      :count="upvoteCount"
      :is-permalinked="isPermalinked"
      :loading="upvoteLoading"
      :test-id="'upvote-comment-button'"
      :tooltip-text="upvoteActive ? 'Undo upvote' : 'Upvote to make this comment more visible'"
      @vote="clickUpvote"
    >
      <i class="fa-solid fa-arrow-up mr-1 w-3" />
      <span
        id="count"
        class="text-xs"
        >{{ upvoteCount }}</span
      >
    </VoteButton>

    <MenuButton
      v-if="showDownvote"
      data-testid="comment-thumbs-down-menu-button"
      :items="thumbsDownMenuItems"
      @edit-feedback="editFeedback"
      @give-feedback="giveFeedback"
      @undo-feedback="undoFeedback"
      @view-feedback="viewFeedback"
    >
      <VoteButton
        :active="downvoteActive"
        :count="downvoteCount"
        :is-permalinked="isPermalinked"
        :loading="false"
        :show-count="showDownvoteCount"
        :test-id="'downvote-comment-button'"
      >
        <HandThumbDownIcon class="h-4 w-4" />
      </VoteButton>
    </MenuButton>
  </div>
</template>
