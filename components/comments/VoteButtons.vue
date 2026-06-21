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
import { UNDO_SUPER_UPVOTE } from '@/graphQLData/scratchpad/mutations';
import { useModProfileName, useUsername } from '@/composables/useAuthState';

const modProfileNameVar = useModProfileName();
const usernameVar = useUsername();

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

const isOwnContent = computed(() => {
  if (!usernameVar.value) return false;
  return commentAuthorUsername.value === usernameVar.value;
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

const {
  mutate: undoSuperUpvote,
  error: undoSuperUpvoteError,
  loading: undoSuperUpvoteLoading,
} = useMutation(UNDO_SUPER_UPVOTE, {
  update: (cache, { data }) => {
    if (data?.undoSuperUpvote?.success) {
      cache.modify({
        id: cache.identify({ __typename: 'Comment', id: props.commentData.id }),
        fields: {
          SuperUpvotedByUsers: () => data.undoSuperUpvote.superUpvotedByUsers || [],
        },
      });
    }
  },
});

// Wrap the vote mutations so a failure (e.g. an auth error from the backend) is
// surfaced via the useMutation error refs in the ErrorBanner rather than
// escaping the event handler as an unhandled console rejection.
const handleUpvote = async () => {
  try {
    await upvoteComment();
  } catch {
    // Surfaced via upvoteCommentError in the ErrorBanner.
  }
};

const handleUndoUpvote = async () => {
  try {
    await undoUpvoteComment();
  } catch {
    // Surfaced via undoUpvoteError in the ErrorBanner.
  }
};

const handleUndoSuperUpvote = async () => {
  try {
    await undoSuperUpvote({
      sourceType: 'comment',
      sourceId: props.commentData.id,
    });
  } catch {
    // Surfaced via undoSuperUpvoteError in the ErrorBanner.
  }
};
</script>

<template>
  <div class="flex items-center">
    <ErrorBanner
      v-if="upvoteCommentError || undoUpvoteError || undoSuperUpvoteError"
      :text="upvoteCommentError?.message || undoUpvoteError?.message || undoSuperUpvoteError?.message || ''"
    />
    <VotesComponent
      :show-downvote-count="false"
      :upvote-count="upvoteCount"
      :upvote-active="loggedInUserUpvoted"
      :super-upvote-active="loggedInUserSuperUpvoted"
      :downvote-active="loggedInUserDownvoted"
      :has-mod-profile="!!modProfileNameVar"
      :upvote-loading="upvoteCommentLoading || undoUpvoteLoading"
      :super-upvote-loading="undoSuperUpvoteLoading"
      :show-downvote="showDownvote"
      :show-upvote="showUpvote"
      :show-super-upvote="showSuperUpvote"
      :is-permalinked="isPermalinked"
      :is-marked-as-answer="isMarkedAsAnswer"
      :is-own-content="isOwnContent"
      @upvote="handleUpvote"
      @undo-upvote="handleUndoUpvote"
      @super-upvote="handleSuperUpvoteClick"
      @undo-super-upvote="handleUndoSuperUpvote"
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
