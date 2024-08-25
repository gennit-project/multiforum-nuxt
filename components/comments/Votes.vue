<script lang="ts">
import { computed, defineComponent } from "vue";
import VoteButton from "@/components/buttons/VoteButton.vue";
import HandThumbDownIcon from "../icons/HandThumbDownIcon.vue";
import { SelectOptionData } from "@/types/GenericFormTypes";
import { ALLOWED_ICONS } from "../buttons/MenuButton.vue";
import MenuButton from "@/components/buttons/MenuButton.vue";

export default defineComponent({
  name: "VoteComponent",
  components: {
    HandThumbDownIcon,
    MenuButton,
    VoteButton,
  },
  props: {
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
  },
  setup(props) {
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
            label: "Undo feedback",
            icon: ALLOWED_ICONS.UNDO,
            value: "",
            event: "undoFeedback",
          },
          {
            label: "Edit feedback",
            icon: ALLOWED_ICONS.EDIT,
            value: "",
            event: "editFeedback",
          },
        ]);
      } else {
        items = items.concat([
          {
            label: "Give feedback",
            icon: ALLOWED_ICONS.GIVE_FEEDBACK,
            value: "",
            event: "giveFeedback",
          },
        ]);
      }
      return items;
    });
    return {
      thumbsDownMenuItems,
    };
  },
  methods: {
    editFeedback() {
      this.$emit("editFeedback");
    },
    undoFeedback() {
      this.$emit("undoFeedback");
    },
    giveFeedback() {
      this.$emit("giveFeedback");
    },
    viewFeedback() {
      this.$emit("viewFeedback");
    },
    clickUpvote() {
      if (!this.upvoteActive) {
        this.$emit("upvote");
      } else {
        this.$emit("undoUpvote");
      }
    },
  },
});
</script>

<template>
  <div class="flex flex-row space-x-1">
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
    </VoteButton>

    <MenuButton
      v-if="showDownvote"
      data-testid="thumbs-down-menu-button"
      :items="thumbsDownMenuItems"
      @viewFeedback="viewFeedback"
      @giveFeedback="giveFeedback"
      @editFeedback="editFeedback"
      @undoFeedback="undoFeedback"
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
