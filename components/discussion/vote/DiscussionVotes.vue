<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuery, useMutation } from "@vue/apollo-composable";
import {
  GET_LOCAL_MOD_PROFILE_NAME,
} from "@/graphQLData/user/queries";
import {
  UPVOTE_DISCUSSION_CHANNEL,
  UNDO_UPVOTE_DISCUSSION_CHANNEL,
} from "@/graphQLData/discussion/mutations";
import VoteButtons from "@/components/discussion/vote/VoteButtons.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import GenericFeedbackFormModal from "@/components/GenericFeedbackFormModal.vue";
import { usernameVar } from "@/cache";

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

const emit = defineEmits(["handleClickGiveFeedback", "handleClickEditFeedback", "handleClickUndoFeedback"]);

const route = useRoute();
const router = useRouter();
const showFeedbackFormModal = ref(false);
const discussionIdInParams = computed(() => {
  return typeof route.params.discussionId === "string" ? route.params.discussionId : "";
});

const discussionChannelId = computed(() => props.discussionChannel.id || "");

const { result: localModProfileNameResult, loading: localModProfileNameLoading, error: localModProfileNameError } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

const username = computed(() => {
  return usernameVar() || "";
});
const loggedInUserModName = computed(() => (localModProfileNameLoading.value || localModProfileNameError.value ? "" : localModProfileNameResult.value?.modProfileName));

const { mutate: upvoteDiscussionChannel, error: upvoteDiscussionChannelError, loading: upvoteDiscussionChannelLoading } = useMutation(UPVOTE_DISCUSSION_CHANNEL);
const { mutate: undoUpvoteDiscussionChannel, error: undoUpvoteDiscussionChannelError, loading: undoUpvoteDiscussionChannelLoading } = useMutation(UNDO_UPVOTE_DISCUSSION_CHANNEL);

const loggedInUserUpvoted = computed(() => {
  if (!username.value) return false;
  const users = props.discussionChannel?.UpvotedByUsers || [];
  return users.some((user: any) => user.username === username.value);
});

const loggedInUserDownvoted = computed(() => props.discussion?.FeedbackComments?.length > 0 || false);
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
  if (!username.value) throw new Error("Username is required to upvote");
  await upvoteDiscussionChannel({ id: discussionChannelId.value, username: username.value });
}

async function undoUpvote() {
  await undoUpvoteDiscussionChannel({ id: discussionChannelId.value, username: username.value });
}

function handleClickGiveFeedback() {
  if (loggedInUserModName.value) {
    if (!loggedInUserDownvoted.value) emit("handleClickGiveFeedback");
  } else {
    console.error("User is not a mod");
  }
}

function handleClickEditFeedback() {
  if (loggedInUserModName.value) emit("handleClickEditFeedback");
}

function handleClickUndoFeedback() {
  if (loggedInUserModName.value) emit("handleClickUndoFeedback");
}

function handleClickViewFeedback() {
  router.push({ name: "forums-forumId-discussions-discussionId-feedback", params: { discussionId: discussionIdInParams.value } });
}

function handleSubmitFeedback() {
  showFeedbackFormModal.value = false;
}

</script>

<template>
  <ErrorBanner
    v-if="upvoteDiscussionChannelError || undoUpvoteDiscussionChannelError"
    :text="upvoteDiscussionChannelError?.message || undoUpvoteDiscussionChannelError?.message || ''"
  />
  <VoteButtons
    class="my-1"
    :downvote-count="downvoteCount"
    :upvote-count="upvoteCount"
    :upvote-active="loggedInUserUpvoted"
    :downvote-active="loggedInUserDownvoted"
    :has-mod-profile="!!loggedInUserModName"
    :show-downvote="showDownvote"
    :upvote-loading="upvoteDiscussionChannelLoading || undoUpvoteDiscussionChannelLoading"
    @view-feedback="handleClickViewFeedback"
    @give-feedback="handleClickGiveFeedback"
    @edit-feedback="handleClickEditFeedback"
    @undo-feedback="handleClickUndoFeedback"
    @click-up="handleClickUp"
  />
  <GenericFeedbackFormModal
    :open="showFeedbackFormModal"
    @close="showFeedbackFormModal = false"
    @primary-button-click="handleSubmitFeedback"
  />
</template>

<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
