<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import ErrorBanner from '../ErrorBanner.vue';
import {
  UPVOTE_COMMENT,
  UNDO_UPVOTE_COMMENT,
} from '@/graphQLData/comment/mutations';
import type { PropType } from 'vue';
import type { Comment } from '@/__generated__/graphql';
import VotesComponent from './Votes.vue';
import SuperUpvoteModal from '@/components/superUpvote/SuperUpvoteModal.vue';
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
  showSuperUpvote: {
    type: Boolean,
    default: true,
  },
  isPermalinked: {
    type: Boolean,
    default: false,
  },
  isMarkedAsAnswer: {
    type: Boolean,
    default: false,
  },
  channelUniqueName: {
    type: String,
    default: '',
  },
  forumName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits([
  'clickUndoFeedback',
  'openModProfile',
  'clickEditFeedback',
  'clickUndoFeedback',
  'viewFeedback',
  'clickFeedback',
  'superUpvoteSuccess',
]);

const showSuperUpvoteModal = ref(false);

const loggedInUserUpvoted = computed(() => {
  if (!usernameVar) {
    return false;
  }
  if (!props.commentData.UpvotedByUsers) {
    return false;
  }
  return props.commentData.UpvotedByUsers.some(
    (user) => user.username === usernameVar.value
  );
});

const loggedInUserSuperUpvoted = computed(() => {
  if (!usernameVar) {
    return false;
  }
  if (!props.commentData.SuperUpvotedByUsers) {
    return false;
  }
  return props.commentData.SuperUpvotedByUsers.some(
    (user) => user.username === usernameVar.value
  );
});

const commentAuthorUsername = computed(() => {
  const author = props.commentData.CommentAuthor;
  if (author && 'username' in author) {
    return author.username || '';
  }
  return '';
});

const handleSuperUpvoteClick = () => {
  showSuperUpvoteModal.value = true;
};

const handleSuperUpvoteSuccess = () => {
  showSuperUpvoteModal.value = false;
  emit('superUpvoteSuccess');
};

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

const {
  mutate: upvoteComment,
  error: upvoteCommentError,
  loading: upvoteCommentLoading,
} = useMutation(UPVOTE_COMMENT, () => ({
  variables: {
    id: props.commentData.id,
    username: usernameVar.value,
  },
}));

const {
  mutate: undoUpvoteComment,
  error: undoUpvoteError,
  loading: undoUpvoteLoading,
} = useMutation(UNDO_UPVOTE_COMMENT, () => ({
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
      :super-upvote-active="loggedInUserSuperUpvoted"
      :downvote-active="loggedInUserDownvoted"
      :has-mod-profile="!!modProfileNameVar"
      :upvote-loading="upvoteCommentLoading || undoUpvoteLoading"
      :show-downvote="showDownvote"
      :show-upvote="showUpvote"
      :show-super-upvote="showSuperUpvote"
      :is-permalinked="isPermalinked"
      :is-marked-as-answer="isMarkedAsAnswer"
      @upvote="upvoteComment"
      @undo-upvote="undoUpvoteComment"
      @super-upvote="handleSuperUpvoteClick"
      @undo-downvote="emit('clickUndoFeedback')"
      @open-mod-profile="emit('openModProfile')"
      @edit-feedback="emit('clickEditFeedback')"
      @undo-feedback="emit('clickUndoFeedback')"
      @view-feedback="emit('viewFeedback')"
      @give-feedback="emit('clickFeedback')"
    />

    <SuperUpvoteModal
      :show="showSuperUpvoteModal"
      :recipient-username="commentAuthorUsername"
      source-type="comment"
      :source-id="commentData.id"
      :source-channel-unique-name="channelUniqueName"
      :forum-name="forumName"
      @close="showSuperUpvoteModal = false"
      @success="handleSuperUpvoteSuccess"
    />
  </div>
</template>
