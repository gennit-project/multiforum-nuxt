<script lang="ts">
import { defineComponent, ref, computed, PropType, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import Comment from "./Comment.vue";
import LoadMore from "../LoadMore.vue";
import {
  CreateEditCommentFormValues,
  CreateReplyInputData,
  DeleteCommentInputData,
} from "@/types/Comment";
import { GET_COMMENT_REPLIES } from "@/graphQLData/comment/queries";
import {
  DELETE_COMMENT,
  UPDATE_COMMENT,
  SOFT_DELETE_COMMENT,
} from "@/graphQLData/comment/mutations";
import { useQuery, useMutation } from "@vue/apollo-composable";
import ErrorBanner from "../ErrorBanner.vue";
import WarningModal from "../WarningModal.vue";
import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
import type { Ref } from "vue";
import PermalinkedComment from "./PermalinkedComment.vue";
import OpenIssueModal from "@/components/mod/OpenIssueModal.vue";
import GenericFeedbackFormModal from "@/components/forms/GenericFeedbackFormModal.vue";
import { ADD_FEEDBACK_COMMENT_TO_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_LOCAL_MOD_PROFILE_NAME } from "@/graphQLData/user/queries";
import SortButtons from "@/components/SortButtons.vue";
import { modProfileNameVar } from "@/cache";
import Notification from "@/components/Notification.vue";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import {
  CommentCreateInput,
  Comment as CommentType,
} from "@/src/__generated__/graphql";
import ConfirmUndoCommentFeedbackModal from "@/components/discussion/detail/ConfirmUndoCommentFeedbackModal.vue";
import EditCommentFeedbackModal from "@/components/comments/EditCommentFeedbackModal.vue";

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

export default defineComponent({
  components: {
    Comment,
    ConfirmUndoCommentFeedbackModal,
    EditCommentFeedbackModal,
    ErrorBanner,
    GenericFeedbackFormModal,
    LoadingSpinner,
    LoadMore,
    Notification,
    OpenIssueModal,
    PermalinkedComment,
    SortButtons,
    WarningModal,
  },
  inheritAttrs: false,
  props: {
    aggregateCommentCount: {
      type: Number,
      required: false,
      default: 0,
    },
    commentSectionQueryVariables: {
      required: true,
      type: Object as PropType<CommentSectionQueryVariablesType>,
    },
    comments: {
      type: Array as PropType<CommentType[]>,
      required: false,
      default: () => {
        return [];
      },
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
      required: false,
      default: true,
    },
    loading: {
      type: Boolean,
      required: false,
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
      required: false,
      default: true
    }
  },
  setup(props, { emit }) {
    const route = useRoute();
    const router = useRouter();

    const channelId = computed(() => {
      if (typeof route.params.channelId !== "string") {
        return "";
      }
      return route.params.channelId;
    });

    const activeSort = computed(() => {
      return getSortFromQuery(route.query);
    });

    const isPermalinkPage = computed(() => {
      if (route.params.commentId) {
        // If the route has a commentId, it means that the user
        // is viewing a permalink to a comment. In that case,
        // the permalinked comment should be fetched separately
        // and displayed at the top of the comment section.
        return true;
      }
      return false;
    });

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

    const {
      mutate: addFeedbackCommentToComment,
      loading: addFeedbackCommentToCommentLoading,
      error: addFeedbackCommentToCommentError,
      onDone: onAddFeedbackCommentToCommentDone,
    } = useMutation(ADD_FEEDBACK_COMMENT_TO_COMMENT, {
      update: (cache: any, result: any) => {
        const parentId = JSON.parse(
          JSON.stringify(parentIdOfCommentToGiveFeedbackOn.value),
        );
        const newFeedbackComment = result.data.createComments.comments[0];

        // if it was a child comment, update GET_COMMENT_REPLIES
        if (parentId) {
          const readQueryResult = cache.readQuery({
            query: GET_COMMENT_REPLIES,
            variables: {
              ...getCommentRepliesVariables,
              commentId: parentId,
            },
          });

          if (readQueryResult) {
            const existingReplies =
              readQueryResult?.getCommentReplies?.ChildComments;

            const newChildComments = existingReplies.map(
              (comment: CommentType) => {
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
              },
            );

            const writeQueryData = {
              ...readQueryResult,
              getCommentReplies: {
                ...readQueryResult.getCommentReplies,
                ChildComments: newChildComments,
              },
            };

            // Write the updated replies back to the cache.
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
          // If it was a root comment, update the comment section query result
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

    const editFormValues = ref<CreateEditCommentFormValues>({
      text: commentToEdit.value?.text || "",
      isRootComment: true, // changes to false for 2nd level comments and below
      depth: 1,
    });

    const updateCommentInput = computed(() => {
      return {
        text: editFormValues.value?.text || "",
        isRootComment: editFormValues.value?.isRootComment,
      };
    });

    const {
      mutate: editComment,
      error: editCommentError,
      onDone: onDoneUpdatingComment,
    } = useMutation(UPDATE_COMMENT, () => ({
      variables: {
        commentWhere: {
          id: commentToEdit.value?.id || "",
        },
        updateCommentInput: updateCommentInput.value,
      },
    }));

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value.modProfileName;
    });

    const getCommentRepliesVariables = {
      commentId: props.createFormValues.parentCommentId,
      modName: loggedInUserModName.value,
      limit: 5,
      offset: 0,
      sort: getSortFromQuery(route.query),
    };

    const { mutate: deleteComment, onDone: onDoneDeletingComment } =
      useMutation(DELETE_COMMENT, {
        update: (cache: any) => {
          if (parentOfCommentToDelete.value) {
            // For child comments, update the parent comment's replies

            // 1. Read the current set of replies to the parent comment.
            const readQueryResult = cache.readQuery({
              query: GET_COMMENT_REPLIES,
              variables: {
                ...getCommentRepliesVariables,
                commentId: parentOfCommentToDelete.value,
              },
            });

            if (readQueryResult) {
              const existingReplies =
                readQueryResult?.getCommentReplies?.ChildComments;

              // 2. Filter out the deleted reply.
              const filteredReplies = existingReplies.filter(
                (reply: CommentType) => reply.id !== commentToDeleteId.value,
              );

              const existingChildCommentAggregate =
                readQueryResult?.getCommentReplies
                  ?.aggregateChildCommentCount || 0;

              // 3. Decrease the aggregate count.
              let newChildCommentAggregate = Math.max(
                0,
                existingChildCommentAggregate - 1,
              );

              const writeQueryData = {
                ...readQueryResult,
                getCommentReplies: {
                  ...readQueryResult.getCommentReplies,
                  ChildComments: filteredReplies,
                  aggregateChildCommentCount: newChildCommentAggregate,
                },
              };

              // Write the updated replies back to the cache.
              cache.writeQuery({
                query: GET_COMMENT_REPLIES,
                data: writeQueryData,
                variables: {
                  ...getCommentRepliesVariables,
                  commentId: parentOfCommentToDelete.value,
                },
              });

              // 4. Update the total count of comments
              emit("decrementCommentCount", cache);
            }
          } else {
            // For root comments, update the comment section query result
            emit("updateCommentSectionQueryResult", {
              cache,
              commentToDeleteId: commentToDeleteId.value,
            });
          }
          // For both root comments and replies, update the aggregate
          // count of the comment section
          emit("decrementCommentCount", cache);
        },
      });

    onDoneDeletingComment(() => {
      commentToDeleteId.value = "";
      showDeleteCommentModal.value = false;
    });

    // The soft delete is for comments that have
    // replies. It replaces the text with [deleted]
    // and removes the author name, but leaves the comment
    // so that the replies are still visible.
    const { mutate: softDeleteComment, onDone: onDoneSoftDeletingComment } =
      useMutation(SOFT_DELETE_COMMENT);

    onDoneSoftDeletingComment(() => {
      commentToDeleteId.value = "";
      showDeleteCommentModal.value = false;
    });

    const {
      mutate: createComment,
      error: createCommentError,
      onDone: onDoneCreatingComment,
    } = useMutation(CREATE_COMMENT, () => ({
      errorPolicy: "all",
      variables: {
        createCommentInput: props.createCommentInput,
      },
      update: (cache: any, result: any) => {
        // This contains logic for updating the cache after you reply
        // to a comment. For the logic for updating a root comment,
        // see the CreateRootComment form.
        const newComment: CommentType =
          result.data?.createComments?.comments[0];

        const newCommentParentId = newComment?.ParentComment?.id;
        if (!newCommentParentId) {
          throw new Error("newCommentParentId is required");
        }

        // For nested comments, first
        // check if there are already replies to the parent
        // comment.
        const readQueryResult = cache.readQuery({
          query: GET_COMMENT_REPLIES,
          variables: {
            ...getCommentRepliesVariables,
            commentId: newCommentParentId,
          },
        });

        if (!readQueryResult) {
          // If we have not yet tried to fetch the replies
          // of the parent comment, it is probably because
          // the reply count was 0. Changing the count to 1
          // should cause the replies to refetch.
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

          // If there are NOT already replies to the parent
          // comment, edit the aggregate count
          // of child comments on the parent comment. That should
          // trigger the GET_COMMENT_REPLIES query to be fetched.

          const existingChildCommentAggregate =
            readQueryResult?.getCommentReplies?.aggregateChildCommentCount || 0;
          let newChildCommentAggregate = existingChildCommentAggregate + 1;

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
        } // end of if-statement for if query result exists.
        // the following runs if there were previously 0 or more than
        // 0 child comments.

        // Update the total count of comments
        emit("incrementCommentCount", cache);
      },
    }));

    const commentInProcess = ref(false);

    // Holds the ID of the comment with an open reply form.
    // Allows us to hold open/close state at the comment section level
    // because the async mutation is at this level, while
    // also allowing us to keep track of which comment has an open editor.
    const replyFormOpenAtCommentID = ref("");

    const editFormOpenAtCommentID = ref("");

    onDoneCreatingComment(() => {
      commentInProcess.value = false;
      replyFormOpenAtCommentID.value = "";
    });

    onDoneUpdatingComment(() => {
      commentInProcess.value = false;
      editFormOpenAtCommentID.value = "";
    });

    const permalinkedCommentId = ref(`${route.params.commentId}`);

    watchEffect(() => {
      // If the permalinked comment changes in the query params,
      // the permalinked comment ID should update to cause the
      // comment section to rerender.
      if (typeof route.params.commentId !== "string") {
        return;
      }
      permalinkedCommentId.value = route.params.commentId;
    });

    const showCopiedLinkNotification = ref(false);

    return {
      activeSort,
      addFeedbackCommentToComment,
      addFeedbackCommentToCommentError,
      addFeedbackCommentToCommentLoading,
      channelId,
      commentInProcess,
      commentToEdit,
      commentToDeleteId,
      commentToDeleteReplyCount,
      commentToGiveFeedbackOn,
      commentToRemoveFeedbackFrom,
      commentToReport,
      createComment,
      createCommentError,
      deleteComment,
      editComment,
      editCommentError,
      editFormValues,
      editFormOpenAtCommentID,
      isPermalinkPage,
      locked: ref(false),
      loggedInUserModName,
      parentOfCommentToDelete,
      // This 'parentIdOfCommentToGiveFeedbackOn' is not used in the template.
      // We only return it from setup because that is needed to keep the variable
      // reactive when it is used in the cache update function that runs
      // after a feedback comment is added. Without it, the cache does not update properly.
      parentIdOfCommentToGiveFeedbackOn,
      permalinkedCommentId,
      replyFormOpenAtCommentID,
      showCopiedLinkNotification,
      showDeleteCommentModal,
      showModProfileModal: ref(false),
      showConfirmUndoFeedbackModal,
      showFeedbackFormModal,
      showEditCommentFeedbackModal,
      showOpenIssueModal: ref(false),
      showSuccessfullyReported: ref(false),
      showFeedbackSubmittedSuccessfully,
      route,
      router,
      softDeleteComment,
    };
  },
  methods: {
    updateCreateInputValuesForReply(input: CreateReplyInputData) {
      const { text, parentCommentId, depth } = input;
      if (!parentCommentId) {
        throw new Error("parentCommentId is required to reply to a comment");
      }
      const updatedCreateFormValues = {
        ...this.createFormValues,
        text,
        parentCommentId,
        depth,
      };
      this.$emit("updateCreateReplyCommentInput", updatedCreateFormValues);
    },
    updateEditInputValues(text: string, isRootComment: boolean) {
      this.editFormValues.isRootComment = isRootComment;
      this.editFormValues.text = text;
    },
    handleClickCreate() {
      // Reply to a comment. Root comment creation
      // is handled in the parent component.
      this.createComment();
    },
    handleClickEdit(commentData: CommentType) {
      this.commentToEdit = commentData;
    },
    handleClickDelete(input: DeleteCommentInputData) {
      // When the user first clicks delete, show the confirmation modal
      // and set the ID of the comment that will be deleted when confirmed.
      const { commentId, parentCommentId, replyCount } = input;
      this.showDeleteCommentModal = true;
      this.commentToDeleteId = commentId;
      this.commentToDeleteReplyCount = replyCount;
      this.parentOfCommentToDelete = parentCommentId;
    },
    handleSaveEdit() {
      this.editComment();
    },
    handleDeleteComment() {
      // This is the function that actually deletes the comment.
      if (!this.commentToDeleteId) {
        throw new Error("commentId is required to delete a comment");
      }
      if (this.commentToDeleteReplyCount > 0) {
        // Soft delete the comment if there are replies
        // to allow the replies to remain visible
        this.softDeleteComment({ id: this.commentToDeleteId });
      }
      if (this.commentToDeleteReplyCount === 0) {
        // Hard delete the comment if there are no replies
        // to avoid cluttering the screen
        this.deleteComment({ id: this.commentToDeleteId });
      }
    },
    async handleCreateModProfileClick() {
      const result = await this.createModProfile();

      const modProfileName =
        result.data.updateUsers.users[0].ModerationProfile.displayName;

      modProfileNameVar(modProfileName);
      this.showModProfileModal = false;
    },
    scrollToTop() {
      // This is used to scroll to the top of the comment section
      // when the user clicks "Continue Thread."
      this.$nextTick(() => {
        window.scrollTo(0, 0);
      });
    },
    openReplyEditor(commentId: string) {
      this.replyFormOpenAtCommentID = commentId;
    },
    hideReplyEditor() {
      this.replyFormOpenAtCommentID = "";
    },
    openEditCommentEditor(commentId: string) {
      this.editFormOpenAtCommentID = commentId;
    },
    hideEditCommentEditor() {
      this.editFormOpenAtCommentID = "";
    },
    handleClickGiveFeedback(input: GiveFeedbackInput) {
      const { commentData, parentCommentId } = input;
      this.showFeedbackFormModal = true;
      this.parentIdOfCommentToGiveFeedbackOn = parentCommentId;
      this.commentToGiveFeedbackOn = commentData;
    },
    handleClickUndoFeedback(input: GiveFeedbackInput) {
      const { commentData, parentCommentId } = input;
      this.showConfirmUndoFeedbackModal = true;
      this.parentIdOfCommentToGiveFeedbackOn = parentCommentId;
      this.commentToRemoveFeedbackFrom = commentData;
    },
    handleClickEditFeedback(input: EditFeedbackInput) {
      const { commentData } = input;
      this.commentToGiveFeedbackOn = commentData;
      this.showEditCommentFeedbackModal = true;
    },
    handleClickReport(commentData: CommentType) {
      this.commentToReport = commentData;
      this.showOpenIssueModal = true;
    },
    handleSubmitFeedback() {
      if (!this.commentToGiveFeedbackOn?.id) {
        console.error("commentId is required to submit feedback");
        return;
      }
      if (!this.loggedInUserModName) {
        console.error("modName is required to submit feedback");
        return;
      }
      const feedbackInput = {
        commentId: this.commentToGiveFeedbackOn?.id,
        text: this.feedbackText,
        modProfileName: this.loggedInUserModName,
        channelId: this.channelId,
      }
      this.addFeedbackCommentToComment(feedbackInput);
    },
    updateFeedback(text: string) {
      this.feedbackText = text;
    },
    handleViewFeedback(commentId: string) {
      this.router.push({
        name: "CommentFeedback",
        params: {
          channelId: this.channelId,
          discussionId: this.discussionId,
          commentId: commentId,
        },
      });
    },
  },
});
</script>
<template>
  <div class="bg-white dark:bg-gray-800">
    <div>
      <div class="align-items flex justify-between">
        <h2
          id="comments"
          ref="commentSectionHeader"
          class="px-1 text-lg"
        >
          {{ `Comments (${aggregateCommentCount})` }}
        </h2>
        <SortButtons
          v-if="showCommentSortButtons"
          :show-top-options="false"
        />
      </div>
      <ErrorBanner
        v-if="locked"
        class="mr-10 mt-2"
        :text="'This comment section is locked because the post was removed from the channel.'"
      />
      <LoadingSpinner
        v-if="loading"
        class="ml-2"
      />
      <PermalinkedComment
        v-if="isPermalinkPage"
        :key="permalinkedCommentId"
        class="mt-2"
        :comment-id="permalinkedCommentId"
      >
        <template #comment="{ commentData }">
          <Comment
            :aggregate-comment-count="aggregateCommentCount"
            :compact="true"
            :comment-data="commentData"
            :enable-feedback="enableFeedback"
            :depth="1"
            :locked="locked"
            :comment-in-process="commentInProcess"
            :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
            :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
            :edit-comment-error="editCommentError"
            :mod-profile-name="loggedInUserModName"
            :original-poster="originalPoster"
            @startCommentSave="commentInProcess = true"
            @openReplyEditor="openReplyEditor"
            @hideReplyEditor="hideReplyEditor"
            @openEditCommentEditor="openEditCommentEditor"
            @hideEditCommentEditor="hideEditCommentEditor"
            @clickEditComment="handleClickEdit"
            @deleteComment="handleClickDelete"
            @createComment="handleClickCreate"
            @updateCreateReplyCommentInput="updateCreateInputValuesForReply"
            @updateEditCommentInput="updateEditInputValues"
            @saveEdit="handleSaveEdit"
            @scrollToTop="scrollToTop"
            @clickReport="handleClickReport"
            @clickFeedback="handleClickGiveFeedback"
            @clickUndoFeedback="handleClickUndoFeedback"
            @clickEditFeedback="handleClickEditFeedback"
            @updateFeedback="updateFeedback"
            @handleViewFeedback="handleViewFeedback"
          />
        </template>
      </PermalinkedComment>
      <div class="my-4">
        <div v-if="!loading && aggregateCommentCount === 0">
          There are no comments yet.
        </div>
        <div :key="activeSort">
          <div
            v-for="comment in comments || []"
            :key="comment.id"
          >
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
              :mod-profile-name="loggedInUserModName"
              :original-poster="originalPoster"
              @startCommentSave="commentInProcess = true"
              @openReplyEditor="openReplyEditor"
              @hideReplyEditor="hideReplyEditor"
              @openEditCommentEditor="openEditCommentEditor"
              @hideEditCommentEditor="hideEditCommentEditor"
              @clickEditComment="handleClickEdit"
              @deleteComment="handleClickDelete"
              @createComment="handleClickCreate"
              @updateCreateReplyCommentInput="updateCreateInputValuesForReply"
              @updateEditCommentInput="updateEditInputValues"
              @saveEdit="handleSaveEdit"
              @showCopiedLinkNotification="showCopiedLinkNotification = $event"
              @openModProfileModal="showModProfileModal = true"
              @scrollToTop="scrollToTop"
              @clickReport="handleClickReport"
              @clickFeedback="handleClickGiveFeedback"
              @clickUndoFeedback="handleClickUndoFeedback"
              @clickEditFeedback="handleClickEditFeedback"
              @updateFeedback="updateFeedback"
              @handleViewFeedback="handleViewFeedback"
            />
          </div>
        </div>
      </div>
    </div>
    <LoadMore
      v-if="!reachedEndOfResults"
      class="justify-self-center"
      :reached-end-of-results="reachedEndOfResults"
      @loadMore="$emit('loadMore')"
    />
    <WarningModal
      :title="'Delete Comment'"
      :body="'Are you sure you want to delete this comment?'"
      :open="showDeleteCommentModal"
      @close="showDeleteCommentModal = false"
      @primaryButtonClick="handleDeleteComment"
    />
    <OpenIssueModal
      v-if="showOpenIssueModal"
      :open="showOpenIssueModal"
      :comment-id="commentToReport?.id"
      :comment="commentToReport"
      @close="showOpenIssueModal = false"
      @reportSubmittedSuccessfully="
        () => {
          showSuccessfullyReported = true;
          showOpenIssueModal = false;
        }
      "
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @closeNotification="showSuccessfullyReported = false"
    />
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @closeNotification="showCopiedLinkNotification = false"
    />
    <WarningModal
      v-if="showModProfileModal"
      :title="'Create Mod Profile'"
      :body="`Moderation activity is tracked to prevent abuse, therefore you need to create a mod profile in order to downvote this comment. Continue?`"
      :open="showModProfileModal"
      :primary-button-text="'Yes, create a mod profile'"
      @close="showModProfileModal = false"
      @primaryButtonClick="handleCreateModProfileClick"
    />
    <GenericFeedbackFormModal
      :open="showFeedbackFormModal"
      :loading="addFeedbackCommentToCommentLoading"
      :error="addFeedbackCommentToCommentError?.message || ''"
      @close="showFeedbackFormModal = false"
      @updateFeedback="updateFeedback"
      @primaryButtonClick="handleSubmitFeedback"
    />
    <ConfirmUndoCommentFeedbackModal
      v-if="showConfirmUndoFeedbackModal && commentToRemoveFeedbackFrom"
      :key="loggedInUserModName"
      :open="showConfirmUndoFeedbackModal"
      :comment-id="commentToRemoveFeedbackFrom.id"
      :comment-to-remove-feedback-from="commentToRemoveFeedbackFrom"
      :mod-name="loggedInUserModName"
      @close="showConfirmUndoFeedbackModal = false"
    />
    <EditCommentFeedbackModal
      v-if="showEditCommentFeedbackModal"
      :open="showEditCommentFeedbackModal"
      :comment-id="commentToGiveFeedbackOn?.id || ''"
      :mod-name="loggedInUserModName"
      @close="showEditCommentFeedbackModal = false"
    />
    <Notification
      :show="showFeedbackSubmittedSuccessfully"
      :title="'Your feedback was submitted successfully.'"
      @closeNotification="showFeedbackSubmittedSuccessfully = false"
    />
  </div>
</template>
<style scoped>
h2 {
  padding-bottom: 0.3em;
}
</style>
