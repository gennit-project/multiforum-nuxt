<script lang="ts" setup>
import { ref, computed, watch, watchEffect } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import Comment from './Comment.vue';
import LoadMore from '../LoadMore.vue';
import WarningModal from '../WarningModal.vue';
import BrokenRulesModal from '@/components/mod/BrokenRulesModal.vue';
import GenericFeedbackFormModal from '@/components/GenericFeedbackFormModal.vue';
import SortButtons from '@/components/SortButtons.vue';
import Notification from '@/components/NotificationComponent.vue';
import ConfirmUndoCommentFeedbackModal from '@/components/discussion/detail/ConfirmUndoCommentFeedbackModal.vue';
import EditCommentFeedbackModal from '@/components/comments/EditCommentFeedbackModal.vue';
import { GET_COMMENT_REPLIES } from '@/graphQLData/comment/queries';
import {
  DELETE_COMMENT,
  UPDATE_COMMENT,
  SOFT_DELETE_COMMENT,
  CREATE_COMMENT,
  ADD_FEEDBACK_COMMENT_TO_COMMENT,
} from '@/graphQLData/comment/mutations';
import { getSortFromQuery } from '@/components/comments/getSortFromQuery';
import type {
  CommentCreateInput,
  Comment as CommentType,
} from '@/__generated__/graphql';
import type {
  CreateEditCommentFormValues,
  CreateReplyInputData,
  DeleteCommentInputData,
} from '@/types/Comment';
import type { Ref, PropType } from 'vue';
import { modProfileNameVar } from '@/cache';
import { useRouter, useRoute } from 'nuxt/app';
import UnarchiveModal from '@/components/mod/UnarchiveModal.vue';
import LockIcon from '@/components/icons/LockIcon.vue';
import PinnedAnswers from '@/components/comments/PinnedAnswers.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { hasBotMention } from '@/utils/botMentions';

type CommentSectionQueryVariablesType = {
  discussionId?: string;
  eventId?: string;
  channelUniqueName?: string;
  limit: number;
  offset: number;
  sort: string;
};

type GiveFeedbackInput = {
  commentData: CommentType;
  parentCommentId: string;
};

type EditFeedbackInput = {
  commentData: CommentType;
};

