<script lang="ts" setup>
  import { computed } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { useMutation } from "@vue/apollo-composable";
  import {
    UPVOTE_DISCUSSION_CHANNEL,
    UNDO_UPVOTE_DISCUSSION_CHANNEL,
  } from "@/graphQLData/discussion/mutations";
  import VoteButtons from "@/components/discussion/vote/VoteButtons.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import { usernameVar, modProfileNameVar } from "@/cache";

  const props = defineProps({
    discussionChannel: {
      type: Object,
      required: true,
    },
    discussion: {
      type: Object,
      default: null,
    },
    showDownvote: {
      type: Boolean,
      default: true,
    },
  });

  const emit = defineEmits([
    "handleClickGiveFeedback",
    "handleClickEditFeedback",
    "handleClickUndoFeedback",
  ]);

  const route = useRoute();
  const router = useRouter();
  const discussionIdInParams = computed(() => {
    return typeof route.params.discussionId === "string" ? route.params.discussionId : "";
  });

  const discussionChannelId = computed(() => props.discussionChannel.id || "");

  const {
    mutate: upvoteDiscussionChannel,
    error: upvoteDiscussionChannelError,
    loading: upvoteDiscussionChannelLoading,
  } = useMutation(UPVOTE_DISCUSSION_CHANNEL);
  const {
    mutate: undoUpvoteDiscussionChannel,
    error: undoUpvoteDiscussionChannelError,
    loading: undoUpvoteDiscussionChannelLoading,
  } = useMutation(UNDO_UPVOTE_DISCUSSION_CHANNEL);

  const loggedInUserUpvoted = computed(() => {
    if (!usernameVar.value) return false;
    const users = props.discussionChannel?.UpvotedByUsers || [];
    return users.some((user: any) => user.username === usernameVar.value);
  });

  const loggedInUserDownvoted = computed(
    () => props.discussion?.FeedbackComments?.length > 0 || false
  );
  const upvoteCount = computed(() => props.discussionChannel?.UpvotedByUsersAggregate?.count || 0);
  const downvoteCount = computed(() => props.discussion?.FeedbackCommentsAggregate?.count || 0);

  async function handleClickUp() {
    if (loggedInUserUpvoted.value) {
      await undoUpvote();
    } else {
      await upvote();
    }
  }

  async function upvote() {
    if (!usernameVar.value) throw new Error("Username is required to upvote");
    await upvoteDiscussionChannel({
      id: discussionChannelId.value,
      username: usernameVar.value,
    });
  }

  async function undoUpvote() {
    await undoUpvoteDiscussionChannel({
      id: discussionChannelId.value,
      username: usernameVar.value,
    });
  }

  function handleClickGiveFeedback() {
    if (modProfileNameVar.value) {
      if (!loggedInUserDownvoted.value) emit("handleClickGiveFeedback");
    } else {
      console.error("User is not a mod");
    }
  }

  function handleClickEditFeedback() {
    if (modProfileNameVar.value) emit("handleClickEditFeedback");
  }

  function handleClickUndoFeedback() {
    if (modProfileNameVar.value) emit("handleClickUndoFeedback");
  }

  function handleClickViewFeedback() {
    router.push({
      name: "forums-forumId-discussions-feedback-discussionId",
      params: { discussionId: discussionIdInParams.value },
    });
  }
</script>

<template>
  <ErrorBanner
    v-if="upvoteDiscussionChannelError || undoUpvoteDiscussionChannelError"
    :text="upvoteDiscussionChannelError?.message || undoUpvoteDiscussionChannelError?.message || ''"
  />
  <VoteButtons
    :downvote-active="loggedInUserDownvoted"
    :downvote-count="downvoteCount"
    :has-mod-profile="!!modProfileNameVar"
    :show-downvote="showDownvote"
    :upvote-active="loggedInUserUpvoted"
    :upvote-count="upvoteCount"
    :upvote-loading="upvoteDiscussionChannelLoading || undoUpvoteDiscussionChannelLoading"
    @click-up="handleClickUp"
    @edit-feedback="handleClickEditFeedback"
    @give-feedback="handleClickGiveFeedback"
    @undo-feedback="handleClickUndoFeedback"
    @view-feedback="handleClickViewFeedback"
  />
</template>

<style>
  .highlighted {
    background-color: #f9f95d;
  }
</style>
