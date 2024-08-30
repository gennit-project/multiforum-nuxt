<script lang="ts">
import type { Ref} from "vue";
import { computed, defineComponent, ref } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import GenericModal from "@/components/GenericModal.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { GET_SPECIFIC_DISCUSSION_FEEDBACK as GET_FEEDBACK } from "@/graphQLData/discussion/queries";
import type { Comment } from "@/src/__generated__/graphql";
import CommentHeader from "@/components/comments/CommentHeader.vue";
import TextEditor from "@/components/TextEditor.vue";
import { UPDATE_COMMENT } from "@/graphQLData/comment/mutations";
import type { CreateEditCommentFormValues } from "@/types/Comment";

export default defineComponent({
  name: "EditFeedbackModal",
  components: {
    CommentHeader,
    ErrorBanner,
    GenericModal,
    TextEditor,
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
    const feedbackToEditID = ref("");
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

    const editFormValues = ref<CreateEditCommentFormValues>({
      text: commentData.value?.text || "",
      isRootComment: true,
      depth: 1,
    });

    const updateCommentInput = computed(() => {
      return {
        text: editFormValues.value?.text || "",
      };
    });

    onResult((result) => {
      const comment = result?.data?.comments?.[0];
      if (!comment) {
        console.warn("No feedback found");
        return;
      }
      feedbackToEditID.value = comment.id;
      commentData.value = comment;
      editFormValues.value.text = comment.text;
    });

    const {
      mutate: editComment,
      loading: editLoading,
      error: editCommentError,
      onDone: onDoneUpdatingComment,
    } = useMutation(UPDATE_COMMENT, () => ({
      variables: {
        commentWhere: {
          id: commentData.value?.id || "",
        },
        updateCommentInput: updateCommentInput.value,
      },
    }));

    onDoneUpdatingComment(() => {
      emit("close");
    });

    return {
      body: "Are you sure you want to delete your feedback?",
      commentData,
      editFormValues,
      editCommentError,
      editComment,
      getError: getError,
      feedbackResult,
      feedbackToEditID,
      loading: editLoading,
      title: "Delete your feedback?",
    };
  },
  methods: {
    handleEdit() {
      try {
        this.editComment();
      } catch (error) {
        console.error("Error updating feedback", error);
      }
    },
    updateFeedback(text: string) {
      this.editFormValues.text = text;
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
    :primary-button-text="'Update'"
    :secondary-button-text="'Cancel'"
    @primary-button-click="handleEdit"
    @secondary-button-click="$emit('close')"
  >
    <template #icon>
      <i class="fas fa-trash-alt" />
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
        <TextEditor
          id="editFeedbackComment"
          :key="commentData?.id"
          class="mb-2 mt-3 p-1"
          :initial-value="commentData?.text || '[Deleted]'"
          @update="updateFeedback"
        />
      </div>
      <ErrorBanner
        v-if="getError"
        :text="getError.message"
      />
      <ErrorBanner
        v-if="editCommentError"
        :text="editCommentError.message"
      />
    </template>
  </GenericModal>
</template>