// Props
const props = defineProps({
  aggregateCommentCount: {
    type: Number,
    default: 0,
  },
  commentSectionQueryVariables: {
    type: Object as PropType<CommentSectionQueryVariablesType>,
    required: true,
  },
  comments: {
    type: Array as PropType<CommentType[]>,
    default: () => [],
  },
  createCommentInput: {
    type: Object as PropType<CommentCreateInput>,
    required: true,
  },
  createFormValues: {
    type: Object as PropType<CreateEditCommentFormValues>,
    required: true,
  },
  enableFeedback: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  reachedEndOfResults: {
    type: Boolean,
    required: true,
  },
  previousOffset: {
    type: Number,
    required: true,
  },
  originalPoster: {
    type: String,
    required: true,
  },
  showCommentSortButtons: {
    type: Boolean,
    default: true,
  },
  showNuxtPage: {
    type: Boolean,
    default: false,
  },
  answers: {
    type: Array as PropType<CommentType[]>,
    default: () => [],
  },
  allowBotMentions: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits([
  'updateCommentSectionQueryResult',
  'decrementCommentCount',
  'incrementCommentCount',
  'updateCreateReplyCommentInput',
  'updateCreateFormValues',
  'loadMore',
]);

// Route and router
const route = useRoute();
const router = useRouter();

// Computed properties
const channelId = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
const activeSort = computed(() => getSortFromQuery(route.query));
const permalinkedCommentId = ref(`${route.params.commentId}`);

// Comment form state
const commentToDeleteId = ref('');

const commentToDeleteReplyCount = ref(0);
const commentToEdit: Ref<CommentType | null> = ref(null);
const showFeedbackSubmittedSuccessfully = ref(false);
const showFeedbackFormModal = ref(false);
const commentToGiveFeedbackOn: Ref<CommentType | null> = ref(null);
const commentToRemoveFeedbackFrom: Ref<CommentType | null> = ref(null);
const commentToReport: Ref<CommentType | null> = ref(null);
const showDeleteCommentModal = ref(false);
const showConfirmUndoFeedbackModal = ref(false);
const showEditCommentFeedbackModal = ref(false);
const parentOfCommentToDelete = ref('');
const parentIdOfCommentToGiveFeedbackOn = ref('');
const commentInProcess = ref(false);
const submitAttempted = ref(false);
const replyFormOpenAtCommentID = ref('');
const editFormOpenAtCommentID = ref('');
const showCopiedLinkNotification = ref(false);
const showMarkedAsBestAnswerNotification = ref(false);
const showUnmarkedAsBestAnswerNotification = ref(false);


// Moderation related state
const commentToArchiveId = ref('');
const commentToArchiveAndSuspendId = ref('');
const commentToUnarchiveId = ref('');
const showArchiveModal = ref(false);
const showArchiveAndSuspendModal = ref(false);
const showUnarchiveModal = ref(false);
const showModProfileModal = ref(false);
const showBrokenRulesModal = ref(false);
const showSuccessfullyReported = ref(false);
const showSuccessfullyArchived = ref(false);
const showSuccessfullyArchivedAndSuspended = ref(false);
const showSuccessfullyUnarchived = ref(false);
const locked = ref(props.locked);

const hasLoadedComments = ref(
  (props.comments?.length || 0) > 0 || !props.loading
);

watch(
  () => props.comments?.length || 0,
  (length) => {
    if (length > 0) {
      hasLoadedComments.value = true;
    }
  }
);

watch(
  () => props.loading,
  (isLoading) => {
    if (!isLoading) {
      hasLoadedComments.value = true;
    }
  }
);

const shouldShowLoadingSpinner = computed(
  () => props.loading && !hasLoadedComments.value
);

const editFormValues = ref<CreateEditCommentFormValues>({
  text: commentToEdit.value?.text || '',
  isRootComment: true,
  depth: 1,
});

const {
  mutate: addFeedbackCommentToComment,
  loading: addFeedbackCommentToCommentLoading,
  error: addFeedbackCommentToCommentError,
  onDone: onAddFeedbackCommentToCommentDone,
} = useMutation(ADD_FEEDBACK_COMMENT_TO_COMMENT, {
  update: (cache, result) => {
    const parentId = JSON.parse(
      JSON.stringify(parentIdOfCommentToGiveFeedbackOn.value)
    );
    const newFeedbackComment = result.data.createComments.comments[0];
    const commentWeGaveFeedbackOn = commentToGiveFeedbackOn.value;

    if (parentId && commentWeGaveFeedbackOn) {
      // Modify the comment to add feedback
      cache.modify({
        id: cache.identify({
          __typename: 'Comment',
          id: commentWeGaveFeedbackOn.id,
        }),
        fields: {
          FeedbackComments(existing = []) {
            return [...existing, newFeedbackComment];
          },
        },
      });
    } else {
      emit('updateCommentSectionQueryResult', {
        cache,
        commentToAddFeedbackTo: commentToGiveFeedbackOn.value,
        newFeedbackComment,
      });
    }
  },
});

onAddFeedbackCommentToCommentDone(() => {
  showFeedbackFormModal.value = false;
  showFeedbackSubmittedSuccessfully.value = true;
});

const {
  mutate: editComment,
  error: editCommentError,
  onDone: onDoneUpdatingComment,
} = useMutation(UPDATE_COMMENT);

const {
  mutate: deleteComment,
  onDone: onDoneDeletingComment,
  loading: deleteCommentLoading,
} = useMutation(DELETE_COMMENT, {
  update: (cache) => {
    // First evict the comment itself
    cache.evict({
      id: cache.identify({
        __typename: 'Comment',
        id: commentToDeleteId.value,
      }),
    });

    if (parentOfCommentToDelete.value) {
      // For replies, update the parent's child comments and count
      cache.modify({
        id: cache.identify({
          __typename: 'Comment',
          id: parentOfCommentToDelete.value,
        }),
        fields: {
          ChildComments(existing = []) {
            return existing.filter(
              (reply: CommentType) => reply.id !== commentToDeleteId.value
            );
          },
          ChildCommentsAggregate(existing = { count: 0 }) {
            return {
              ...existing,
              count: Math.max(0, (existing.count || 0) - 1),
            };
          },
        },
      });
    } else {
      // For root comments, update the DiscussionChannel's comments
      cache.modify({
        id: cache.identify({
          __typename: 'DiscussionChannel',
          id: props.commentSectionQueryVariables.discussionId,
        }),
        fields: {
          Comments(existing = []) {
            return existing.filter(
              (comment: CommentType) => comment.id !== commentToDeleteId.value
            );
          },
          CommentsAggregate(existing = { count: 0 }) {
            return {
              ...existing,
              count: Math.max(0, (existing.count || 0) - 1),
            };
          },
        },
      });
    }

    // Clean up any dangling references
    cache.gc();

    emit('decrementCommentCount', cache);
  },
});

onDoneDeletingComment(() => {
  commentToDeleteId.value = '';
  showDeleteCommentModal.value = false;
});

const { mutate: softDeleteComment, onDone: onDoneSoftDeletingComment } =
  useMutation(SOFT_DELETE_COMMENT);

onDoneSoftDeletingComment(() => {
  commentToDeleteId.value = '';
  showDeleteCommentModal.value = false;
});

const {
  mutate: createComment,
  error: createCommentError,
  onDone: onDoneCreatingComment,
} = useMutation(
  CREATE_COMMENT,
  {
    errorPolicy: 'all',
    update: (cache, result) => {
      const newComment: CommentType = result.data?.createComments?.comments[0];
      const newCommentParentId = newComment?.ParentComment?.id;

      // Handle root comments
      if (!newCommentParentId) {
        cache.modify({
          id: cache.identify({
            __typename: 'DiscussionChannel',
            id: props.commentSectionQueryVariables.discussionId,
          }),
          fields: {
            Comments(existingComments = []) {
              return [newComment, ...existingComments];
            },
            CommentsAggregate(existing = { count: 0 }) {
              return {
                ...existing,
                count: (existing?.count || 0) + 1,
              };
            },
          },
        });
        emit('incrementCommentCount', cache);
        return;
      }

      // Handle replies - always use GET_COMMENT_REPLIES query
      try {
        const existingData = cache.readQuery({
          query: GET_COMMENT_REPLIES,
          variables: {
            commentId: newCommentParentId,
            modName: modProfileNameVar.value,
            limit: 5,
            offset: 0,
            sort: getSortFromQuery(route.query),
          },
        });

        const existingReplies =
          (
            existingData as {
              getCommentReplies?: {
                ChildComments?: CommentType[];
                aggregateChildCommentCount?: number;
              };
            }
          )?.getCommentReplies?.ChildComments || [];
        const existingCount =
          (
            existingData as {
              getCommentReplies?: {
                ChildComments?: CommentType[];
                aggregateChildCommentCount?: number;
              };
            }
          )?.getCommentReplies?.aggregateChildCommentCount || 0;

        // Write the updated data back to the cache
        cache.writeQuery({
          query: GET_COMMENT_REPLIES,
          variables: {
            commentId: newCommentParentId,
            modName: modProfileNameVar.value,
            limit: 5,
            offset: 0,
            sort: getSortFromQuery(route.query),
          },
          data: {
            getCommentReplies: {
              __typename: 'CommentReplies',
              ChildComments: [newComment, ...existingReplies],
              aggregateChildCommentCount: existingCount + 1,
            },
          },
        });

        // Update the parent comment's counts
        cache.modify({
          id: cache.identify({
            __typename: 'Comment',
            id: newCommentParentId,
          }),
          fields: {
            ChildCommentsAggregate(existing = { count: 0 }) {
              return {
                __typename: 'CommentsAggregate',
                count: (existing.count || 0) + 1,
              };
            },
            replyCount(existing = 0) {
              return (existing || 0) + 1;
            },
          },
        });

        emit('incrementCommentCount', cache);
      } catch (error) {
        console.error('Error updating cache:', error);
      }
    },
  }
);

onDoneCreatingComment(() => {
  commentInProcess.value = false;
  submitAttempted.value = false;
  replyFormOpenAtCommentID.value = '';
  emit('updateCreateFormValues', {
    text: '',
    isRootComment: true,
    depth: 1,
    parentCommentId: '',
  });
});

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(
  computed(() => props.commentSectionQueryVariables.channelUniqueName || '')
);

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
});

