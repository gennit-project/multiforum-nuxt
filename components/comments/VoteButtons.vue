<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import ErrorBanner from '../ErrorBanner.vue';
import { GET_LOCAL_MOD_PROFILE_NAME, GET_LOCAL_USERNAME } from '@/graphQLData/user/queries';
import { UPVOTE_COMMENT, UNDO_UPVOTE_COMMENT } from '@/graphQLData/comment/mutations';
import type { PropType } from 'vue';
import type { Comment } from '@/src/__generated__/graphql';

const props = defineProps({
  commentData: {
    type: Object as PropType<Comment>,
    required: true,
  },
  showDownvote: {
    type: Boolean,
    default: true,
  },
  showUpvote: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'clickUndoFeedback',
  'openModProfile',
  'clickEditFeedback',
  'clickUndoFeedback',
  'viewFeedback',
  'clickFeedback',
]);

const { result: localUsernameResult, loading: localUsernameLoading } = useQuery(GET_LOCAL_USERNAME);

const { result: localModProfileNameResult, loading: localModProfileNameLoading, error: localModProfileNameError } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

const username = computed(() => {
  if (localUsernameLoading.value) {
    return '';
  }
  return localUsernameResult.value?.username || '';
});

const loggedInUserModName = computed(() => {
  if (localModProfileNameLoading.value || localModProfileNameError.value) {
    return '';
  }
  return localModProfileNameResult.value.modProfileName;
});

const loggedInUserUpvoted = computed(() => {
  if (localUsernameLoading.value || !localUsernameResult.value || !props.commentData.UpvotedByUsers) {
    return false;
  }
  return props.commentData.UpvotedByUsers.some(user => user.username === localUsernameResult.value.username);
});

const upvoteCount = computed(() => {
  return props.commentData.UpvotedByUsersAggregate?.count || 0;
});

const loggedInUserDownvoted = computed(() => {
  const feedbackCommentsByLoggedInUser = props.commentData.FeedbackComments;
  if (!feedbackCommentsByLoggedInUser) {
    return props.commentData.FeedbackCommentsAggregate?.count > 0;
  }
  return feedbackCommentsByLoggedInUser.length > 0;
});

const { mutate: upvoteComment, error: upvoteCommentError, loading: upvoteCommentLoading } = useMutation(UPVOTE_COMMENT, () => ({
  variables: {
    id: props.commentData.id,
    username: username.value,
  },
}));

const { mutate: undoUpvoteComment, error: undoUpvoteError, loading: undoUpvoteLoading } = useMutation(UNDO_UPVOTE_COMMENT, () => ({
  variables: {
    id: props.commentData.id,
    username: username.value,
  },
}));
</script>

<template>
  <div class="flex items-center">
    <ErrorBanner
      v-if="upvoteCommentError || undoUpvoteError"
      :text="upvoteCommentError?.message || undoUpvoteError?.message || ''"
    />
    <VotesComponent
      :show-downvote-count="false"
      :upvote-count="upvoteCount"
      :upvote-active="loggedInUserUpvoted"
      :downvote-active="loggedInUserDownvoted"
      :has-mod-profile="!!loggedInUserModName"
      :upvote-loading="upvoteCommentLoading || undoUpvoteLoading"
      :show-downvote="showDownvote"
      :show-upvote="showUpvote"
      @upvote="upvoteComment"
      @undo-upvote="undoUpvoteComment"
      @undo-downvote="emit('clickUndoFeedback')"
      @open-mod-profile="emit('openModProfile')"
      @edit-feedback="emit('clickEditFeedback')"
      @undo-feedback="emit('clickUndoFeedback')"
      @view-feedback="emit('viewFeedback')"
      @give-feedback="emit('clickFeedback')"
    />
  </div>
</template>
