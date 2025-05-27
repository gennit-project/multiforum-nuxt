<script lang="ts" setup>
import { ref, computed } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import GenericModal from "@/components/GenericModal.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { GET_SPECIFIC_DISCUSSION_FEEDBACK as GET_FEEDBACK } from "@/graphQLData/discussion/queries";
import type { Comment } from "@/__generated__/graphql";
import CommentHeader from "@/components/comments/CommentHeader.vue";
import TextEditor from "@/components/TextEditor.vue";
import { UPDATE_COMMENT } from "@/graphQLData/comment/mutations";
import type { CreateEditCommentFormValues } from "@/types/Comment";

const props = defineProps({
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
});

const emit = defineEmits(["close"]);

const feedbackToEditID = ref("");
const commentData = ref<Comment | null>(null);
const editFormValues = ref<CreateEditCommentFormValues>({
  text: commentData.value?.text || "",
  isRootComment: true,
  depth: 1,
});

const { error: getError, onResult } = useQuery(
  GET_FEEDBACK,
  {
    discussionId: props.discussionId,
    modName: props.modName,
  },
  {
    fetchPolicy: "network-only",
  }
);

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

const updateCommentInput = computed(() => ({
  text: editFormValues.value?.text || "",
}));

const {
  mutate: editComment,
  loading: editLoading,
  error: editCommentError,
  onDone: onDoneUpdatingComment,
} = useMutation(UPDATE_COMMENT);

onDoneUpdatingComment(() => {
  emit("close");
});

function handleEdit() {
  try {
    editComment({
      commentWhere: {
        id: commentData.value?.id || "",
      },
      updateCommentInput: updateCommentInput.value,
    });
  } catch (error) {
    console.error("Error updating feedback", error);
  }
}

function updateFeedback(text: string) {
  editFormValues.value.text = text;
}

const title = "Update your feedback?";
const body = "Are you sure you want to update your feedback?";
</script>

<template>
  <GenericModal
    :data-testid="'edit-feedback-modal'"
    :highlight-color="'red'"
    :title="title"
    :body="body"
    :open="open"
    :loading="editLoading"
    :primary-button-text="'Update'"
    :secondary-button-text="'Cancel'"
    @primary-button-click="handleEdit"
    @close="$emit('close')"
  >
    <template #icon>
      <i class="fas fa-pencil-alt text-white" />
    </template>
    <template #content>
      <CommentHeader
        v-if="commentData"
        :comment-data="commentData"
        :is-highlighted="false"
        :show-context-link="true"
        :show-channel="false"
      />
      <div v-if="commentData" class="ml-2 flex flex-col gap-2 border-l pl-4">
        <TextEditor
          id="editFeedbackComment"
          :key="commentData?.id"
          class="mb-2 mt-3 p-1"
          :initial-value="commentData?.text || '[Deleted]'"
          @update="updateFeedback"
        />
      </div>
      <ErrorBanner v-if="getError" :text="getError.message" />
      <ErrorBanner v-if="editCommentError" :text="editCommentError.message" />
    </template>
  </GenericModal>
</template>
