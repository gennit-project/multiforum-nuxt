<script lang="ts">
import { defineComponent, PropType, computed, ref } from "vue";
import { Discussion } from "@/__generated__/graphql";
import { DiscussionChannel } from "@/__generated__/graphql";
import { useRoute, useRouter } from "vue-router";
import VoteButtons from "./VoteButtons.vue";
import {
  GET_LOCAL_MOD_PROFILE_NAME,
  GET_LOCAL_USERNAME,
} from "@/graphQLData/user/queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import {
  UPVOTE_DISCUSSION_CHANNEL,
  UNDO_UPVOTE_DISCUSSION_CHANNEL,
} from "@/graphQLData/discussion/mutations";
import { modProfileNameVar } from "@/cache";
import WarningModal from "@/components/WarningModal.vue";
import { CREATE_MOD_PROFILE } from "@/graphQLData/user/mutations";
import { generateSlug } from "random-word-slugs";
import ErrorBanner from "@/components/ErrorBanner.vue";
import GenericFeedbackFormModal from "@/components/forms/GenericFeedbackFormModal.vue";

export default defineComponent({
  components: {
    ErrorBanner,
    GenericFeedbackFormModal,
    VoteButtons,
    WarningModal,
  },
  inheritAttrs: false,
  props: {
    discussionChannel: {
      type: Object as PropType<DiscussionChannel>,
      required: true,
    },
    discussion: {
      type: Object as PropType<Discussion | null>,
      required: false,
      default: null,
    },
    showDownvote: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();

    const discussionIdInParams = computed(() => {
      if (typeof route.params.discussionId === "string") {
        return route.params.discussionId;
      }
      return "";
    });

    const { result: localUsernameResult, loading: localUsernameLoading } =
      useQuery(GET_LOCAL_USERNAME);

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const username = computed(() => {
      if (localUsernameLoading.value) {
        return "";
      }
      return localUsernameResult.value?.username || "";
    });

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value.modProfileName;
    });

    const discussionChannelId = computed(() => {
      return props.discussionChannel.id || "";
    });

    const {
      mutate: upvoteDiscussionChannel,
      error: upvoteDiscussionChannelError,
      loading: upvoteDiscussionChannelLoading,
    } = useMutation(UPVOTE_DISCUSSION_CHANNEL, () => {
      return {
        variables: {
          id: discussionChannelId.value || "",
          username: localUsernameResult.value?.username || "",
        },
      };
    });

    const {
      mutate: undoUpvoteDiscussionChannel,
      error: undoUpvoteDiscussionChannelError,
      loading: undoUpvoteDiscussionChannelLoading,
    } = useMutation(UNDO_UPVOTE_DISCUSSION_CHANNEL, () => ({
      variables: {
        id: discussionChannelId.value || "",
        username: localUsernameResult.value?.username || "",
      },
    }));

    const loggedInUserUpvoted = computed(() => {
      if (localUsernameLoading.value || !localUsernameResult.value) {
        return false;
      }
      const users = props.discussionChannel?.UpvotedByUsers || [];

      const loggedInUser = localUsernameResult.value.username;
      const match =
        users.filter((user: any) => {
          return user.username === loggedInUser;
        }).length === 1;
      return match;
    });

    const loggedInUserDownvoted = computed(() => {
      // The feedback comments on the discussion are already
      // filtered by the logged-in moderator's displayname if applicable,
      // so if there is at least one, the UI should show the downvote button
      // as active.
      if (!props.discussion?.FeedbackComments) {
        return false;
      }
      return props.discussion.FeedbackComments.length > 0;
    });

    const upvoteCount = computed(() => {
      if (props.discussionChannel) {
        return props.discussionChannel.UpvotedByUsersAggregate?.count || 0;
      }
      return 0;
    });

    const downvoteCount = computed(() => {
      if (!props.discussion?.FeedbackCommentsAggregate) {
        return 0;
      }
      return props.discussion.FeedbackCommentsAggregate.count;
    });

    const randomWords = generateSlug(4, { format: "camel" });

    const { mutate: createModProfile, onDone: onDoneCreateModProfile } =
      useMutation(CREATE_MOD_PROFILE, () => ({
        variables: {
          displayName: randomWords,
          username: username.value,
        },
      }));

    onDoneCreateModProfile((data: any) => {
      const updatedUser = data.data.updateUsers.users[0];

      const newModProfileName = updatedUser.ModerationProfile.displayName;
      modProfileNameVar(newModProfileName);
    });

    return {
      createModProfile,
      discussionChannelId,
      defaultUniqueName: props.discussionChannel.channelUniqueName,
      discussionIdInParams,
      downvoteCount,
      loggedInUserUpvoted,
      loggedInUserDownvoted,
      loggedInUserModName,
      discussionChannelMutations: {
        upvoteDiscussionChannel,
        undoUpvoteDiscussionChannel,
      },
      upvoteDiscussionChannelError,
      upvoteDiscussionChannelLoading,
      undoUpvoteDiscussionChannelError,
      undoUpvoteDiscussionChannelLoading,
      upvoteCount,
      username,
      route,
      router,
      showFeedbackFormModal: ref(false),
      showModProfileModal: ref(false),
    };
  },
  methods: {
    async handleCreateModProfileClick() {
      const result = await this.createModProfile();

      const modProfileName =
        result.data.updateUsers.users[0].ModerationProfile.displayName;

      modProfileNameVar(modProfileName);

      this.showModProfileModal = false;
    },
    async handleClickUp() {
      if (this.loggedInUserUpvoted) {
        await this.undoUpvote();
      } else {
        await this.upvote();
      }
    },
    handleClickGiveFeedback() {
      if (this.loggedInUserModName) {
        if (!this.loggedInUserDownvoted) {
          this.$emit("handleClickGiveFeedback");
        }
      } else {
        // Create mod profile, then downvote comment
        this.showModProfileModal = true;
      }
    },
    handleClickEditFeedback() {
      if (this.loggedInUserModName) {
        this.$emit("handleClickEditFeedback");
      } else {
        console.error("Mod profile name is required to edit feedback");
      }
    },
    handleClickUndoFeedback() {
      if (this.loggedInUserModName) {
        this.$emit("handleClickUndoFeedback");
      } else {
        console.error("Mod profile name is required to undo feedback");
      }
    },
    handleClickViewFeedback() {
      this.router.push({
        name: "DiscussionFeedback",
        params: {
          discussionId: this.discussionIdInParams,
        },
      });
    },
    async upvote() {
      if (!this.username) {
        throw new Error("Username is required to upvote");
      }

      if (this.discussionChannel && this.discussionChannel.id) {
        await this.discussionChannelMutations.upvoteDiscussionChannel({
          id: this.discussionChannelId,
          username: this.username || "",
        });
      } else {
        throw new Error("Discussion channel id is required to upvote");
      }
    },
    undoUpvote() {
      this.discussionChannelMutations.undoUpvoteDiscussionChannel();
    },
    handleSubmitFeedback() {
      this.showFeedbackFormModal = false;
    },
  },
});
</script>