onDoneUpdatingComment(() => {
  commentInProcess.value = false;
  editFormOpenAtCommentID.value = '';
  commentToEdit.value = null;
  editFormValues.value = {
    text: '',
    isRootComment: true,
    depth: 1,
  };
});

watchEffect(() => {
  if (typeof route.params.commentId === 'string') {
    permalinkedCommentId.value = route.params.commentId;
  }
});

function handleClickCreate() {
  // Simply trigger the mutation with the properly structured input from props
  submitAttempted.value = true;
  createComment({
    createCommentInput: props.createCommentInput,
  });
}

function updateCreateInputValuesForReply(input: CreateReplyInputData) {
  const { text, parentCommentId, depth } = input;
  if (!parentCommentId) {
    throw new Error('parentCommentId is required to reply to a comment');
  }
  // Emit to parent to update the form values
  emit('updateCreateReplyCommentInput', {
    text,
    isRootComment: false,
    parentCommentId,
    depth,
  });
}

function handleClickEdit(commentData: CommentType) {
  commentToEdit.value = commentData;
  editFormOpenAtCommentID.value = commentData.id;
  editFormValues.value = {
    text: commentData.text || '',
    isRootComment: !commentData.ParentComment,
    depth: 1,
  };
}

function updateEditInputValues(text: string, isRootComment: boolean) {
  editFormValues.value = {
    ...editFormValues.value,
    text,
    isRootComment,
  };
}

