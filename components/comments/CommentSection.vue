<script lang="ts" setup>
import { ref, computed, watchEffect } from "vue";
import { useMutation } from "@vue/apollo-composable";
import Comment from "./Comment.vue";
import LoadMore from "../LoadMore.vue";
import ErrorBanner from "../ErrorBanner.vue";
import WarningModal from "../WarningModal.vue";
import OpenIssueModal from "@/components/mod/OpenIssueModal.vue";
import GenericFeedbackFormModal from "@/components/GenericFeedbackFormModal.vue";
import SortButtons from "@/components/SortButtons.vue";
import Notification from "@/components/NotificationComponent.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ConfirmUndoCommentFeedbackModal from "@/components/discussion/detail/ConfirmUndoCommentFeedbackModal.vue";
import EditCommentFeedbackModal from "@/components/comments/EditCommentFeedbackModal.vue";
import { GET_COMMENT_REPLIES } from "@/graphQLData/comment/queries";
import {
  DELETE_COMMENT,
  UPDATE_COMMENT,
  SOFT_DELETE_COMMENT,
  CREATE_COMMENT,
  ADD_FEEDBACK_COMMENT_TO_COMMENT,
} from "@/graphQLData/comment/mutations";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import type {
  CommentCreateInput,
  Comment as CommentType,
} from "@/__generated__/graphql";
import type {
  CreateEditCommentFormValues,
  CreateReplyInputData,
  DeleteCommentInputData,
} from "@/types/Comment";
import type { Ref, PropType } from "vue";
import { modProfileNameVar } from "@/cache";
import { useRouter, useRoute } from "nuxt/app";

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
});

// Emits
const emit = defineEmits([
  "updateCommentSectionQueryResult",
  "decrementCommentCount",
  "incrementCommentCount",
  "updateCreateReplyCommentInput",
  "loadMore",
]);

// Route and router
const route = useRoute();
const router = useRouter();

// Computed properties
const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);
const activeSort = computed(() => getSortFromQuery(route.query));
const permalinkedCommentId = ref(`${route.params.commentId}`);

// Comment form state
const commentToDeleteId = ref("");
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
const parentOfCommentToDelete = ref("");
const parentIdOfCommentToGiveFeedbackOn = ref("");
const commentInProcess = ref(false);
const replyFormOpenAtCommentID = ref("");
const editFormOpenAtCommentID = ref("");
const showCopiedLinkNotification = ref(false);
const showModProfileModal = ref(false);
const showOpenIssueModal = ref(false);
const showSuccessfullyReported = ref(false);
const locked = ref(false);

const editFormValues = ref<CreateEditCommentFormValues>({
  text: commentToEdit.value?.text || "",
  isRootComment: true,
  depth: 1,
});

const updateCommentInput = computed(() => ({
  text: editFormValues.value?.text || "",
  isRootComment: editFormValues.value?.isRootComment,
}));

