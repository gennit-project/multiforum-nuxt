<script setup lang="ts">
import { computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import ErrorBanner from '../ErrorBanner.vue';
import { UPVOTE_COMMENT, UNDO_UPVOTE_COMMENT } from '@/graphQLData/comment/mutations';
import type { PropType } from 'vue';
import type { Comment } from '@/__generated__/graphql';
import VotesComponent from './Votes.vue';
import { modProfileNameVar, usernameVar } from '@/cache';

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
  isPermalinked: {
    type: Boolean,
    default: false,
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


const loggedInUserUpvoted = computed(() => {
  if (!usernameVar) {
    return false;
  }
  if (!props.commentData.UpvotedByUsers) {
    return false;
  }
  return props.commentData.UpvotedByUsers.some(user => user.username === usernameVar.value);
});

const upvoteCount = computed(() => {
  if (!props.commentData.UpvotedByUsersAggregate) {
    return 0;
  }
  return props.commentData.UpvotedByUsersAggregate?.count || 0;
});

const loggedInUserDownvoted = computed(() => {
  const feedbackCommentsByLoggedInUser = props.commentData.FeedbackComments;
  if (!feedbackCommentsByLoggedInUser) {
    return (props.commentData.FeedbackCommentsAggregate?.count || 0) > 0;
  }
  return feedbackCommentsByLoggedInUser.length > 0;
});

const { mutate: upvoteComment, error: upvoteCommentError, loading: upvoteCommentLoading } = useMutation(UPVOTE_COMMENT, () => ({
  variables: {
    id: props.commentData.id,
    username: usernameVar.value,
  },
}));

const { mutate: undoUpvoteComment, error: undoUpvoteError, loading: undoUpvoteLoading } = useMutation(UNDO_UPVOTE_COMMENT, () => ({
  variables: {
    id: props.commentData.id,
    username: usernameVar.value,
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
      :has-mod-profile="!!modProfileNameVar"
      :upvote-loading="upvoteCommentLoading || undoUpvoteLoading"
      :show-downvote="showDownvote"
      :show-upvote="showUpvote"
      :is-permalinked="isPermalinked"
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