function handleClickDelete(input: DeleteCommentInputData) {
  const { commentId, parentCommentId, replyCount } = input;
  showDeleteCommentModal.value = true;
  commentToDeleteId.value = commentId;
  commentToDeleteReplyCount.value = replyCount;
  parentOfCommentToDelete.value = parentCommentId;
}

function handleSaveEdit() {
  if (!commentToEdit.value?.id) {
    console.error('No comment to edit');
    return;
  }

  editComment({
    commentWhere: {
      id: commentToEdit.value.id,
    },
    updateCommentInput: {
      text: editFormValues.value.text,
      isRootComment: editFormValues.value.isRootComment,
    },
  });
}

function handleDeleteComment() {
  if (!commentToDeleteId.value) {
    throw new Error('commentId is required to delete a comment');
  }
  if (commentToDeleteReplyCount.value > 0) {
    softDeleteComment({ id: commentToDeleteId.value });
  } else {
    deleteComment({ id: commentToDeleteId.value });
  }
}

function scrollToTop() {
  window.scrollTo(0, 0);
}

function openReplyEditor(commentId: string) {
  replyFormOpenAtCommentID.value = commentId;
  editFormOpenAtCommentID.value = ''; // Close edit form if open
}

function hideReplyEditor() {
  replyFormOpenAtCommentID.value = '';
}

function openEditCommentEditor(commentId: string) {
  editFormOpenAtCommentID.value = commentId;
  replyFormOpenAtCommentID.value = ''; // Close reply form if open
}

