<script lang="ts">
import type { Ref} from "vue";
import { defineComponent, ref } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import GenericModal from "@/components/GenericModal.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { DELETE_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_SPECIFIC_DISCUSSION_FEEDBACK as GET_FEEDBACK } from "@/graphQLData/discussion/queries";
import type { Comment } from "@/src/__generated__/graphql";
import CommentHeader from "@/components/comments/CommentHeader.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";

export default defineComponent({
  name: "ConfirmUndoDiscussionFeedbackModal",
  components: {
    CommentHeader,
    ErrorBanner,
    GenericModal,
    MarkdownPreview,
  },
  props: {
    discussionId: {
      type: String,
      required: true,
    },
    modName: {
      type: String,
      required: true,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    // Fetch the feedback from the server - check for feedback comments
    // that match the discussion ID and the mod username.
    const feedbackToDeleteID = ref("");
    const commentData: Ref<Comment | null> = ref(null);

    const {
      error: getError,
      result: feedbackResult,
      onResult,
    } = useQuery(
      GET_FEEDBACK,
      {
        discussionId: props.discussionId,
        modName: props.modName,
      },
      {
        fetchPolicy: "network-only",
      },
    );

    onResult((result) => {
      const comment = result?.data?.comments?.[0];
      if (!comment) {
        console.warn("No feedback found");
        return;
      }
      feedbackToDeleteID.value = comment.id;
      commentData.value = comment;
    });

    const {
      mutate: deleteFeedback,
      loading: deleteLoading,
      error: deleteError,
      onDone: onFeedbackDeleted,
    } = useMutation(DELETE_COMMENT, {
      update: (cache, { data }) => {
        if (commentData.value && data?.deleteComments?.nodesDeleted > 0) {
          cache.evict({ id: cache.identify(commentData.value) });
        }
      },
    });

    onFeedbackDeleted(() => {
      emit("close");
    });

    return {
      body: "Are you sure you want to delete your feedback?",
      commentData,
      deleteError: deleteError,
      deleteFeedback,
      getError: getError,
      feedbackResult,
      feedbackToDeleteID,
      loading: deleteLoading,
      title: "Delete your feedback?",
    };
  },
  methods: {
    handleDelete() {
      try {
        this.deleteFeedback({ id: this.feedbackToDeleteID });
      } catch (error) {
        console.error("Error deleting feedback", error);
      }
    },
    updateFeedback(text: string) {
      this.$emit("updateFeedback", text);
    },
  },
});
</script>
<template>
  <GenericModal
    :highlight-color="'red'"
    :title="title"
    :body="body"
    :open="open"
    :loading="loading"
    :primary-button-text="'Delete'"
    :secondary-button-text="'Cancel'"
    @primary-button-click="handleDelete"
    @secondary-button-click="$emit('close')"
  >
    <template #icon>
      <i class="fas fa-trash-alt dark:text-white" />
    </template>
    <template #content>
      <CommentHeader
        v-if="commentData"
        :comment-data="commentData"
        :is-highlighted="false"
        :show-context-link="true"
        :show-channel="false"
      />
      <div
        v-if="commentData"
        class="ml-2 flex flex-col gap-2 border-l pl-4"
      >
        <MarkdownPreview
          class="-ml-4 dark:text-white"
          :text="commentData?.text || '[Deleted]'"
          :disable-gallery="true"
        />
      </div>
      <ErrorBanner
        v-if="getError"
        :text="getError.message"
      />
      <ErrorBanner
        v-if="deleteError"
        :text="deleteError.message"
      />
    </template>
  </GenericModal>
</template>