<template>
  <ErrorBanner
    v-if="upvoteDiscussionChannelError || undoUpvoteDiscussionChannelError"
    :text="
      upvoteDiscussionChannelError?.message ||
      undoUpvoteDiscussionChannelError?.message ||
      ''
    "
  />
  <VoteButtons
    class="my-1"
    :downvote-count="downvoteCount"
    :upvote-count="upvoteCount"
    :upvote-active="loggedInUserUpvoted"
    :downvote-active="loggedInUserDownvoted"
    :has-mod-profile="!!loggedInUserModName"
    :show-downvote="showDownvote"
    :upvote-loading="
      upvoteDiscussionChannelLoading || undoUpvoteDiscussionChannelLoading
    "
    @viewFeedback="handleClickViewFeedback"
    @giveFeedback="handleClickGiveFeedback"
    @editFeedback="handleClickEditFeedback"
    @undoFeedback="handleClickUndoFeedback"
    @clickUp="handleClickUp"
    @openModProfile="showModProfileModal = true"
  />
  <WarningModal
    :title="'Create Mod Profile'"
    :body="`Moderation activity is tracked to prevent abuse, therefore you need to create a mod profile in order to downvote this comment. Continue?`"
    :open="showModProfileModal"
    :primary-button-text="'Yes, create a mod profile'"
    @close="showModProfileModal = false"
    @primaryButtonClick="handleCreateModProfileClick"
  />
  <GenericFeedbackFormModal
    :open="showFeedbackFormModal"
    @close="showFeedbackFormModal = false"
    @primaryButtonClick="handleSubmitFeedback"
  />
</template>
<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