function hideEditCommentEditor() {
  editFormOpenAtCommentID.value = '';
  commentToEdit.value = null; // Clear edited comment data
}

function handleClickGiveFeedback(input: GiveFeedbackInput) {
  const { commentData, parentCommentId } = input;
  showFeedbackFormModal.value = true;
  parentIdOfCommentToGiveFeedbackOn.value = parentCommentId;
  commentToGiveFeedbackOn.value = commentData;
}

function handleClickUndoFeedback(input: GiveFeedbackInput) {
  const { commentData, parentCommentId } = input;
  showConfirmUndoFeedbackModal.value = true;
  parentIdOfCommentToGiveFeedbackOn.value = parentCommentId;
  commentToRemoveFeedbackFrom.value = commentData;
}

function handleClickEditFeedback(input: EditFeedbackInput) {
  const { commentData } = input;
  commentToGiveFeedbackOn.value = commentData;
  showEditCommentFeedbackModal.value = true;
}

function handleClickReport(commentData: CommentType) {
  commentToReport.value = commentData;
  showBrokenRulesModal.value = true;
}

function handleClickArchive(commentId: string) {
  commentToArchiveId.value = commentId;
  showArchiveModal.value = true;
}

function handleClickArchiveAndSuspend(commentId: string) {
  commentToArchiveAndSuspendId.value = commentId;
  showArchiveAndSuspendModal.value = true;
}

function handleClickUnarchive(commentId: string) {
  commentToUnarchiveId.value = commentId;
  showUnarchiveModal.value = true;
}

function handleSubmitFeedback() {
  if (!commentToGiveFeedbackOn.value?.id) {
    console.error('commentId is required to submit feedback');
    return;
  }
  if (!modProfileNameVar.value) {
    console.error('modName is required to submit feedback');
    return;
  }
  const feedbackInput = {
    commentId: commentToGiveFeedbackOn.value?.id,
    text: editFormValues.value.text,
    modProfileName: modProfileNameVar.value,
    channelId: channelId.value,
  };
  addFeedbackCommentToComment(feedbackInput);
}

function updateFeedback(text: string) {
  editFormValues.value.text = text;
}

function handleViewFeedback(commentId: string) {
  router.push({
    name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId',
    params: {
      forumId: channelId.value,
      discussionId: route.params.discussionId,
      commentId,
    },
  });
}

// Update the lengthOfCommentInProgress computed to be more defensive
const lengthOfCommentInProgress = computed(() => {
  if (editFormOpenAtCommentID.value) {
    return editFormValues.value.text.length;
  }
  if (replyFormOpenAtCommentID.value && props.createFormValues?.text) {
    return props.createFormValues.text.length;
  }
  return 0;
});

const replyHasBotMention = computed(() => {
  return (
    !props.allowBotMentions && hasBotMention(props.createFormValues?.text || '')
  );
});
</script>

