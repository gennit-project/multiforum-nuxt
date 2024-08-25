<script lang="ts">
import { Comment } from "@/__generated__/graphql";
import { computed, defineComponent, PropType, ref } from "vue";
import { useRoute } from "vue-router";
import InfoBanner from "@/components/InfoBanner.vue";
import LoadMore from "@/components/LoadMore.vue";
import CommentOnFeedbackPage from "./CommentOnFeedbackPage.vue";
import Notification from "../Notification.vue";
import PermalinkedFeedbackComment from "@/components/comments/PermalinkedFeedbackComment.vue";
import GenericFeedbackFormModal from "@/components/forms/GenericFeedbackFormModal.vue";
import ConfirmUndoCommentFeedbackModal from "@/components/discussion/detail/ConfirmUndoCommentFeedbackModal.vue";
import EditCommentFeedbackModal from "@/components/comments/EditCommentFeedbackModal.vue";

type GiveFeedbackInput = {
  commentData: Comment;
  parentCommentId: string;
};

type EditFeedbackInput = {
  commentData: Comment;
};

export default defineComponent({
  name: "CommentFeedback",
  components: {
    InfoBanner,
    LoadMore,
    Notification,
    PermalinkedFeedbackComment,
    CommentOnFeedbackPage,
    GenericFeedbackFormModal,
    ConfirmUndoCommentFeedbackModal,
    EditCommentFeedbackModal,
  },
  props: {
    addFeedbackCommentToCommentError: {
      type: String,
      required: true,
    },
    addFeedbackCommentToCommentLoading: {
      type: Boolean,
      required: true,
    },
    commentToGiveFeedbackOn: {
      type: Object as PropType<Comment>,
      default: null,
    },
    commentToRemoveFeedbackFrom: {
      type: Object as PropType<Comment>,
      default: null,
    },
    feedbackCommentsAggregate: {
      type: Number,
      required: true,
    },
    feedbackComments: {
      type: Array as () => Comment[],
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
    loadMore: {
      type: Function,
      required: true,
    },
    loggedInUserModName: {
      type: String,
      default: "",
    },
    reachedEndOfResults: {
      type: Boolean,
      required: true,
    },
    showFeedbackFormModal: {
      type: Boolean,
      required: true,
    },
    showFeedbackSubmittedSuccessfully: {
      type: Boolean,
      required: true,
    },
    showPermalinkedFeedback: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const route = useRoute();
    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });
    const feedbackId = computed(() => {
      if (typeof route.params.feedbackId === "string") {
        return route.params.feedbackId;
      }
      return "";
    });
    const showConfirmUndoFeedbackModal = ref(false);
    const showEditCommentFeedbackModal = ref(false);

    return {
      channelId,
      feedbackId,
      showCopiedLinkNotification: ref(false),
      showConfirmUndoFeedbackModal,
      showEditCommentFeedbackModal,
    };
  },
  methods: {
    handleClickGiveFeedback(input: GiveFeedbackInput) {
      const { commentData, parentCommentId } = input;
      this.$emit("openFeedbackFormModal", { commentData, parentCommentId });
      this.$emit("updateCommentToGiveFeedbackOn", commentData);
    },
    handleClickUndoFeedback(input: GiveFeedbackInput) {
      const { commentData } = input;
      this.showConfirmUndoFeedbackModal = true;
      this.$emit("updateCommentToRemoveFeedbackFrom", commentData);
    },
    handleClickEditFeedback(input: EditFeedbackInput) {
      const { commentData } = input;
      this.$emit("updateCommentToGiveFeedbackOn", commentData);
      this.showEditCommentFeedbackModal = true;
    },
    updateFeedback(text: string) {
      this.feedbackText = text;
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
      };
      this.$emit('addFeedbackCommentToComment', feedbackInput);
    },
  },
});
</script>
<template>
  <div>
    <h2 class="mt-4 text-wrap text-center text-xl font-bold dark:text-gray-200">
      Feedback Comments ({{ feedbackCommentsAggregate }})
    </h2>
    <InfoBanner
      v-if="feedbackCommentsAggregate > 0"
      :text="'Feedback should focus on the writing, not the writer. If the feedback is rude or non-actionable, please report it.'"
    />
    <div
      v-if="feedbackCommentsAggregate === 0"
      class="text-center text-gray-500 dark:text-gray-300"
    >
      No feedback yet.
    </div>
    <PermalinkedFeedbackComment
      v-if="showPermalinkedFeedback && feedbackId"
      :key="feedbackId"
      class="mt-2"
      :comment-id="feedbackId"
    >
      <template #comment="{ commentData }">
        <CommentOnFeedbackPage
          :comment="commentData"
          :is-highlighted="true"
          @showCopiedLinkNotification="showCopiedLinkNotification = true"
          @clickFeedback="handleClickGiveFeedback"
          @clickUndoFeedback="handleClickUndoFeedback"
          @clickEditFeedback="handleClickEditFeedback"
        />
      </template>
    </PermalinkedFeedbackComment>
    <div
      v-for="comment in feedbackComments"
      :key="comment.id"
    >
      <CommentOnFeedbackPage
        v-if="
          !showPermalinkedFeedback ||
            (showPermalinkedFeedback && comment.id !== feedbackId)
        "
        :comment="comment"
        @showCopiedLinkNotification="showCopiedLinkNotification = true"
        @clickFeedback="handleClickGiveFeedback"
        @clickUndoFeedback="handleClickUndoFeedback"
        @clickEditFeedback="handleClickEditFeedback"
      />
    </div>
    <LoadMore
      v-if="!loading && !reachedEndOfResults"
      :reached-end-of-results="reachedEndOfResults"
      @loadMore="() => loadMore()"
    />
    <div v-if="loading">
      Loading...
    </div>
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @closeNotification="showCopiedLinkNotification = false"
    />
    <GenericFeedbackFormModal
      :open="showFeedbackFormModal"
      :loading="addFeedbackCommentToCommentLoading"
      :error="addFeedbackCommentToCommentError"
      @close="$emit('closeFeedbackFormModal')"
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
  </div>
</template>