const getCommentRepliesVariables = {
  commentId: props.createFormValues.parentCommentId,
  modName: modProfileNameVar.value,
  limit: 5,
  offset: 0,
  sort: getSortFromQuery(route.query),
};

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

    if (parentId) {
      const readQueryResult: any = cache.readQuery({
        query: GET_COMMENT_REPLIES,
        variables: {
          ...getCommentRepliesVariables,
          commentId: parentId,
        },
      });

      if (readQueryResult) {
        const existingReplies =
          readQueryResult?.getCommentReplies?.ChildComments;

        const newChildComments = existingReplies.map((comment: CommentType) => {
          const commentWeGaveFeedbackOn = commentToGiveFeedbackOn.value;

          if (comment.id === commentWeGaveFeedbackOn?.id) {
            const updatedComment = {
              ...commentWeGaveFeedbackOn,
              FeedbackComments: [
                ...comment.FeedbackComments,
                newFeedbackComment,
              ],
            };
            return updatedComment;
          }
          return comment;
        });

        const writeQueryData = {
          ...readQueryResult,
          getCommentReplies: {
            ...readQueryResult.getCommentReplies,
            ChildComments: newChildComments,
          },
        };

        cache.writeQuery({
          query: GET_COMMENT_REPLIES,
          data: writeQueryData,
          variables: {
            ...getCommentRepliesVariables,
            commentId: parentId,
          },
        });
      }
    } else {
      emit("updateCommentSectionQueryResult", {
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
} = useMutation(
  DELETE_COMMENT,
  {
    update: (cache) => {
      if (parentOfCommentToDelete.value) {
        const readQueryResult: any = cache.readQuery({
          query: GET_COMMENT_REPLIES,
          variables: {
            ...getCommentRepliesVariables,
            commentId: parentOfCommentToDelete.value,
          },
        });

        if (readQueryResult) {
          const existingReplies =
            readQueryResult?.getCommentReplies?.ChildComments;
          const filteredReplies = existingReplies.filter(
            (reply: CommentType) => reply.id !== commentToDeleteId.value
          );

          const existingChildCommentAggregate =
            readQueryResult?.getCommentReplies?.aggregateChildCommentCount || 0;
          const newChildCommentAggregate = Math.max(
            0,
            existingChildCommentAggregate - 1
          );

          const writeQueryData = {
            ...readQueryResult,
            getCommentReplies: {
              ...readQueryResult.getCommentReplies,
              ChildComments: filteredReplies,
              aggregateChildCommentCount: newChildCommentAggregate,
            },
          };

          cache.writeQuery({
            query: GET_COMMENT_REPLIES,
            data: writeQueryData,
            variables: {
              ...getCommentRepliesVariables,
              commentId: parentOfCommentToDelete.value,
            },
          });

          emit("decrementCommentCount", cache);
        }
      } else {
        emit("updateCommentSectionQueryResult", {
          cache,
          commentToDeleteId: commentToDeleteId.value,
        });
      }
      emit("decrementCommentCount", cache);
    },
  }
);

onDoneDeletingComment(() => {
  commentToDeleteId.value = "";
  showDeleteCommentModal.value = false;
});

const { mutate: softDeleteComment, onDone: onDoneSoftDeletingComment } =
  useMutation(SOFT_DELETE_COMMENT);

onDoneSoftDeletingComment(() => {
  commentToDeleteId.value = "";
  showDeleteCommentModal.value = false;
});

const { mutate: createComment, onDone: onDoneCreatingComment } = useMutation(
  CREATE_COMMENT,
  {
    errorPolicy: "all",
    update: (cache, result) => {
      const newComment: CommentType = result.data?.createComments?.comments[0];

      const newCommentParentId = newComment?.ParentComment?.id;
      if (!newCommentParentId) {
        throw new Error("newCommentParentId is required");
      }

      const readQueryResult: any = cache.readQuery({
        query: GET_COMMENT_REPLIES,
        variables: {
          ...getCommentRepliesVariables,
          commentId: newCommentParentId,
        },
      });

      if (!readQueryResult) {
        cache.modify({
          id: cache.identify({
            __typename: "Comment",
            id: props.createFormValues.parentCommentId,
          }),
          fields: {
            ChildCommentsAggregate(existingValue: any) {
              return {
                ...existingValue,
                count: existingValue.count + 1,
              };
            },
          },
        });
      }

      if (readQueryResult) {
        const existingReplies =
          readQueryResult?.getCommentReplies?.ChildComments;
        const existingChildCommentAggregate =
          readQueryResult?.getCommentReplies?.aggregateChildCommentCount || 0;
        const newChildCommentAggregate = existingChildCommentAggregate + 1;

        const newGetRepliesData = {
          ...readQueryResult,
          getCommentReplies: {
            ...readQueryResult?.getCommentReplies,
            ChildComments: [newComment, ...existingReplies],
            aggregateChildCommentCount: newChildCommentAggregate,
          },
        };

        cache.writeQuery({
          query: GET_COMMENT_REPLIES,
          data: newGetRepliesData,
          variables: {
            ...getCommentRepliesVariables,
            commentId: newCommentParentId,
          },
        });
      }
      
      emit("incrementCommentCount", cache);
    },
  }
);

onDoneCreatingComment(() => {
  commentInProcess.value = false;
  replyFormOpenAtCommentID.value = "";
});

onDoneUpdatingComment(() => {
  commentInProcess.value = false;
  editFormOpenAtCommentID.value = "";
});

watchEffect(() => {
  if (typeof route.params.commentId === "string") {
    permalinkedCommentId.value = route.params.commentId;
  }
});

function updateCreateInputValuesForReply(input: CreateReplyInputData) {
  const { text, parentCommentId, depth } = input;
  if (!parentCommentId) {
    throw new Error("parentCommentId is required to reply to a comment");
  }
  const updatedCreateFormValues = {
    ...props.createFormValues,
    text,
    parentCommentId,
    depth,
  };
  emit("updateCreateReplyCommentInput", updatedCreateFormValues);
}

function updateEditInputValues(text: string, isRootComment: boolean) {
  editFormValues.value.isRootComment = isRootComment;
  editFormValues.value.text = text;
}

function handleClickCreate() {
  createComment({
    createCommentInput: props.createCommentInput,
  });
}

function handleClickEdit(commentData: CommentType) {
  commentToEdit.value = commentData;
}

function handleClickDelete(input: DeleteCommentInputData) {
  const { commentId, parentCommentId, replyCount } = input;
  showDeleteCommentModal.value = true;
  commentToDeleteId.value = commentId;
  commentToDeleteReplyCount.value = replyCount;
  parentOfCommentToDelete.value = parentCommentId;
}

function handleSaveEdit() {
  editComment({
    commentWhere: {
      id: commentToEdit.value?.id || "",
    },
    updateCommentInput: updateCommentInput.value,
  });
}

function handleDeleteComment() {
  if (!commentToDeleteId.value) {
    throw new Error("commentId is required to delete a comment");
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
}

function hideReplyEditor() {
  replyFormOpenAtCommentID.value = "";
}

function openEditCommentEditor(commentId: string) {
  editFormOpenAtCommentID.value = commentId;
}

function hideEditCommentEditor() {
  editFormOpenAtCommentID.value = "";
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
  showOpenIssueModal.value = true;
}

function handleSubmitFeedback() {
  if (!commentToGiveFeedbackOn.value?.id) {
    console.error("commentId is required to submit feedback");
    return;
  }
  if (!modProfileNameVar.value) {
    console.error("modName is required to submit feedback");
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
    name: "forums-forumId-discussions-commentFeedback-discussionId-commentId",
    params: {
      forumId: channelId.value,
      discussionId: route.params.discussionId,
      commentId,
    },
  });
}

const lengthOfCommentInProgress = computed(() => {
  // if edit form is open, return the edit form value length
  if (editFormOpenAtCommentID.value) {
    return editFormValues.value.text.length;
  }
  // if the reply-to-comment form is open,
  // return the create form value length
  if (replyFormOpenAtCommentID.value) {
    return props.createFormValues.text.length;
  }
  return 0;
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 pr-2">
    <div>
      <div class="align-items flex justify-between">
        <h2 id="comments" class="px-1 text-lg dark:text-white">
          {{ `Comments (${aggregateCommentCount})` }}
        </h2>
        <SortButtons v-if="showCommentSortButtons" :show-top-options="false" />
      </div>
      <ErrorBanner
        v-if="locked"
        class="mr-10 mt-2"
        :text="'This comment section is locked because the post was removed from the channel.'"
      />
      <LoadingSpinner v-if="loading" class="ml-2" />
      <NuxtPage
        :aggregate-comment-count="aggregateCommentCount"
        :enable-feedback="enableFeedback"
        :locked="locked"
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
      />
      <div class="my-4">
        <div
          v-if="!loading && aggregateCommentCount === 0"
          class="ml-1 text-sm dark:text-gray-400"
        >
          There are no comments yet.
        </div>
        <div :key="activeSort">
          <div v-for="comment in comments || []" :key="comment.id">
            <Comment
              v-if="comment.id !== permalinkedCommentId"
              :aggregate-comment-count="aggregateCommentCount"
              :compact="true"
              :comment-data="comment"
              :enable-feedback="enableFeedback"
              :depth="1"
              :locked="locked"
              :comment-in-process="commentInProcess"
              :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
              :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
              :edit-comment-error="editCommentError"
              :mod-profile-name="modProfileNameVar"
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
              @update-create-reply-comment-input="
                updateCreateInputValuesForReply
              "
              @update-edit-comment-input="updateEditInputValues"
              @save-edit="handleSaveEdit"
              @show-copied-link-notification="
                showCopiedLinkNotification = $event
              "
              @open-mod-profile-modal="showModProfileModal = true"
              @scroll-to-top="scrollToTop"
              @click-report="handleClickReport"
              @click-feedback="handleClickGiveFeedback"
              @click-undo-feedback="handleClickUndoFeedback"
              @click-edit-feedback="handleClickEditFeedback"
              @update-feedback="updateFeedback"
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
    <OpenIssueModal
      v-if="showOpenIssueModal"
      :open="showOpenIssueModal"
      :comment-id="commentToReport?.id"
      :comment="commentToReport"
      @close="showOpenIssueModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showOpenIssueModal = false;
        }
      "
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @close-notification="showSuccessfullyReported = false"
    />
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @close-notification="showCopiedLinkNotification = false"
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
  </div>
</template>

<style scoped>
h2 {
  padding-bottom: 0.3em;
}
</style>