<template>
  <div class="pr-2">
    <div>
      <slot name="pre-header" />
      <ErrorBanner
        v-if="createCommentError"
        :text="createCommentError.message"
      />
      <SuspensionNotice
        v-if="
          showSuspensionNotice &&
          suspensionChannelId &&
          suspensionIssueNumber !== null
        "
        class="mb-2"
        :issue-number="suspensionIssueNumber!"
        :channel-id="suspensionChannelId"
        :suspended-until="suspensionUntil ?? undefined"
        :suspended-indefinitely="suspensionIndefinitely ?? false"
        :message="'You are suspended in this forum and cannot comment.'"
      />
      <div class="align-items flex justify-between">
        <div class="flex w-full items-center justify-between space-x-4">
          <h2 id="comments" class="px-1 text-lg dark:text-white">
            {{ `Comments (${aggregateCommentCount})` }}
          </h2>
          <slot name="subscription-button" />
        </div>
        <SortButtons
          v-if="showCommentSortButtons && aggregateCommentCount > 0"
          class="ml-2"
          :show-top-options="false"
        />
      </div>
      <slot />
      <PinnedAnswers
        v-if="answers?.length > 0"
        :answers="answers"
        :enable-feedback="enableFeedback"
        :locked="locked || archived"
        :archived="archived"
        :original-poster="originalPoster"
        :reply-has-bot-mention="replyHasBotMention"
        @create-comment="handleClickCreate"
        @delete-comment="handleClickDelete"
        @click-edit-comment="handleClickEdit"
        @open-edit-comment-editor="openEditCommentEditor"
        @hide-edit-comment-editor="hideEditCommentEditor"
        @save-edit="handleSaveEdit"
        @start-comment-save="commentInProcess = true"
        @open-reply-editor="openReplyEditor"
        @hide-reply-editor="hideReplyEditor"
        @click-report="handleClickReport"
        @click-feedback="handleClickGiveFeedback"
        @click-undo-feedback="handleClickUndoFeedback"
        @click-edit-feedback="handleClickEditFeedback"
        @handle-view-feedback="handleViewFeedback"
        @handle-click-archive="handleClickArchive"
        @handle-click-archive-and-suspend="handleClickArchiveAndSuspend"
        @handle-click-unarchive="handleClickUnarchive"
        @show-copied-link-notification="showCopiedLinkNotification = $event"
        @show-marked-as-best-answer-notification="
          showMarkedAsBestAnswerNotification = $event
        "
        @show-unmarked-as-best-answer-notification="
          showUnmarkedAsBestAnswerNotification = $event
        "
        @open-mod-profile="showModProfileModal = true"
        @scroll-to-top="scrollToTop"
        @update-edit-comment-input="updateEditInputValues"
        @update-create-reply-comment-input="updateCreateInputValuesForReply"
      />
      <InfoBanner
        v-if="locked || archived"
        class="mr-10 mt-2"
        :text="'This comment section is locked.'"
      >
        <LockIcon class="h-5 w-5" />
      </InfoBanner>
      <div
        v-if="shouldShowLoadingSpinner"
        class="ml-2 space-y-4 py-2"
        aria-busy="true"
      >
        <div class="flex gap-3">
          <div
            class="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div class="flex-1 space-y-2">
            <div
              class="h-4 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
            <div
              class="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
            <div
              class="h-3 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
          </div>
        </div>
        <div class="flex gap-3">
          <div
            class="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div class="flex-1 space-y-2">
            <div
              class="h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
            <div
              class="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
            <div
              class="h-3 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
          </div>
        </div>
        <div class="flex gap-3">
          <div
            class="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div class="flex-1 space-y-2">
            <div
              class="h-4 w-1/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
            <div
              class="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
            <div
              class="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
          </div>
        </div>
      </div>
      <NuxtPage
        v-if="showNuxtPage"
        :aggregate-comment-count="aggregateCommentCount"
        :enable-feedback="enableFeedback"
        :locked="locked || archived"
        :comment-in-process="commentInProcess"
        :logged-in-user-mod-name="modProfileNameVar"
        :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
        :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
        :edit-comment-error="editCommentError"
        :original-poster="originalPoster"
        :length-of-comment-in-progress="lengthOfCommentInProgress"
        @start-comment-save="commentInProcess = true"
        @open-reply-editor="openReplyEditor"
        @hide-reply-editor="hideReplyEditor"
        @open-edit-comment-editor="openEditCommentEditor"
        @hide-edit-comment-editor="hideEditCommentEditor"
        @click-edit-comment="handleClickEdit"
        @delete-comment="handleClickDelete"
        @create-comment="handleClickCreate"
        @update-create-reply-comment-input="updateCreateInputValuesForReply"
        @update-edit-comment-input="updateEditInputValues"
        @save-edit="handleSaveEdit"
        @scroll-to-top="scrollToTop"
        @click-report="handleClickReport"
        @click-feedback="handleClickGiveFeedback"
        @click-undo-feedback="handleClickUndoFeedback"
        @click-edit-feedback="handleClickEditFeedback"
        @update-feedback="updateFeedback"
        @handle-view-feedback="handleViewFeedback"
        @show-copied-link-notification="showCopiedLinkNotification = $event"
        @show-marked-as-best-answer-notification="
          showMarkedAsBestAnswerNotification = $event
        "
        @show-unmarked-as-best-answer-notification="
          showUnmarkedAsBestAnswerNotification = $event
        "
        @handle-click-archive="handleClickArchive"
        @handle-click-archive-and-suspend="handleClickArchiveAndSuspend"
        @handle-click-unarchive="handleClickUnarchive"
      />
      <div class="my-4">
        <div
          v-if="!loading && aggregateCommentCount === 0"
          class="ml-1 text-sm dark:text-gray-400"
        >
          There are no comments yet.
        </div>
        <div :key="activeSort">
          <div
            v-for="(comment, index) in comments || []"
            :key="comment?.id || index"
          >
            <Comment
              v-if="comment?.id !== permalinkedCommentId"
              :aggregate-comment-count="aggregateCommentCount"
              :compact="true"
              :comment-data="comment"
              :enable-feedback="enableFeedback"
              :depth="1"
              :locked="locked || archived"
              :comment-in-process="commentInProcess"
              :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
              :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
              :edit-comment-error="editCommentError"
              :mod-profile-name="modProfileNameVar"
              :original-poster="originalPoster"
              :length-of-comment-in-progress="lengthOfCommentInProgress"
              :reply-has-bot-mention="replyHasBotMention"
              :answers="answers"
              @start-comment-save="commentInProcess = true"
              @open-reply-editor="openReplyEditor"
              @hide-reply-editor="hideReplyEditor"
              @open-edit-comment-editor="openEditCommentEditor"
              @hide-edit-comment-editor="hideEditCommentEditor"
              @click-edit-comment="handleClickEdit"
              @update-create-reply-comment-input="
                updateCreateInputValuesForReply
              "
              @create-comment="handleClickCreate"
              @show-copied-link-notification="
                showCopiedLinkNotification = $event
              "
              @show-marked-as-best-answer-notification="
                showMarkedAsBestAnswerNotification = $event
              "
              @show-unmarked-as-best-answer-notification="
                showUnmarkedAsBestAnswerNotification = $event
              "
              @open-mod-profile-modal="showModProfileModal = true"
              @scroll-to-top="scrollToTop"
              @click-report="handleClickReport"
              @click-feedback="handleClickGiveFeedback"
              @click-undo-feedback="handleClickUndoFeedback"
              @click-edit-feedback="handleClickEditFeedback"
              @update-feedback="updateEditInputValues"
              @save-edit="handleSaveEdit"
              @update-edit-comment-input="updateEditInputValues"
              @delete-comment="handleClickDelete"
              @handle-click-archive="handleClickArchive"
              @handle-click-archive-and-suspend="handleClickArchiveAndSuspend"
              @handle-click-unarchive="handleClickUnarchive"
              @handle-view-feedback="handleViewFeedback"
            />
          </div>
        </div>
      </div>
    </div>
    <LoadMore
      v-if="!reachedEndOfResults"
      class="justify-self-center"
      :reached-end-of-results="reachedEndOfResults"
      @load-more="$emit('loadMore')"
    />
    <WarningModal
      :title="'Delete Comment'"
      :body="'Are you sure you want to delete this comment?'"
      :open="showDeleteCommentModal"
      :loading="deleteCommentLoading"
      @close="showDeleteCommentModal = false"
      @primary-button-click="handleDeleteComment"
    />
    <BrokenRulesModal
      v-if="showBrokenRulesModal"
      :open="showBrokenRulesModal"
      :comment-id="commentToReport?.id"
      :comment="commentToReport"
      @close="showBrokenRulesModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showBrokenRulesModal = false;
        }
      "
    />
    <BrokenRulesModal
      v-if="commentToArchiveId"
      :open="showArchiveModal"
      :comment-id="commentToArchiveId"
      :archive-after-reporting="true"
      @close="showArchiveModal = false"
      @reported-and-archived-successfully="
        () => {
          showSuccessfullyArchived = true;
          showArchiveModal = false;
        }
      "
    />
    <UnarchiveModal
      v-if="commentToUnarchiveId"
      :open="showUnarchiveModal"
      :comment-id="commentToUnarchiveId"
      @close="showUnarchiveModal = false"
      @unarchived-successfully="
        () => {
          showSuccessfullyUnarchived = true;
          showUnarchiveModal = false;
        }
      "
    />
    <BrokenRulesModal
      v-if="commentToArchiveAndSuspendId"
      :open="showArchiveAndSuspendModal"
      :title="'Suspend Author'"
      :comment-id="commentToArchiveAndSuspendId"
      :suspend-user-enabled="true"
      :text-box-label="'(Optional) Explain why you are suspending this author:'"
      @close="showArchiveAndSuspendModal = false"
      @suspended-user-successfully="
        () => {
          showSuccessfullyArchivedAndSuspended = true;
          showArchiveAndSuspendModal = false;
        }
      "
    />
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @close-notification="showCopiedLinkNotification = false"
    />
    <Notification
      :show="showMarkedAsBestAnswerNotification"
      :title="'Comment marked as best answer!'"
      @close-notification="showMarkedAsBestAnswerNotification = false"
    />
    <Notification
      :show="showUnmarkedAsBestAnswerNotification"
      :title="'Best answer mark removed!'"
      @close-notification="showUnmarkedAsBestAnswerNotification = false"
    />
    <GenericFeedbackFormModal
      :open="showFeedbackFormModal"
      :loading="addFeedbackCommentToCommentLoading"
      :error="addFeedbackCommentToCommentError?.message || ''"
      @close="showFeedbackFormModal = false"
      @update-feedback="updateFeedback"
      @primary-button-click="handleSubmitFeedback"
    />
    <ConfirmUndoCommentFeedbackModal
      v-if="showConfirmUndoFeedbackModal && commentToRemoveFeedbackFrom"
      :key="modProfileNameVar"
      :open="showConfirmUndoFeedbackModal"
      :comment-id="commentToRemoveFeedbackFrom.id"
      :comment-to-remove-feedback-from="commentToRemoveFeedbackFrom"
      :mod-name="modProfileNameVar"
      @close="showConfirmUndoFeedbackModal = false"
    />
    <EditCommentFeedbackModal
      v-if="showEditCommentFeedbackModal"
      :open="showEditCommentFeedbackModal"
      :comment-id="commentToGiveFeedbackOn?.id || ''"
      :mod-name="modProfileNameVar"
      @close="showEditCommentFeedbackModal = false"
    />
    <Notification
      :show="showFeedbackSubmittedSuccessfully"
      :title="'Your feedback was submitted successfully.'"
      @close-notification="showFeedbackSubmittedSuccessfully = false"
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @close-notification="showSuccessfullyReported = false"
    />
    <Notification
      :show="showSuccessfullyArchived"
      :title="'The content was reported and archived successfully.'"
      @close-notification="showSuccessfullyArchived = false"
    />
    <Notification
      :show="showSuccessfullyArchivedAndSuspended"
      :title="'Archived the post and suspended the author.'"
      @close-notification="showSuccessfullyArchivedAndSuspended = false"
    />
    <Notification
      :show="showSuccessfullyUnarchived"
      :title="'The content was unarchived successfully.'"
      @close-notification="showSuccessfullyUnarchived = false"
    />
  </div>
</template>

<style scoped>
h2 {
  padding-bottom: 0.3em;
}
</style>
